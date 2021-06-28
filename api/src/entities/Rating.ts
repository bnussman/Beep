import { Entity, Filter, ManyToOne, PrimaryKey, Property, Unique } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import { v4 } from "uuid";
import { Beep } from "./Beep";
import { User } from "./User";

@ObjectType()
@Entity()
@Filter({ name: 'in', cond: args => ({ $or: [{ rater: args.id } , { rated: args.id }] })})
@Unique({ properties: ['beep', 'rater'] })
export class Rating {

    @PrimaryKey()
    @Field()
    id: string = v4();

    @Field(() => User)
    @ManyToOne(() => User)
    rater!: User;

    @Field(() => User)
    @ManyToOne(() => User)
    rated!: User;

    @Field()
    @Property()
    stars!: number;

    @Field({ nullable: true })
    @Property({ nullable: true })
    message?: string;

    @Field()
    @Property() 
    timestamp: Date;

    @Field(() => Beep)
    @ManyToOne(() => Beep)
    beep!: Beep;

    constructor(rater: User, rated: User, stars: number, beep: Beep, message?: string) {
        this.rater = rater;
        this.rated = rated;
        this.stars = stars;
        this.message = message;
        this.beep = beep;
        this.timestamp = new Date();
    }
}
