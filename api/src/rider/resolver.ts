import { sendNotification } from '../utils/notifications';
import { EntityManager, QueryOrder } from '@mikro-orm/core';
import { QueueEntry } from '../entities/QueueEntry';
import { User } from '../entities/User';
import { Arg, Authorized, Ctx, Mutation, PubSub, PubSubEngine, Query, Resolver, Root, Subscription } from 'type-graphql';
import { GetBeepInput, FindBeepInput } from '../validators/rider';
import { Context } from '../utils/context';
import { Beep } from '../entities/Beep';
import { Rating } from '../entities/Rating';
   
@Resolver()
export class RiderResolver {

    @Mutation(() => QueueEntry)
    @Authorized()
    public async chooseBeep(@Ctx() ctx: Context, @PubSub() pubSub: PubSubEngine, @Arg('beeperId') beeperId: string, @Arg('input') input: GetBeepInput): Promise<QueueEntry> {
        const beeper = await ctx.em.findOneOrFail(User, beeperId);

        if (!beeper.isBeeping) {
            throw new Error("The user you have chosen is no longer beeping at this time.");
        }

        const q = new QueueEntry({
            groupSize: input.groupSize,
            origin: input.origin,
            destination: input.destination,
            rider: ctx.user,
            beeper: beeper,
        });

        pubSub.publish("Rider" + ctx.user.id, {
            ...q,
            beeper: {
                ...q.beeper, 
                location: undefined
            }
        });

        await ctx.em.populate(beeper, ['queue', 'queue.rider']);

        beeper.queue.add(q);

        sendNotification(beeper.pushToken, `${ctx.user.name()} has entered your queue`, "Please open your app to accept or deny this rider.", "enteredBeeperQueue");

        pubSub.publish("Beeper" + beeper.id, beeper.queue.getItems());

        await ctx.em.persistAndFlush(beeper);

        return q;
    }
   
    @Query(() => User)
    @Authorized()
    public async findBeep(@Ctx() ctx: Context): Promise<User> {
        const beeper = await ctx.em.findOne(User, { isBeeping: true });

        if (!beeper) {
            throw new Error("Nobody is beeping right now!");
        }

        return beeper;
    }

    @Query(() => QueueEntry, { nullable: true })
    @Authorized()
    public async getRiderStatus(@Ctx() ctx: Context): Promise<QueueEntry | null> {
        const entry = await ctx.em.findOne(QueueEntry, { rider: ctx.user }, { populate: ['beeper', 'beeper.queue'] });

        if (!entry) {
            return null;
        }

        entry.position = entry.beeper.queue.getItems().filter((_entry: QueueEntry) => _entry.start < entry.start).length;

        return entry;
    }
    
    @Mutation(() => Boolean)
    @Authorized()
    public async riderLeaveQueue(@Ctx() ctx: Context, @PubSub() pubSub: PubSubEngine): Promise<boolean> {
        const entry = await ctx.em.findOne(QueueEntry, { rider: ctx.user }, ['beeper']);

        if (!entry) {
            throw new Error("Unable to leave queue");
        }

        if (entry.isAccepted) entry.beeper.queueSize--;
        
        sendNotification(entry.beeper.pushToken, `${ctx.user.name()} left your queue`, "They decided they did not want a beep from you!");

        ctx.em.persist(entry.beeper);

        pubSub.publish("Rider" + ctx.user.id, null);

        this.sendBeeperUpdate(entry.id, entry.beeper.id, pubSub, ctx.em);

        await ctx.em.removeAndFlush(entry);

        return true;
    }

    private async sendBeeperUpdate(entryId: string, beeperId: string, pubSub: PubSubEngine, em: EntityManager) {
        const queue = await em.find(QueueEntry, { beeper: beeperId }, { orderBy: { start: QueryOrder.ASC }, populate: ['rider'] });

        pubSub.publish("Beeper" + beeperId, queue.filter((entry: QueueEntry) => entry.id != entryId));
    }
    
    @Query(() => [User])
    @Authorized()
    public async getBeeperList(@Ctx() ctx: Context, @Arg('input') input: FindBeepInput): Promise<User[]> {
        if (input.radius == 0) {
            return await ctx.em.find(User, { isBeeping: true });
        }

        const connection = ctx.em.getConnection();

        const raw: User[] = await connection.execute(`
            SELECT * FROM public."user" WHERE ST_DistanceSphere(location, ST_MakePoint(${input.latitude},${input.longitude})) <= ${input.radius} * 1609.34 AND is_beeping = true
        `);

        const data = raw.map(user => ctx.em.map(User, user));

        return data;
    }

    @Query(() => Beep, { nullable: true })
    @Authorized()
    public async getLastBeepToRate(@Ctx() ctx: Context): Promise<Beep | null> {
        const beep = await ctx.em.findOne(Beep, { rider: ctx.user.id }, ['beeper'], { end: QueryOrder.DESC });

        if (!beep) return null;

        const count = await ctx.em.count(Rating, { rater: ctx.user.id, rated: beep.beeper.id, timestamp: { $gte: beep.end} });

        if (count > 0) {
            return null;
        }

        return beep;
    }

    @Subscription(() => QueueEntry, {
        nullable: true,
        topics: ({ args }) => "Rider" + args.topic,
    })
    public getRiderUpdates(@Arg("topic") topic: string, @Root() entry: QueueEntry): QueueEntry | null {
        return entry;
    }
}
