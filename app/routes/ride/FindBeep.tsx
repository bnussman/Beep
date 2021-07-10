import React, { useContext, useEffect, useState, useRef } from 'react';
import { Share, Platform, StyleSheet, Linking, TouchableWithoutFeedback, KeyboardAvoidingView, Keyboard } from 'react-native';
import { Layout, Text, Button, Input, Card } from '@ui-kitten/components';
import * as SplashScreen from 'expo-splash-screen';
import { UserContext } from '../../utils/UserContext';
import { PhoneIcon, TextIcon, VenmoIcon, FindIcon, ShareIcon, LoadingIndicator } from '../../utils/Icons';
import ProfilePicture from "../../components/ProfilePicture";
import LeaveButton from './LeaveButton';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainNavParamList } from '../../navigators/MainTabs';
import { gql, useLazyQuery, useQuery } from '@apollo/client';
import { GetEtaQuery, GetInitialRiderStatusQuery } from '../../generated/graphql';
import { gqlChooseBeep } from './helpers';
import Logger from '../../utils/Logger';
import { client } from '../../utils/Apollo';
import { RateCard } from '../../components/RateCard';
import LocationInput from '../../components/LocationInput';
import * as Location from 'expo-location';

const InitialRiderStatus = gql`
    query GetInitialRiderStatus {
        getRiderStatus {
            id
            position
            isAccepted
            origin
            destination
            state
            groupSize
            beeper {
                id
                first
                last
                singlesRate
                groupRate
                isStudent
                role
                venmo
                cashapp
                username
                phone
                photoUrl
                masksRequired
                capacity
                queueSize
                location {
                    longitude
                    latitude
                }
            }
        }
    }
`;

const RiderStatus = gql`
    subscription RiderStatus($topic: String!) {
        getRiderUpdates(topic: $topic) {
            id
            position
            isAccepted
            origin
            destination
            state
            groupSize
            beeper {
                id
                first
                last
                singlesRate
                groupRate
                isStudent
                role
                venmo
                cashapp
                username
                phone
                photoUrl
                masksRequired
                capacity
                queueSize
                location {
                    longitude
                    latitude
                }
            }
        }
    }
`;

const BeepersLocation = gql`
    subscription BeepersLocation($topic: String!) {
        getLocationUpdates(topic: $topic) {
            latitude
            longitude
        }
    }
`;

const GetETA = gql`
    query GetETA ($start: String!, $end: String!) {
        getETA(start: $start, end: $end)
    }
`;

interface Props {
    navigation: BottomTabNavigationProp<MainNavParamList>;
}

let sub: any;

