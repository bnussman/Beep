import { Configuration, Connection, IDatabaseDriver, LoadStrategy } from "@mikro-orm/core";

export default {
    entities: ['./build/entities/*.js'],
    entitiesTs: ['./src/entities/*.ts'],
    user: process.env.POSTGRESQL_USER,
    password: process.env.POSTGRESQL_PASSWORD,
    type: 'postgresql',
    clientUrl: `${process.env.POSTGRESQL_URL}/${process.env.POSTGRESQL_DATABASE}`,
    loadStrategy: LoadStrategy.JOINED,
    debug: true,
} as unknown as Configuration<IDatabaseDriver<Connection>>
