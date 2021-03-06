import { IsEmail, IsMobilePhone, IsOptional, IsString, Length } from 'class-validator';
import { Upload } from '../account/helpers';
import { Field, InputType } from 'type-graphql';
import { User } from '../entities/User';
import { GraphQLUpload } from 'graphql-upload';

@InputType()
export class LoginInput implements Partial<User> {

  @Field()
  @IsString()
  public username!: string;

  @Field()
  @IsString()
  public password!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  public pushToken?: string;
}

@InputType()
export class SignUpInput implements Partial<User> {

  @Field()
  @IsString()
  public username!: string;

  @Field()
  @IsString()
  public first!: string;

  @Field()
  @IsString()
  public last!: string;

  @Field()
  @IsMobilePhone("en-US")
  public phone!: string;

  @Field()
  @IsEmail()
  public email!: string;

  @Field({ nullable: true })
  @IsString()
  public venmo?: string;

  @Field({ nullable: true })
  @IsString()
  public cashapp?: string;

  @Field()
  @IsString()
  @Length(5, 255)
  public password!: string;

  @Field(() => GraphQLUpload)
  public picture!: Upload;

  @Field({ nullable: true })
  @IsString()
  public pushToken?: string;

}

@InputType()
export class ResetPasswordInput {
    @Field()
    @IsString()
    @Length(5, 255)
    id!: string;

    @Field()
    @IsString()
    @Length(5, 255)
    password!: string;
}
