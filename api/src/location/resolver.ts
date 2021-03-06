import { IsLatitude, IsLongitude } from 'class-validator';
import { Arg, Authorized, Ctx, Field, Mutation, ObjectType, PubSub, PubSubEngine, Resolver, Root, Subscription } from 'type-graphql';
import { Context } from '../utils/context';
import { LocationInput } from '../validators/location';

@ObjectType()
export class Point {
    constructor(latitude: number, longitude: number) {
        this.latitude = latitude;
        this.longitude = longitude;
    }

    @Field()
    @IsLongitude()
    public longitude: number;

    @Field()
    @IsLatitude()
    public latitude: number;
}

@Resolver(Point)
export class LocationResolver {

    @Mutation(() => Boolean)
    @Authorized()
    public async setLocation(@Ctx() ctx: Context, @Arg('location') location: LocationInput, @PubSub() pubSub: PubSubEngine): Promise<boolean> {
        ctx.user.location = new Point(location.latitude, location.longitude);

        pubSub.publish("Location" + ctx.user.id, location);

        await ctx.em.persistAndFlush(ctx.user);

        return true;
    }

    @Subscription(() => Point, {
        nullable: true,
        topics: ({ args }) => "Location" + args.id,
    })
    public getLocationUpdates(@Arg("id") id: string, @Root() entry: LocationInput): Point {
        return {
            latitude: entry.latitude,
            longitude: entry.longitude,
        };
    }
}
