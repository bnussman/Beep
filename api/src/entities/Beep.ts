import { Entity, Filter, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import { User } from "./User";
import { v4 } from 'uuid';
import { QueueEntry } from "./QueueEntry";

@ObjectType()
@Entity()
@Filter({ name: 'in', cond: args => ({ $or: [{ beeper: args.id } , { rider: args.id }] })})
export class Beep {
    
    @PrimaryKey()
    @Field()
    id: string = v4();

    @Field(() => User)
    @ManyToOne(() => User)
    beeper!: User;

    @Field(() => User)
    @ManyToOne(() => User)
    rider!: User;
    
    @Field()
    @Property()
    origin!: string;

    @Field()
    @Property()
    destination!: string;

    @Field()
    @Property()
    groupSize!: number;

    @Field()
    @Property() 
    start!: Date;

    @Field()
    @Property() 
    end!: Date;

    constructor(entry: QueueEntry) {
        this.id = entry.id;
        this.beeper = entry.beeper;
        this.rider = entry.rider;
        this.origin = entry.origin;
        this.destination = entry.destination;
        this.groupSize = entry.groupSize;
        this.start = new Date(entry.start * 1000);
        this.end = new Date();
    }
}
