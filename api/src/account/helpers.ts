import { deactivateTokens } from "../auth/helpers";
import { BeepORM } from "../app";
import { User } from '../entities/User';
import { Stream } from "stream";
import { Rating } from "../entities/Rating";
import { Report } from "../entities/Report";
import { Beep } from "../entities/Beep";
import { QueueEntry } from "../entities/QueueEntry";
import { ForgotPassword } from "../entities/ForgotPassword";
import { VerifyEmail } from "../entities/VerifyEmail";

/**
 * Used for handling GraphQL Uploads
 */
export interface Upload {
    filename: string;
    mimetype: string;
    encoding: string;
    createReadStream: () => Stream;
}

/**
 * checks last 4 characters of an email address
 * @param email
 * @returns boolean true if ends in ".edu" and false if otherwise
 */
export function isEduEmail(email: string): boolean {
    return (email.substr(email.length - 3) === "edu");
}

/**
 * delete a user based on their id
 * @param id string the user's id
 * @returns boolean true if delete was successful
 */
export async function deleteUser(user: User): Promise<boolean> {

    await BeepORM.em.nativeDelete(ForgotPassword, { user: user });

    await BeepORM.em.nativeDelete(VerifyEmail, { user: user });

    await BeepORM.em.nativeDelete(QueueEntry, { beeper: user });
    await BeepORM.em.nativeDelete(QueueEntry, { rider: user });
    
    await BeepORM.em.nativeDelete(Beep, { beeper: user });
    await BeepORM.em.nativeDelete(Beep, { rider: user });

    await BeepORM.em.nativeDelete(Report, { reporter: user });
    await BeepORM.em.nativeDelete(Report, { reported: user });
    
    await BeepORM.em.nativeDelete(Rating, { rater: user });
    await BeepORM.em.nativeDelete(Rating, { rated: user });

    await deactivateTokens(user);

    await BeepORM.em.nativeDelete(User, user);

    return true;
}
