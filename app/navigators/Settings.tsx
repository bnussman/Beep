import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainSettingsScreen } from '../routes/settings/Settings'
import { EditProfileScreen } from '../routes/settings/EditProfile'
import { ProfilePhotoScreen } from '../routes/settings/ProfilePhoto'
import { ChangePasswordScreen } from '../routes/settings/ChangePassword'
import { BeepsScreen } from '../routes/Beeps';
import { RatingsScreen } from '../routes/Ratings';

const Stack = createStackNavigator();

export function SettingsScreen() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} >
            <Stack.Screen name="MainSettingsScreen" component={MainSettingsScreen} />
            <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
            <Stack.Screen name="ProfilePhotoScreen" component={ProfilePhotoScreen} />
            <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
            <Stack.Screen name="BeepsScreen" component={BeepsScreen} />
            <Stack.Screen name="RatingsScreen" component={RatingsScreen} />
        </Stack.Navigator>
    );
}
