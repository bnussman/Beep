import { sendNotification } from '../utils/notifications';
import { EntityManager, QueryOrder, wrap } from '@mikro-orm/core';
import { Beep } from '../entities/Beep';
import { Arg, Authorized, Ctx, Mutation, PubSub, PubSubEngine, Resolver, Root, Subscription } from 'type-graphql';
import { Context } from '../utils/context';
import { BeeperSettingsInput, UpdateQueueEntryInput } from '../validators/beeper';
import * as Sentry from '@sentry/node';
import { QueueEntry } from '../entities/QueueEntry';
import { User } from '../entities/User';

@Resolver(Beep)
export class BeeperResolver {

    @Mutation(() => Boolean)
    @Authorized()
    public async setBeeperStatus(@Ctx() ctx: Context, @Arg('input') input: BeeperSettingsInput, @PubSub() pubSub: PubSubEngine): Promise<boolean> {
        await ctx.em.populate(ctx.user, 'queue');

        if (!input.isBeeping && (ctx.user.queue.length > 0)) {
            throw new Error("You can't stop beeping when you still have beeps to complete or riders in your queue");
        }

        wrap(ctx.user).assign(input);

        pubSub.publish("User" + ctx.user.id, ctx.user);

        await ctx.em.persistAndFlush(ctx.user);

        return true;
    }
    
    @Mutation(() => Boolean)
    @Authorized()
    public async setBeeperQueue(@Ctx() ctx: Context, @PubSub() pubSub: PubSubEngine, @Arg('input') input: UpdateQueueEntryInput): Promise<boolean> {
        await ctx.em.populate(ctx.user, ['queue', 'queue.rider'], {}, { orderBy: { start: QueryOrder.ASC }});

        const queueEntry = ctx.user.queue.getItems().find((entry: QueueEntry) => entry.id == input.queueId);

        if (!queueEntry) throw new Error("Can't find queue entry");

        if (input.value == 'accept' || input.value == 'deny') {
            const numRidersBefore = ctx.user.queue.getItems().filter((entry: QueueEntry) => entry.start < queueEntry.start && !entry.isAccepted).length;

            if (numRidersBefore != 0) {
                throw new Error("You must respond to the rider who first joined your queue.");
            }
        }
        else {
            const numRidersBefore = ctx.user.queue.getItems().filter((entry: QueueEntry) => entry.start < queueEntry.start && entry.isAccepted).length;

            if (numRidersBefore != 0) {
                throw new Error("You must respond to the rider who first joined your queue.");
            }
        }

        if (input.value == 'accept') {
            queueEntry.isAccepted = true;

            ctx.user.queueSize++;

            sendNotification(queueEntry.rider.pushToken, `${ctx.user.name()} has accepted your beep request`, "You will recieve another notification when they are on their way to pick you up.");

            ctx.em.persist(queueEntry);
            ctx.em.persist(ctx.user);
        }
        else if (input.value == 'deny' || input.value == 'complete') {
            pubSub.publish("Rider" + queueEntry.rider.id, null);

            if (input.value == 'complete') {
                const beep = new Beep(queueEntry);

                ctx.em.persist(beep);
            }

            if (queueEntry.isAccepted && ctx.user.queueSize > 0) ctx.user.queueSize--;
            
            ctx.em.persist(ctx.user);

            ctx.user.queue.remove(queueEntry);

            if (input.value == "deny") {
                sendNotification(queueEntry.rider.pushToken, `${ctx.user.name()} has denied your beep request`, "Open your app to find a diffrent beeper.");
            }
        }
        else {
            queueEntry.state++;

            switch(queueEntry.state) {
                case 1:
                    sendNotification(queueEntry.rider.pushToken, `${ctx.user.name()} is on their way!`, "Your beeper is on their way to pick you up.");
                break;
                case 2:
                    sendNotification(queueEntry.rider.pushToken, `${ctx.user.name()} is here!`, "Your beeper is here to pick you up.");
                break;
                case 3:
                    break;
                default: 
                    Sentry.captureException("Our beeper's state notification switch statement reached a point that is should not have");
            }

            ctx.em.persist(queueEntry);
        }

        this.sendRiderUpdates(ctx.user, ctx.user.queue.getItems().sort(this.inOrder), pubSub);

        await ctx.em.flush();

        return true;
    }

    private inOrder(a: QueueEntry, b :QueueEntry): number {
        return a.start - b.start;
    }

    private async sendRiderUpdates(beeper: User, queue: QueueEntry[], pubSub: PubSubEngine) {
        pubSub.publish("Beeper" + beeper.id, queue);

        for (const entry of queue) {
            entry.position = queue.filter((_entry: QueueEntry) => _entry.start < entry.start).length;

            if (entry.state == 1) {
                pubSub.publish("Rider" + entry.rider.id, entry);
            }
            else {
                pubSub.publish("Rider" + entry.rider.id, entry);
            }
        }
    }

    @Mutation(() => Boolean)
    @Authorized()
    public async cancelBeep(@Ctx() ctx: Context, @Arg('id') id: string, @PubSub() pubSub: PubSubEngine): Promise<boolean> {
        const entry = ctx.em.getReference(QueueEntry, id);

        await ctx.user.queue.init({ orderBy: { start: QueryOrder.ASC }, populate: ['rider', 'beeper'] });

        pubSub.publish("Beeper" + ctx.user.id, ctx.user.queue.getItems().filter(entry => entry.id != id));

        for (const entry of ctx.user.queue) {
            if (entry.id == id) {
                sendNotification(entry.rider.pushToken, "Beep Canceled", `Your beeper, ${ctx.user.name()}, has canceled the beep`);
                pubSub.publish("Rider" + entry.rider.id, null);
            }
            else {
                entry.position = await ctx.em.count(QueueEntry, { beeper: ctx.user, start: { $lt: entry.start } });

                pubSub.publish("Rider" + entry.rider.id, entry);
            }
        }

        ctx.em.removeAndFlush(entry);

        ctx.user.queueSize--;

        ctx.em.persistAndFlush(ctx.user);

        return true;
    }

    @Subscription(() => [QueueEntry], {
        topics: ({ args }) => "Beeper" + args.topic,
    })
    public async getBeeperUpdates(@Arg("topic") topic: string, @Root() entry: QueueEntry[]): Promise<QueueEntry[]> {
        return entry;
    }
}
