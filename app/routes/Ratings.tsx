import React, {useContext} from 'react';
import { Layout, Text, Divider, List, ListItem, Spinner, TopNavigation, TopNavigationAction } from '@ui-kitten/components';
import { StyleSheet } from 'react-native';
import ProfilePicture from '../components/ProfilePicture';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainNavParamList } from '../navigators/MainTabs';
import { gql, useQuery } from '@apollo/client';
import { GetRatingsQuery, Rating } from '../generated/graphql';
import { printStars } from '../components/Stars';
import { BackIcon } from '../utils/Icons';
import { UserContext } from '../utils/UserContext';

interface Props {
    navigation: BottomTabNavigationProp<MainNavParamList>;
}

const Ratings = gql`
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
    const user = useContext(UserContext);
    const { data, loading, error } = useQuery<GetRatingsQuery>(Ratings, { variables: { id: user.id } });
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

    return (
        <>
            <TopNavigation
                title='Your Ratings' 
                subtitle={`${data?.getRatings.count || 'N/A'} ratings`}
                alignment='center' 
                accessoryLeft={BackAction} 
            />
            <Layout style={styles.container}>
                {data?.getRatings?.items && data.getRatings.count > 0 ?
                    <List
                        style={{width:"100%"}}
                        data={data?.getRatings.items}
                        ItemSeparatorComponent={Divider}
                        renderItem={renderItem}
                    />
                    :
                        !loading &&
                        <>
                            <Text category='h5'>Nothing to display!</Text>
                            <Text appearance='hint'>You have no ratings</Text>
                        </>
                }
                {loading && 
                    <>
                        <Text category='h5'>Loading your ratings</Text>
                        <Spinner />
                    </>
                }
                {error && 
                    <>
                        <Text category='h5'>Unable to load your ratings</Text>
                    </>
                }
            </Layout>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        height: '100%',
        alignItems: "center",
        justifyContent: 'center'
    }
});
