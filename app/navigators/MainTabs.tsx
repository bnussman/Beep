import React, { Component } from 'react';
import { BottomTabNavigationProp, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FindBeepScreen } from './FindBeep';
import { SettingsScreen } from './Settings';
import { StartBeepingScreen } from '../routes/beep/StartBeeping';
import { BottomNavigation, BottomNavigationTab } from '@ui-kitten/components';
import { CarIcon, MapIcon, SettingsIcon } from '../utils/Icons';
import {useIsFocused} from '@react-navigation/native';


export type MainNavParamList = {
    Ride: undefined;
    Beep: undefined;
    Settings: undefined;
    MainFindBeepScreen: undefined;
    PickBeepScreen: {
        handlePick: (id: string) => Promise<void>,
        latitude: number,
        longitude: number,
    } | undefined;
    Profile: { id: string | undefined, beep?: string } | undefined;
    EditProfileScreen: undefined;
    ProfilePhotoScreen: undefined;
    ChangePasswordScreen: undefined;
    RideLogScreen: undefined;
}

interface NavState {
    index: number;
    routeNames: [];
}

const { Navigator, Screen } = createBottomTabNavigator<MainNavParamList>();

const BottomTabBar = ({ navigation, state }: { navigation: BottomTabNavigationProp<MainNavParamList>, state: NavState}) => (
    <BottomNavigation
        selectedIndex={state.index}
        onSelect={index => navigation.navigate(state.routeNames[index])}
    >
        <BottomNavigationTab icon={MapIcon} title='Find a Beep'/>
        <BottomNavigationTab icon={CarIcon} title='Start Beeping'/>
        <BottomNavigationTab icon={SettingsIcon} title='Dashboard'/>
  </BottomNavigation>
);

export function MainTabs() {
    return (
        <Navigator tabBar={props => <BottomTabBar {...props} />}>
            <Screen name='Get a Beep' component={FindBeepScreen}/>
            <Screen name='Start Beeping' component={StartBeepingScreen} />
            <Screen name='Settings' component={SettingsScreen}/>
        </Navigator>
    );
}
