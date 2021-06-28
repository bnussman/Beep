import React, {useContext} from 'react';
import { Layout, Text, Divider, List, ListItem, Spinner, TopNavigation, TopNavigationAction } from '@ui-kitten/components';
import { StyleSheet } from 'react-native';
import ProfilePicture from '../../components/ProfilePicture';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {MainNavParamList} from '../../navigators/MainTabs';
import { gql, useQuery } from '@apollo/client';
import { GetRatingsQuery, Rating } from '../../generated/graphql';
import {printStars} from '../../components/Stars';
import {BackIcon} from '../../utils/Icons';
import {UserContext} from '../../utils/UserContext';

interface Props {
    navigation: BottomTabNavigationProp<MainNavParamList>;
}

const GetRatingsOnMe = gql`
    query GetRatings($id: String) {
        getRatings(id: $id) {
            items {
                id
                stars
                timestamp
                message
                rater {
                    id
                    name
                    photoUrl
                }
                rated {
                    id
                    name
                    photoUrl
                }
            }
            count
        }
    }
`;

export function RatingsScreen(props: Props) {
    const { data, loading, error, refetch } = useQuery<GetRatingsQuery>(GetRatingsOnMe, { variables: { me: true } });
    const user = useContext(UserContext);
    const BackAction = () => (
        <TopNavigationAction icon={BackIcon} onPress={() => props.navigation.goBack()}/>
    );

    const renderItem = ({ item } : { item: Rating }) => {
        const otherUser = user.id === item.rater.id ? item.rated : item.rater;
        return (
            <ListItem
                accessoryLeft={() => (
                    <ProfilePicture
                        size={50}
                        url={otherUser.photoUrl}
                    />
                )
                }
                onPress={() => props.navigation.push("Profile", { id: otherUser.id })}
                title={
                    user.id === item.rater.id ?
                    `You rated ${otherUser.name}`
                    :
                    `${otherUser.name} rated you`
                }
                description={`Message: ${item.message || "N/A"}\nStars: ${printStars(item.stars)} ${item.stars}\n`}
            />
        );
    };

    if (!loading) {
        if (data?.getRatings?.items && data.getRatings.count != 0) {
            return (
                <>
                    <TopNavigation
                        title='Ratings' 
                        subtitle={`${data.getRatings.count} ratings`}
                        alignment='center' 
                        accessoryLeft={BackAction} 
                    />
                    <Layout style={styles.container}>
                        <List
                            style={{width:"100%"}}
                            data={data?.getRatings.items}
                            ItemSeparatorComponent={Divider}
                            renderItem={renderItem}
                        />
                    </Layout>
                </>
            );
        }
        else {
            return (
                <Layout style={styles.container}>
                    <Text category='h5'>Nothing to display!</Text>
                    <Text appearance='hint'>You have no ratings</Text>
                </Layout>
            );
        }
    }
    else {
        return (
            <Layout style={styles.container}>
                <Text category='h5'>Loading your ratings</Text>
                <Spinner />
            </Layout>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        height: '100%',
        alignItems: "center",
        justifyContent: 'center'
    }
});
