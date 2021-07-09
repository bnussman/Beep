import React from 'react';
import { useParams } from "react-router-dom";
import UserProfile from '../../../components/UserProfile';
import { gql, useQuery } from '@apollo/client';
import { GetUserQuery } from '../../../generated/graphql';
import { Center, Spinner } from "@chakra-ui/react";
import { Error } from '../../../components/Error';

export const GetUser = gql`
  query GetUser($id: String!) {
    getUser(id: $id) {
      id
      name
      isBeeping
      isStudent
      role
      venmo
      cashapp
      singlesRate
      groupRate
      capacity
      masksRequired
      photoUrl
      queueSize
      phone
      username
      rating
      email
      location {
        latitude
        longitude
      }
      queue {
        id
        origin
        destination
        start
        groupSize
        isAccepted
        state
        rider {
          id
          photoUrl
          username
          first
          last
          name
        }
      }
    }
  }
`;

function UserPage() {
    const { userId } = useParams<{ userId: string }>();
    const { data, loading, error } = useQuery<GetUserQuery>(GetUser, { variables: { id: userId } });

    if (error) {
        return <Error error={error} />;
    }

    if (loading) {
        return (
            <Center h="100px">
                <Spinner size="xl" />
            </Center>
        );
    }

    return <UserProfile user={data?.getUser} admin />;
}

export default UserPage;
