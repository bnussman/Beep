import { ApolloClient, ApolloLink, InMemoryCache, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { WebSocketLink } from '@apollo/client/link/ws';
import {getMainDefinition} from '@apollo/client/utilities';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUploadLink } from 'apollo-upload-client';
import { onError } from "@apollo/client/link/error";

const wsUrl = __DEV__ ? "ws://localhost:3001/subscriptions" : "wss://staging.ridebeep.app/subscriptions";
const url = __DEV__ ? "http://localhost:3001/graphql" : "https://staging.ridebeep.app/graphql";
// const wsUrl = "wss://staging.ridebeep.app/subscriptions";
// const url = "https://staging.ridebeep.app/graphql";

const wsLink = new WebSocketLink({
  uri: wsUrl,
  options: {
      reconnect: true,
      connectionParams: async () => {
          const tit = await AsyncStorage.getItem('auth');

          if (!tit) return;

          const auth = JSON.parse(tit);
          return {
              token: auth.tokens.id
          }
      }
  }
});

const authLink = setContext(async (_, { headers }) => {
  // get the authentication token from local storage if it exists
  const tit = await AsyncStorage.getItem('auth');

  if (!tit) return;

  const auth = JSON.parse(tit);
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      Authorization: auth.tokens.id ? `Bearer ${auth.tokens.id}` : "",
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

const uploadLink = createUploadLink({
    uri: url,
    headers: {
        "keep-alive": "true"
    }
});

const errorLink = onError((e) => {
    /*
    let output = "";
    e.graphQLErrors?.forEach((e) => {
        e.extensions?.exception?.validationErrors?.forEach((r) => {
            output += r.constraints.isNotEmpty + "\n";
        });
    });

    if (output !== "") return alert(output);

    e.graphQLErrors?.forEach((e) => {
        output += e.message + "\n";
    });

    alert(output);
    */
});

export const client = new ApolloClient({
    link: ApolloLink.from([
        errorLink,
        authLink,
        splitLink,
        uploadLink
    ]),
    cache: new InMemoryCache(),
});
