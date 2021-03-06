import { initializeSentry } from "./utils/sentry";
import { MikroORM } from "@mikro-orm/core";
import { TokenEntry } from "./entities/TokenEntry";
import { GraphQLSchema } from "graphql";
import { buildSchema } from 'type-graphql';
import { authChecker } from "./utils/authentication";
import { ORM } from "./utils/ORM";
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';
import Koa from 'koa';
import { ApolloServer } from 'apollo-server-koa';
import { graphqlUploadKoa } from 'graphql-upload';
import koaBody from 'koa-bodyparser';
import cors from '@koa/cors';
import config from './mikro-orm.config';
import * as Sentry from '@sentry/node';
import { ValidationError } from 'class-validator';

const prod = process.env.GITLAB_ENVIRONMENT_NAME;

export const BeepORM = {} as ORM;

export default class BeepAPIServer {

    constructor() {
        this.setup();
    }

    private async setup(): Promise<void> {

        BeepORM.orm = await MikroORM.init(config);
        BeepORM.em = BeepORM.orm.em;

        // const migrator = BeepORM.orm.getMigrator();
        // await migrator.createMigration();
        // await migrator.up();

        initializeSentry();

        const options = {
            host: 'redis-0.nussman.us',
            port: 6379,
            password: 'jJHBYlvrfbcuPrJsym7ZXYKCKPpAtoiDEYduKaYlDxJFvZ+QvtHxpIQM5N/+9kPEzuDWAvHA4vgSUu0q'
        };

        const schema: GraphQLSchema = await buildSchema({
            resolvers: [__dirname + '/**/resolver.{ts,js}'],
            authChecker: authChecker,
            pubSub: !prod ? undefined : new RedisPubSub({
                publisher: new Redis(options),
                subscriber: new Redis(options)
            })
        });

        const app = new Koa();

        app.use(koaBody());
        app.use(cors());

        app.use(
            graphqlUploadKoa({
                maxFileSize: 100000000,
                maxFiles: 1
            })
        );

        const server = new ApolloServer({
            uploads: false,
            schema,
            subscriptions: {
                path: "/subscriptions",
                // @ts-expect-error Apollo >:(
              onConnect: async (params: { token: string }) => {
                if (!params || !params.token) throw new Error("No auth token");

                const tokenEntryResult = await BeepORM.em.findOne(TokenEntry, params.token, { populate: ['user'] });

                if (tokenEntryResult) return { user: tokenEntryResult.user, token: tokenEntryResult };
              }
            },
            context: async (data) => {
                // Connection contains data passed from subscriptions onConnect return value
                const { ctx, connection } = data;

                const em = BeepORM.em.fork();

                if (!ctx) return { em, user: connection?.context?.user };

                const authHeader = ctx.request.header.authorization;

                if (!authHeader) {
                    return { em, user: connection?.context?.user };
                }

                const token: string | undefined = authHeader.split(" ")[1];

                if (!token) return { em, user: connection?.context?.user };

                const tokenEntryResult = await em.findOne(TokenEntry, token, { populate: ['user'] });

                if (tokenEntryResult) return { user: tokenEntryResult.user, token: tokenEntryResult, em };

                return { em };
            },
            formatError: (error) => {
                Sentry.captureException(error);

                if (error?.message === "Argument Validation Error") {
                    const errors = error?.extensions?.exception?.validationErrors as ValidationError[];

                    let output: string[] = [];

                    for (const error of errors) {
                        if (!error.constraints) continue;

                        const items = Object.values<string>(error.constraints);

                        output = [...output, ...items];
                    }
                    return new Error(output.toString());
                }

                return error;
            }
        });

        server.applyMiddleware({ app });

        const live = app.listen(3001, () => {
            console.info(`🚕 API Server ready and has started! ${server.graphqlPath}`);
        });

        server.installSubscriptionHandlers(live);
    }
}
