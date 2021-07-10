import React, { useEffect } from 'react'
import { Card } from '../../components/Card';
import { gql, useQuery } from '@apollo/client';
import { GetBeepersQuery } from '../../generated/graphql';
import { Box, Center, Heading, Spinner, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import TdUser from '../../components/TdUser';

const BeepersGraphQL = gql`
    query GetBeeperList($latitude: Float!, $longitude: Float!, $radius: Float) {
        getBeeperList(input: {
            latitude: $latitude,
            longitude: $longitude,
            radius: $radius
        })  {
            id
            username
            name
            photoUrl
            singlesRate
            groupRate
            capacity
            isStudent
            queueSize
            masksRequired
        }
    }
`;

function Beepers() {
    const { data, stopPolling, startPolling, loading } = useQuery<GetBeepersQuery>(BeepersGraphQL, {  variables: { latitude: 0, longitude: 0, radius: 0 }});

  useEffect(() => {
    startPolling(4000);
    return () => {
      stopPolling();
    };
    // eslint-disable-next-line
  }, []);

  return (
    <Box>
      <Heading>Beepers</Heading>
      <Card>
        <Table>
          <Thead>
            <Tr>
              <Th>Beeper</Th>
              <Th>Queue size</Th>
              <Th>Ride capacity</Th>
              <Th>Rate</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data?.getBeeperList && (data.getBeeperList).map(beeper => {
              return (
                <Tr key={beeper.id}>
                  <TdUser user={beeper} />
                  <Td>{beeper.queueSize} riders</Td>
                  <Td>{beeper.capacity} riders</Td>
                  <Td>${beeper.singlesRate} / ${beeper.groupRate}</Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
        {loading &&
          <Center h="100px">
            <Spinner size="xl" />
          </Center>
        }
      </Card>
    </Box>
  );
}

export default Beepers;