export function MainFindBeepScreen(props: Props) {
    const user = useContext(UserContext);

    const { subscribeToMore, loading, data, previousData } = useQuery<GetInitialRiderStatusQuery>(InitialRiderStatus);
    const [getETA, { data: eta, loading: etaLoading, error: etaError}] = useLazyQuery<GetEtaQuery>(GetETA);

    const [groupSize, setGroupSize] = useState<string>("");
    const [origin, setOrigin] = useState<string>("");
    const [destination, setDestination] = useState<string>("");
    const [isGetBeepLoading, setIsGetBeepLoading] = useState<boolean>(false);

    const originRef = useRef<any>();
    const destinationRef = useRef<any>();
    
    async function subscribeToLocation() {
        const a = client.subscribe({ query: BeepersLocation, variables: { topic: data?.getRiderStatus?.beeper.id }});

        sub = a.subscribe(({ data }) => {
            updateETA(data.getLocationUpdates.latitude, data.getLocationUpdates.longitude);
        });
    }

    async function updateETA(lat: number, long: number): Promise<void> {
        getETA({
            variables: {
                start: `${lat},${long}`,
                end: data?.getRiderStatus?.origin
            }
        });
    }

    useEffect(() => {
        SplashScreen.hideAsync();
        if (user?.id) {
            subscribeToMore({
                document: RiderStatus,
                variables: {
                    topic: user.id
                },
                updateQuery: (prev, { subscriptionData }) => {
                    const newFeedItem = subscriptionData.data.getRiderUpdates;
                    return Object.assign({}, prev, {
                        getRiderStatus: newFeedItem
                    });
                }
            });
        }
    }, [user?.id]);

    useEffect(() => {
       if ((data?.getRiderStatus?.state == 1 && previousData?.getRiderStatus?.state == 0) || (data?.getRiderStatus?.state == 1 && previousData == undefined)) {
            subscribeToLocation();
       }
       if (data?.getRiderStatus?.state == 2 && previousData?.getRiderStatus?.state == 1) {
            sub?.unsubscribe();
       }
       if (data?.getRiderStatus?.beeper.location) {
            updateETA(data.getRiderStatus.beeper.location.latitude, data.getRiderStatus.beeper.location.longitude);
       }
    }, [data]);

    async function findBeep(): Promise<void> {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
            return alert("You must enable location to find a ride.");
        }

        let lastKnowLocation = await Location.getLastKnownPositionAsync({
            maxAge: 180000,
            requiredAccuracy: 800
        });

        if (!lastKnowLocation) {
            lastKnowLocation = await Location.getCurrentPositionAsync();
        }

        return props.navigation.navigate('PickBeepScreen', {
            latitude: lastKnowLocation.coords.latitude,
            longitude: lastKnowLocation.coords.longitude,
            handlePick: (id: string) => chooseBeep(id),
        });
    }

    async function chooseBeep(id: string): Promise<void> {
        setIsGetBeepLoading(true);
        try {
            await gqlChooseBeep({
                beeperId: id,
                origin: origin,
                destination: destination,
                groupSize: Number(groupSize)
            });
        }
        catch (error) {
            alert(error.message);
        }
        setIsGetBeepLoading(false);
    }

    function getVenmoLink(): string {
        if (Number(data?.getRiderStatus?.groupSize) > 1) {
            return 'venmo://paycharge?txn=pay&recipients=' + data?.getRiderStatus?.beeper?.venmo + '&amount=' + data?.getRiderStatus?.beeper?.groupRate * data?.getRiderStatus?.groupSize + '&note=Beep';
        }
        return 'venmo://paycharge?txn=pay&recipients=' + data?.getRiderStatus?.beeper?.venmo + '&amount=' + data?.getRiderStatus?.beeper?.singlesRate + '&note=Beep';
    }

    function getCashAppLink(): string {
        if (Number(data?.getRiderStatus?.groupSize) > 1) {
            return `https://cash.app/$${data?.getRiderStatus?.beeper.cashapp}/${data?.getRiderStatus?.groupSize * data?.getRiderStatus?.beeper.groupRate}`;
        }
        return `https://cash.app/$${data?.getRiderStatus?.beeper?.cashapp}/${data?.getRiderStatus?.beeper?.singlesRate}`;
    }

    function shareVenmoInformation(): void {
        try {
            Share.share({
                message: `Please Venmo ${data?.getRiderStatus?.beeper?.venmo} $${data?.getRiderStatus?.beeper?.groupRate} for the beep!`,
                url: getVenmoLink()
            });
        }
        catch (error) {
            Logger.error(error);
        }
    }            

    function getCurrentStatusMessage(): string {
        switch(data?.getRiderStatus?.state) {
            case 0:
                return "Beeper is getting ready to come get you.";
            case 1:
                return "Beeper is on their way to get you.";
            case 2:
                return "Beeper is here to pick you up!";
            case 3:
                return "You are currenly in the car with your beeper.";
            default: 
                return "Unknown";
        }
    }

    const Tags = () => (
        <Layout style={styles.tagRow}>
            {data?.getRiderStatus?.beeper?.isStudent && <Button status="basic" size='tiny' style={styles.tag}>Student</Button>}
            {data?.getRiderStatus?.beeper?.masksRequired && <Button status="info" size='tiny' style={styles.tag}>Masks Required</Button>}
            {(data?.getRiderStatus?.beeper && data?.getRiderStatus.beeper?.role == "ADMIN") && <Button size='tiny' status='danger' style={styles.tag}>Founder</Button>}
        </Layout>
    );

    if (user?.isBeeping) {
        return(
            <Layout style={styles.container}>
                <Text category="h5">You are beeping!</Text>
                <Text appearance="hint">You can{"'"}t find a ride when you are beeping</Text>
            </Layout>
        );
    }

    if (!data || !data?.getRiderStatus || !data?.getRiderStatus.beeper.id ) {
        return (
            <Layout style={{height:"100%"}}>
                <KeyboardAvoidingView
                    behavior={Platform.OS == "ios" ? "padding" : "height"}
                    style={styles.container}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} disabled={!(Platform.OS == "ios" || Platform.OS == "android")} >
                        <Layout style={styles.container}>

                            {/*<RateCard {...props}/>*/}

                            <Input
                                keyboardType="number-pad"
                                label='Group Size'
                                style={styles.buttons}
                                placeholder='Group Size'
                                value={groupSize}
                                onChangeText={value => setGroupSize(value)}
                                onSubmitEditing={() => originRef.current.focus()}
                                returnKeyType="next"
                            />
                            <LocationInput
                                ref={originRef}
                                label="Pick-up Location"
                                value={origin}
                                setValue={(value) => setOrigin(value)}
                                getLocation={true}
                                onSubmitEditing={() => destinationRef.current.focus()}
                                returnKeyType="next"
                            />
                            <LocationInput
                                ref={destinationRef}
                                label="Destination Location"
                                value={destination}
                                setValue={(value) => setDestination(value)}
                                getLocation={false}
                                returnKeyType="go"
                            />
                            {!isGetBeepLoading || loading ?
                                <Button
                                    accessoryRight={FindIcon}
                                    onPress={() => findBeep()}
                                    size='large'
                                    style={{marginTop:15}}
                                    disabled={origin === 'Loading your location...'}
                                >
                                    Find a Beep
                                </Button>
                                :
                                <Button
                                    size='large'
                                    style={{marginTop:15}}
                                    appearance='outline'
                                    accessoryRight={LoadingIndicator}
                                >
                                    Loading
                                </Button>
                            }
                        </Layout>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Layout>
        );
    }
    
    if (data?.getRiderStatus.isAccepted) {
        return (
            <Layout style={styles.container}>
                <TouchableWithoutFeedback onPress={() => props.navigation.navigate("Profile", { id: data?.getRiderStatus?.beeper?.id, beep: data?.getRiderStatus?.id })} >
                    <Layout style={{alignItems: "center", justifyContent: 'center'}}>
                        {data?.getRiderStatus.beeper?.photoUrl &&
                        <ProfilePicture
                            style={{marginBottom: 5}}
                            size={100}
                            url={data?.getRiderStatus.beeper.photoUrl}
                        />
                        }
                        <Layout style={styles.group}>
                            <Text category='h6'>{data?.getRiderStatus.beeper?.first || "No"} {data?.getRiderStatus.beeper?.last || "User"}</Text>
                            <Text appearance='hint'>is your beeper!</Text>
                        </Layout>
                    </Layout>
                </TouchableWithoutFeedback>
                <Tags/>
                {(data?.getRiderStatus.position <= 0) &&
                <Layout style={styles.group}>
                    <Card>
                        <Text category='h6'>Current Status</Text>
                        <Text appearance='hint'>
                            {getCurrentStatusMessage()}
                        </Text>
                    </Card>
                    {data?.getRiderStatus.state == 1 &&
                        <Layout>
                            <Card style={{marginTop: 10}}>
                                <Text category='h6'>Arrival ETA</Text>
                                {etaError && <Text appearance='hint'>{etaError.message}</Text>}
                                {etaLoading ? <Text appearance='hint'>Loading ETA</Text> :
                                 eta?.getETA && data.getRiderStatus.beeper.location ?
                                    <Text appearance='hint'>Your beeper is {eta.getETA} away</Text>
                                    :
                                    <Text appearance='hint'>Beeper has no location data</Text>
                                }
                            </Card>
                        </Layout>
                    }
                </Layout>
                }
                {(data?.getRiderStatus.position > 0) && 
                    <Layout style={styles.group}>
                        <Text category='h6'>{data?.getRiderStatus.position}</Text>
                        <Text appearance='hint'>{(data?.getRiderStatus.position == 1) ? "person is" : "people are"} ahead of you in {data?.getRiderStatus.beeper?.first || "User"}{"'"}s queue.</Text>
                    </Layout>
                }
                <Button
                    status='basic'
                    accessoryRight={PhoneIcon}
                    style={styles.buttons}
                    onPress={() =>{ Linking.openURL('tel:' + data?.getRiderStatus?.beeper?.phone); } }
                >
                    Call Beeper
                </Button>
                <Button
                    status='basic'
                    accessoryRight={TextIcon}
                    style={styles.buttons}
                    onPress={() =>{ Linking.openURL('sms:' + data?.getRiderStatus?.beeper?.phone); } }
                >
                    Text Beeper
                </Button>
                {data?.getRiderStatus?.beeper?.venmo && 
                    <Button
                        status='info'
                        accessoryRight={VenmoIcon}
                        style={styles.buttons}
                        onPress={() => Linking.openURL(getVenmoLink())}
                    >
                        Pay Beeper with Venmo
                    </Button> 
                }
                {data?.getRiderStatus?.beeper?.cashapp && 
                    <Button
                        status='success'
                        accessoryRight={VenmoIcon}
                        style={styles.buttons}
                        onPress={() => Linking.openURL(getCashAppLink())}
                    >
                        Pay Beeper with Cash App
                    </Button> 
                }
                {(Number(data?.getRiderStatus.groupSize) > 1) &&
                <Button
                    status='basic'
                    accessoryRight={ShareIcon}
                    style={styles.buttons}
                    onPress={() => shareVenmoInformation()}
                >
                    Share Venmo Info with Your Friends
                </Button>
                }
                {(data?.getRiderStatus.position >= 1 && data?.getRiderStatus.beeper) && 
                    <LeaveButton beepersId={data?.getRiderStatus.beeper.id} refetch={() => {}} />
                }
            </Layout>
        );
    }
    else {
        return (
            <Layout style={styles.container}>
                <TouchableWithoutFeedback onPress={() => props.navigation.navigate("Profile", { id: data?.getRiderStatus?.beeper.id, beep: data?.getRiderStatus?.id })} >
                    <Layout style={{alignItems: "center", justifyContent: 'center'}}>
                        {data?.getRiderStatus.beeper.photoUrl &&
                        <ProfilePicture
                            style={{marginBottom: 5}}
                            size={100}
                            url={data.getRiderStatus.beeper.photoUrl}
                        />
                        }
                        <Layout style={styles.group}>
                            <Text appearance='hint'>Waiting on</Text>
                            <Text category='h6'>{data?.getRiderStatus.beeper.first || "No"} {data?.getRiderStatus.beeper.last || "User"}</Text>
                            <Text appearance='hint'>to accept your request.</Text>
                        </Layout>
                    </Layout>
                </TouchableWithoutFeedback>
                <Tags/>
                <Layout style={styles.group}>
                    <Text category='h6'>{data?.getRiderStatus.beeper?.first}{"'"}{(data?.getRiderStatus.beeper?.first.charAt(data?.getRiderStatus.beeper.first.length - 1) != 's') && "s"} Rates</Text>
                    <Text appearance='hint' style={{marginBottom: 6}}>per person</Text>
                    <Layout style={styles.rateGroup}>
                        <Layout style={styles.rateLayout}>
                            <Text appearance='hint'>Single</Text>
                            <Text>${data?.getRiderStatus.beeper?.singlesRate || "0.0"}</Text>
                        </Layout>
                        <Layout style={styles.rateLayout} >
                            <Text appearance='hint'>Group</Text>
                            <Text>${data?.getRiderStatus.beeper?.groupRate || "0.0"}</Text>
                        </Layout>
                    </Layout>
                </Layout>

                <Layout style={styles.group}>
                    <Text category='h6'>{data?.getRiderStatus.beeper?.queueSize}</Text>
                    <Text appearance='hint'>{(data?.getRiderStatus.beeper?.queueSize == 1) ? "person is" : "people are"} ahead of you in {data?.getRiderStatus.beeper?.first}{"'"}s queue</Text>
                </Layout>
                <LeaveButton beepersId={data?.getRiderStatus.beeper.id} refetch={() => {}} />
            </Layout>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: 'center',
        width: "100%"
    },
    buttons: {
        marginBottom:5,
        width: "85%"
    },
    rowItem: {
        marginBottom:5,
        width: "95%"
    },
    group: {
        alignItems: "center",
        marginBottom: 12,
        width: '100%'
    },
    groupConatiner: {
        flexDirection: 'row',
        width: "80%",
        alignItems: "center",
        justifyContent: 'center',
    },
    rateGroup: {
        flexDirection: 'row',
        width: 120
    },
    layout: {
        flex: 1,
    },
    rateLayout: {
        flex: 1,
        alignItems: "center",
        justifyContent: 'center',
    },
    tagRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 10,
        width: "80%",
        justifyContent: "center"
    },
    tag: {
        margin: 4 
    }
});
