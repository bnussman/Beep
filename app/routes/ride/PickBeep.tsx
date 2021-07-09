import React, { useEffect } from 'react';
import { Layout, Text, Divider, List, ListItem, Button, TopNavigation, TopNavigationAction, Spinner } from '@ui-kitten/components';
import { StyleSheet, View } from 'react-native';
import { BackIcon } from '../../utils/Icons';
import ProfilePicture from '../../components/ProfilePicture';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {MainNavParamList} from '../../navigators/MainTabs';
import {gql, useQuery} from '@apollo/client';
import {GetBeepersQuery} from '../../generated/graphql';
import {printStars} from '../../components/Stars';

interface Props {
    navigation: BottomTabNavigationProp<MainNavParamList>;
    route: any;
}

const GetBeepers = gql`
    query GetBeeperList($latitude: Float!, $longitude: Float!) {
        getBeeperList(input: {
            latitude: $latitude,
            longitude: $longitude
        })  {
            id
            first
            last
            isStudent
            singlesRate
            groupRate
            capacity
            queueSize
            photoUrl
            role
            masksRequired
            rating
            venmo
            cashapp
        }
    }
`;

export function PickBeepScreen(props: Props) {
    const { navigation, route } = props;
    const { data, loading, error, startPolling, stopPolling } = useQuery<GetBeepersQuery>(GetBeepers, { variables: { latitude: route.params.latitude, longitude: route.params.longitude }});

    useEffect(() => {
        startPolling(2000);

        return () => {
            stopPolling();
        };
    }, []);

    function goBack(id: string): void {
        route.params.handlePick(id);
        navigation.goBack();
    }


    function getDescription(item: any): string {
        return `${item.queueSize} in ${item.first}'s queue\nCapacity: ${item.capacity} riders\nSingles: $${item.singlesRate}\nGroups: $${item.groupRate}\nUser Rating: ${printStars(item.rating)}`;
    }

    const BackAction = () => (
        <TopNavigationAction icon={BackIcon} onPress={() => props.navigation.goBack()}/>
    );

    const renderItem = ({ item }: any) => (
        <ListItem
            onPress={() => goBack(item.id)}
            title={`${item.first} ${item.last}`}
            description={getDescription(item)}
            accessoryRight={() => {
                return (
                    <View style={styles.row}>
                        {item.role === "admin" && <Button size='tiny' status='danger'>Founder</Button>}
                        {item.isStudent && <Button status="basic" size='tiny' style={{marginRight: 4}}>Student</Button>}
                        {item.masksRequired && <Button status="info" size='tiny' style={{marginRight: 4}}>Masks</Button>}
                        {item.venmo && <Button status="info" size='tiny' style={{marginRight: 4}}>Venmo</Button>}
                        {item.cashapp && <Button status="success" size='tiny' style={{marginRight: 4}}>Cash App</Button>}
                    </View>
                );
            }}
            accessoryLeft={() => {
                return (
                    <ProfilePicture
                        size={50}
                        url={item.photoUrl}
                    />
                );
            }}
        />
    );

    if (!loading) {
        if (data?.getBeeperList && data.getBeeperList.length > 0) {
            return (
                <>
                    <TopNavigation title='Beeper List' 
                        alignment='center' 
                        subtitle={(data.getBeeperList.length == 1) ? `${data.getBeeperList.length} person is beeping` : `${data.getBeeperList.length} people are beeping`}
                        accessoryLeft={BackAction} 
                    />
                    <List
                        data={data.getBeeperList}
                        ItemSeparatorComponent={Divider}
                        renderItem={renderItem}
                    />
                </>
            );
        }
        else {
            return (
                <>
                    <TopNavigation
                        title='Beeper List'
                        subtitle={(data?.getBeeperList.length == 1) ? `${data.getBeeperList.length} person is beeping` : `${data?.getBeeperList.length} people are beeping`}
                        alignment='center'
                        accessoryLeft={BackAction}
                    />
                    <Layout style={styles.container}>
                        <Text category='h5'>Nobody is beeping!</Text>
                        <Text appearance='hint'>Nobody is giving rides right now. Check back later!</Text>
                    </Layout>
                </>
            );
        }
    }
    else {
        return (
            <>
                <TopNavigation
                    title='Beeper List'
                    subtitle={`0 people are beeping`}
                    alignment='center'
                    accessoryLeft={BackAction}
                />
                <Layout style={styles.container}>
                    <Spinner size='large' />
                </Layout>
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        height: '100%',
        alignItems: "center",
        justifyContent: 'center'
    },
    row: {
        flex: 1,
        flexDirection: "row-reverse",
    }
});
