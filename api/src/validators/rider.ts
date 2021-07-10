import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { Point } from '../location/resolver';
import { Field, InputType } from 'type-graphql';
import { QueueEntry } from '../entities/QueueEntry';

@InputType()
export class GetBeepInput implements Partial<QueueEntry> {

  @Field()
  @IsString()
  @IsNotEmpty({ message: "Please specify an origin location"})
  public origin?: string;

  @Field()
  @IsString()
  @IsNotEmpty({ message: "Please specify a destination location"})
  public destination?: string;

  @Field()
  @IsNumber()
  @Min(1)
  @Max(30, { message: "Your group is too big" })
  public groupSize?: number;
}

@InputType()
export class FindBeepInput implements Point {

    @Field()
    @IsNumber()
    longitude!: number;

    @Field()
    @IsNumber()
    latitude!: number;
    
    @Field({ nullable: true })
    @IsNumber()
    @Min(0)
    @Max(30)
    radius: number = 10;
}
