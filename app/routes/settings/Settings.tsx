import React, {useContext} from 'react';
import { StyleSheet } from 'react-native';
import { Layout, Button, Card, Text } from '@ui-kitten/components';
import { ThemeContext } from '../../utils/ThemeContext';
import { UserContext } from '../../utils/UserContext';
import { PhotoIcon, LogIcon, ThemeIcon, LogoutIcon, ProfileIcon, PasswordIcon, ForwardIcon } from '../../utils/Icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfilePicture from '../../components/ProfilePicture';
import ResendButton from '../../components/ResendVarificationEmailButton';
import {gql, useMutation} from '@apollo/client';
import {LogoutMutation} from '../../generated/graphql';
import {client} from '../../utils/Apollo';
import {GetUserData} from '../../App';

const Logout = gql`
    mutation Logout {
        logout (isApp: true)
    }
`;

export function MainSettingsScreen({ navigation }: any) {
    const themeContext = useContext(ThemeContext);
    const user = useContext(UserContext);
    const [logout, { loading: loading, error: error }] = useMutation<LogoutMutation>(Logout);

    async function doLogout() {
        logout({
            variables: {
                isApp: true
            }
        });

        AsyncStorage.clear();

        await navigation.reset({
            index: 0,
            routes: [
                { name: 'Login' },
            ],
            key: null
        }, () => {
            client.writeQuery({
                query: GetUserData,
                data: { // Contains the data to write
                    getUser: null
                }
            });
        });

    }

    function UserHeader(props: any) {
        return <Layout style={{flexDirection: 'row', marginHorizontal: -16}}>
            {props.user.photoUrl &&
            <ProfilePicture
                style={{marginHorizontal: 8}}
                size={50}
                url={props.user.photoUrl}
            />
            }
            <Layout>
                <Text category='h4'>
                    {props.user.first + " " + props.user.last}
                </Text>
                <Text
                    appearance='hint'
                    category='s1'>
                    @{props.user.username}
                </Text>
            </Layout>
        </Layout>
    }

    return (
        <Layout style={styles.wrapper}>
            <Layout style={styles.container}>
                <Card style={{width: "80%", marginBottom: 20}} onPress={() => navigation.navigate("Profile", { id: user.id })} >
                    <UserHeader user={user} />
                </Card>
                {!user.isEmailVerified &&
                    <Card status="danger" style={{maxWidth: 400, marginBottom: 6}}>
                        <Text category="h6">Your email is not verified!</Text>
                    </Card>
                }
                {!user.isEmailVerified && <ResendButton />}
                <Button
                    onPress={themeContext?.toggleTheme}
                    accessoryLeft={ThemeIcon}
                    style={styles.button}
                    appearance='ghost'
                >
                    {(themeContext?.theme == "light") ? "Dark Mode" : "Light Mode"}
                </Button>
                <Button
                    onPress={() => navigation.navigate("EditProfileScreen")}
                    accessoryLeft={ProfileIcon}
                    accessoryRight={ForwardIcon}
                    style={styles.button}
                    appearance='ghost'
                >
                    Edit Profile
                </Button>
                <Button
                    onPress={() => navigation.navigate("ProfilePhotoScreen")}
                    accessoryLeft={PhotoIcon}
                    accessoryRight={ForwardIcon}
                    style={styles.button}
                    appearance='ghost'
                >
                    Profile Photo
                </Button>
                <Button
                    onPress={() => navigation.navigate("ChangePasswordScreen")}
                    accessoryLeft={PasswordIcon}
                    accessoryRight={ForwardIcon}
                    style={styles.button}
                    appearance='ghost'
                >
                    Change Password
                </Button>
                <Button
                    onPress={() => navigation.navigate("BeepsScreen")}
                    accessoryLeft={LogIcon}
                    accessoryRight={ForwardIcon}
                    style={styles.button}
                    appearance='ghost'
                >
                    Ride Log
                </Button>
                <Button
                    onPress={() => navigation.navigate("RatingsScreen")}
                    accessoryLeft={LogIcon}
                    accessoryRight={ForwardIcon}
                    style={styles.button}
                    appearance='ghost'
                >
                    Ratings
                </Button>
                <Button
                    onPress={() => doLogout()}
                    accessoryLeft={LogoutIcon}
                    style={styles.button}
                    appearance='ghost'
                >
                    {loading ? "Logging you out..." : "Logout"}
                </Button>
            </Layout>
        </Layout>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '35%',
        marginTop: 20 
    },
    container: {
        flex: 1,
        width: '95%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    wrapper: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
    },
    button: {
        marginBottom: 10 
    },
});
