import { ApolloClient, ApolloLink, InMemoryCache, split } from '@apollo/client';
import { createUploadLink } from 'apollo-upload-client';
import { setContext } from '@apollo/client/link/context';
import { getMainDefinition } from '@apollo/client/utilities';
import { WebSocketLink } from '@apollo/client/link/ws';

const dev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
const wsUrl = dev ? "ws://localhost:3001/subscriptions" : "wss://staging.ridebeep.app/subscriptions";
const url = dev ? "http://localhost:3001/graphql" : "https://staging.ridebeep.app/graphql";
//const wsUrl = "wss://staging.ridebeep.app/subscriptions";
//const url = "https://staging.ridebeep.app/graphql";

const uploadLink = createUploadLink({
  uri: url,
  headers: {
    "keep-alive": "true"
  }
});

const authLink = setContext(async (_, { headers }) => {
  const stored = localStorage.getItem('user');
  if (stored) {
    const auth = JSON.parse(stored);
    return {
      headers: {
        ...headers,
        Authorization: auth.tokens.id ? `Bearer ${auth.tokens.id}` : undefined
      }
    }
  }
});

const wsLink = new WebSocketLink({
  uri: wsUrl,
  options: {
    reconnect: true,
    connectionParams: () => {
      const tokens = localStorage.getItem('user');
      if (tokens) {
        const auth = JSON.parse(tokens);
        return {
          token: auth.tokens.id
        }
      }
    }
  }
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
);

export const client = new ApolloClient({
  link: ApolloLink.from([
    authLink,
    splitLink,
    //@ts-ignore
    uploadLink
  ]),
  cache: new InMemoryCache({
    addTypename: false
  }),
});
