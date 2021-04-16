import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import { v4 } from "uuid";
import { Beep } from "./Beep";
import { User } from "./User";

@ObjectType()
@Entity()
export class Report {

    @PrimaryKey()
    @Field()
    id: string = v4();

    @Field()
    @ManyToOne()
    reporter!: User;

    @Field()
    @ManyToOne()
    reported!: User;

    @Field(() => User, { nullable: true })
    @ManyToOne(() => User, { nullable: true })
    handledBy?: User | null;

    @Field()
    @Property()
    reason!: string;

    @Field({ nullable: true })
    @Property({ nullable: true })
    notes?: string;

    @Field()
    @Property({ defaultRaw: 'now()' }) 
    timestamp!: Date;

    @Field()
    @Property({ default: false })
    handled: boolean = false;

    @Field({ nullable: true })
    @ManyToOne({ nullable: true })
    beep?: Beep;

    constructor(reporter: User, reported: User, reason: string, beep?: string) {
        this.reporter = reporter;
        this.reported = reported;
        this.reason = reason;
        if (beep) {
            this.beep = beep as unknown as Beep;
        }
    }
}
