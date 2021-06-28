import { Beep } from '../entities/Beep';
import { QueryOrder } from '@mikro-orm/core';
import { Arg, Args, Authorized, Ctx, Mutation, ObjectType, Query, Resolver } from 'type-graphql';
import { Paginated } from '../utils/paginated';
import { UserRole } from '../entities/User';
import { Context } from '../utils/context';
import PaginationArgs from '../args/Pagination';

@ObjectType()
class BeepsResponse extends Paginated(Beep) {}

@Resolver(Beep)
export class BeepResolver {
   
    @Query(() => BeepsResponse)
    @Authorized(UserRole.ADMIN)
    public async getBeeps(@Ctx() ctx: Context, @Args() { offset, show }: PaginationArgs, @Arg('id', { nullable: true }) id?: string): Promise<BeepsResponse> {
        const [beeps, count] = await ctx.em.findAndCount(
            Beep,
            {},
            {
                orderBy: { end: QueryOrder.DESC },
                limit: show,
                offset: offset,
                populate: ['beeper', 'rider'],
                filters: id ? { in: { id } } : undefined
            });

        return {
            items: beeps,
            count: count
        };
    }

    @Query(() => Beep)
    @Authorized(UserRole.ADMIN)
    public async getBeep(@Ctx() ctx: Context, @Arg('id') id: string): Promise<Beep> {
        const beep = await ctx.em.findOne(Beep, id, { populate: ['beeper', 'rider'] });

        if (!beep) {
            throw new Error("This beep entry does not exist");
        }

        return beep;
    }

    @Mutation(() => Boolean)
    @Authorized(UserRole.ADMIN)
    public async deleteBeep(@Ctx() ctx: Context, @Arg('id') id: string): Promise<boolean> {
        const beep = ctx.em.getReference(Beep, id);

        await ctx.em.removeAndFlush(beep);

        return true;
    }
}
