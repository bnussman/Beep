import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Layout, Text, Button, Input } from '@ui-kitten/components';
import * as SplashScreen from 'expo-splash-screen';
import { isMobile } from '../../utils/config';
import { LoginIcon, SignUpIcon, QuestionIcon, LoadingIndicator } from '../../utils/Icons';
import { Icon } from '@ui-kitten/components';
import { gql, useMutation } from '@apollo/client';
import { LoginMutation } from '../../generated/graphql';
import { client } from '../../utils/Apollo';
import { GetUserData } from '../../App';
import { getPushToken } from '../../utils/Notifications';

interface Props {
    navigation: any;
}

const Login = gql`
    mutation Login($username: String!, $password: String!, $pushToken: String) {
        login(input: {username: $username, password: $password, pushToken: $pushToken}) {
            tokens {
                id
                tokenid
            }
        }
    }
`;

function LoginScreen(props: Props) {
    const [login, { loading }] = useMutation<LoginMutation>(Login);
    const [secureTextEntry, setSecureTextEntry] = useState<boolean>(true);
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const passwordRef = useRef<any>();

    const renderIcon = (props: unknown) => (
        <TouchableWithoutFeedback onPress={() => setSecureTextEntry(!secureTextEntry)}>
            <Icon {...props} name={secureTextEntry ? 'eye-off' :'eye'}/>
        </TouchableWithoutFeedback>
    );
    
    useEffect(() => {
        try {
            SplashScreen.hideAsync();
        }
        catch(error) {
            console.log(error);
        }
    }, []);

    async function doLogin() {
        try {
            const r = await login({ variables: {
                username: username,
                password: password,
                pushToken: isMobile ? await getPushToken() : undefined
            }});

            if (r) {

                AsyncStorage.setItem("auth", JSON.stringify(r.data?.login));

                await client.resetStore();

                const data = await client.query({ query: GetUserData });

                client.writeQuery({
                    query: GetUserData,
                    data
                });

                props.navigation.reset({
                    index: 0,
                    routes: [
                        { name: 'Main' },
                    ],
                });
            }
        }
        catch (error) {
            alert(error.message);
        }
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} disabled={!isMobile} >
            <Layout style={styles.container}>
                <Text style={styles.title} category='h6'>Login</Text>
                <Layout style={styles.form}>
                    <Input
                        textContentType="username"
                        placeholder="Username"
                        returnKeyType="next"
                        onChangeText={(text) => setUsername(text)}
                        blurOnSubmit={true}
                        onSubmitEditing={() => passwordRef.current.focus()}
                    />
                    <Input
                        textContentType="password"
                        placeholder="Password"
                        returnKeyType="go"
                        accessoryRight={renderIcon}
                        secureTextEntry={secureTextEntry}
                        onChangeText={(text) => setPassword(text)}
                        blurOnSubmit={true}
                        ref={passwordRef}
                        onSubmitEditing={() => doLogin()}
                    />
                    {!loading ?
                        <Button
                            accessoryRight={LoginIcon}
                            onPress={() => doLogin()}
                            style={{ marginTop: 8 }}
                        >
                            Login
                        </Button>
                        :
                        <Button
                            appearance='outline'
                            accessoryRight={LoadingIndicator}
                            style={{ marginTop: 8 }}
                        >
                            Loading
                        </Button>
                    }
                </Layout>
                <Text style={{marginTop: 30, marginBottom: 10 }}> Don't have an account? </Text>
                <Button
                    size="small"
                    onPress={() => props.navigation.navigate('Register')}
                    appearance="outline"
                    accessoryRight={SignUpIcon}
                >
                    Sign Up
                </Button>
                <Text style={{marginTop: 20, marginBottom: 10}}> Forgot your password? </Text>
                <Button
                    size="small"
                    onPress={() => props.navigation.navigate('ForgotPassword')}
                    appearance="outline"
                    accessoryRight={QuestionIcon}
                >
                    Forgot Password
                </Button>
            </Layout>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        paddingTop: 100
    },
    form: {
        justifyContent: "center",
        width: "83%",
        marginTop: 20,
    },
    title: {
        fontSize: 40,
        padding: 15,
    },
    input: {
        width: "90%"
    }
});

export default LoginScreen;
