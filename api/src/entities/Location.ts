import { Entity, OneToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { PointType } from "../location/types";
import { Field, ObjectType } from "type-graphql";
import { v4 } from "uuid";
import { User } from "./User";
import { Point } from '../location/resolver';

@ObjectType()
@Entity()
export class Location {

    @PrimaryKey()
    @Field()
    id: string = v4();

    @Field(() => User)
    @OneToOne(() => User)
    user!: User;

    @Field()
    @Property({
        type: PointType,
        columnType: 'geometry',
    })
    point!: Point;

    @Field()
    @Property({ columnType: 'numeric' })
    altitude!: number;

    @Field({ nullable: true })
    @Property({ columnType: 'numeric', nullable: true })
    accuracy!: number;

    @Field({ nullable: true })
    @Property({ columnType: 'numeric', nullable: true })
    altitudeAccuracy!: number;

    @Field()
    @Property({ columnType: 'numeric' })
    heading!: number;

    @Field()
    @Property({ columnType: 'numeric' })
    speed!: number;

    @Field()
    @Property() 
    timestamp: Date = new Date();

    constructor(data: Partial<Location>) {
        Object.assign(this, data);
    }
}
