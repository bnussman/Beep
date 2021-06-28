import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { Card } from './Card';
import { gql, useQuery } from '@apollo/client';
import { GetBeepsQuery, GetRatingsQuery } from '../generated/graphql';
import Pagination from './Pagination';
import React, { useState } from 'react';
import { Box, Center, Spinner, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import TdUser from './TdUser';
import {printStars} from '../routes/admin/ratings';
import {NavLink} from 'react-router-dom';
import {ExternalLinkIcon} from '@chakra-ui/icons';

dayjs.extend(duration);

interface Props {
  userId: string;
}

const Ratings = gql`
    query GetRatings($id: String, $show: Int, $offset: Int) {
        getRatings(id: $id, show: $show, offset: $offset) {
            items {
                id
                timestamp
                message
                stars
                rater {
                    id
                    name
                    photoUrl
                    username
                }
                rated {
                    id
                    name
                    photoUrl
                    username
                }
            }
            count
        }
    }
`;

function RatingsTable(props: Props) {
  const pageLimit = 5;
  const { data, loading, refetch } = useQuery<GetRatingsQuery>(Ratings, { variables: { id: props.userId, offset: 0, show: pageLimit } });
  const [currentPage, setCurrentPage] = useState<number>(1);

  async function fetchRatings(page: number) {
    refetch({
      id: props.userId,
      offset: page
    })
  }

  if (data?.getRatings && data.getRatings.items.length === 0) {
    return (
      <Center h="100px">
        This user has no ratings.
      </Center>
    );
  }

  if (loading) {
    return (
      <Center h="100px">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box>
      <Pagination
        resultCount={data?.getRatings?.count}
        limit={pageLimit}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onPageChange={fetchRatings}
      />
      <Card>
        <Table>
          <Thead>
            <Tr>
                <Th>Rater</Th>
                <Th>Rated</Th>
                <Th>Message</Th>
                <Th>Stars</Th>
                <Th>Date</Th>
                <Th> </Th>
            </Tr>
          </Thead>
          <Tbody>
            {data?.getRatings && (data.getRatings.items).map(rating => {
              return (
                  <Tr key={rating.id}>
                      <TdUser user={rating.rater} />
                      <TdUser user={rating.rated} />
                      <Td>{rating.message || "N/A"}</Td>
                      <Td>{printStars(rating.stars)}</Td>
                      <Td>{dayjs().to(rating.timestamp)}</Td>
                      <Td>
                          <NavLink to={`/admin/ratings/${rating.id}`}>
                              <ExternalLinkIcon />
                          </NavLink>
                      </Td>
                  </Tr>
              )
            })}
          </Tbody>
        </Table>
      </Card>
      <Pagination
        resultCount={data?.getRatings?.count}
        limit={pageLimit}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onPageChange={fetchRatings}
      />
    </Box>
  );
}

export default RatingsTable;
