import { NavLink } from 'react-router-dom';
import { useHistory } from "react-router-dom";
import { formatPhone } from '../utils/formatters';
import RideHistoryTable from './RideHistoryTable';
import QueueTable from './QueueTable';
import { UserRole } from '../types/User';
import { gql, useMutation } from '@apollo/client';
import { RemoveUserMutation, User } from '../generated/graphql';
import { printStars } from '../routes/admin/ratings';
import { Tooltip, Stack, AvatarBadge, Heading, Badge, Box, Text, Avatar, Button, Flex, Spacer, Tabs, Tab, TabList, TabPanel, TabPanels } from '@chakra-ui/react';
import React from 'react';
import DeleteDialog from './DeleteDialog';
import { DeleteIcon } from '@chakra-ui/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import LocationView from '../routes/admin/users/Location';
import RatingsTable from './RatingsTable';

dayjs.extend(relativeTime);

const RemoveUser = gql`
    mutation RemoveUser($id: String!) {
        removeUser(id: $id)
    }
`;

interface Props {
    user: Partial<User>;
    admin?: boolean;
}

function UserProfile(props: Props) {
    const { user, admin } = props;
    const history = useHistory();
    const [remove, { loading }] = useMutation<RemoveUserMutation>(RemoveUser);

    const [isOpen, setIsOpen] = React.useState(false);
    const onClose = () => setIsOpen(false);
    const cancelRef = React.useRef();

    async function doDelete() {
        await remove({ variables: { id: user.id }, refetchQueries: () => ["getUsers"], awaitRefetchQueries: true });
        history.goBack();
    }

    return (
        <Box>
            <Flex align="center">
                <Box>
                    <Avatar
                        src={user.photoUrl}
                        size="2xl"
                    >
                        {user.isBeeping && <AvatarBadge boxSize="1.0em" bg="green.500" />}
                    </Avatar>
                </Box>
                <Box ml="4">
                    <Heading size="md">{user.name}</Heading>
                    <Text>@{user.username}</Text>
                    <Text fontSize="xs">{user.id}</Text>
                    <Stack direction="row" mt="2" mb="2">
                        {user.role === UserRole.ADMIN && <Badge variant="solid" colorScheme="red">admin</Badge>}
                        {user.isStudent && <Badge variant="solid" colorScheme="blue">student</Badge>}
                    </Stack>
                </Box>
                <Spacer />
                <Box>
                    <NavLink to={admin ? `/admin/users/${user.id}/edit` : `/profile/edit`}>
                        <Button m='1'>
                            Edit {admin ? 'user' : 'profile'}
                        </Button>
                    </NavLink>
                    {admin &&
                    <Button
                        m={1}
                        colorScheme="red"
                        leftIcon={<DeleteIcon />}
                        onClick={() => setIsOpen(true)}
                    >
                        Delete
                    </Button>
                    }
                    {!admin &&
                        <Button>
                            <NavLink to='password/change'>
                                Change password
                            </NavLink>
                        </Button>
                    }
                </Box>
            </Flex>

            <Tabs isLazy colorScheme="brand" mt="4" lazyBehavior='keepMounted'>
                <TabList>
                    <Tab>Details</Tab>
                    <Tab>Location</Tab>
                    <Tab>Queue</Tab>
                    <Tab>Beeps</Tab>
                    <Tab>Ratings</Tab>
                </TabList>

                <TabPanels>
                    <TabPanel>
                        <Stack spacing={2}>
                            <Box>
                                <strong>Rating:</strong>
                                {user.rating ?
                                    <Text>
                                        <Tooltip label={user.rating} aria-label="A tooltip">
                                            {printStars(user.rating)}
                                        </Tooltip>
                                    </Text>
                                    :
                                    <Text>
                                        No Rating
                                    </Text>
                                }
                            </Box>
                            <Box>
                                <strong>Email:</strong>
                                <Text>{user.email}</Text>
                            </Box>
                            <Box>
                                <strong>Phone:</strong>
                                <Text> {formatPhone(user.phone || '')}</Text>
                            </Box>
                            <Box>
                                <strong>Queue Size</strong>
                                <Text>{user.queueSize}</Text>
                            </Box>
                            <Box>
                                <strong>Capacity:</strong>
                                <Text>{user.capacity}</Text>
                            </Box>
                            <Box>
                                <strong>Rate:</strong>
                                <Text>${user.singlesRate} / ${user.groupRate}</Text>
                            </Box>
                            <Box>
                                <strong>Venmo usename:</strong>
                                <Text>{user.venmo || "N/A"}</Text>
                            </Box>
                            <Box>
                                <strong>CashApp usename:</strong>
                                <Text>{user.cashapp || "N/A"}</Text>
                            </Box>
                            <Box>
                                <strong>Masks:</strong>
                                <Text>
                                    {user.masksRequired ? 'Masks required' : 'Masks not required'}
                                </Text>
                            </Box>
                        </Stack>
                    </TabPanel>
                    <TabPanel>
                        <LocationView user={user} location={user.location} />
                    </TabPanel>
                    <TabPanel>
                        <QueueTable queue={user.queue} />
                    </TabPanel>
                    <TabPanel>
                        <RideHistoryTable userId={user.id} />
                    </TabPanel>
                    <TabPanel>
                        <RatingsTable userId={user.id} />
                    </TabPanel>
                </TabPanels>
            </Tabs>
            <DeleteDialog
                title="User"
                isOpen={isOpen}
                onClose={onClose}
                doDelete={doDelete}
                deleteLoading={loading}
                cancelRef={cancelRef}
            />
        </Box>
    );
}

export default UserProfile;
