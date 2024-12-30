import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LibrariesScreen from '../screens/LibrariesScreen';
import MainMenu from "../screens/MainMenu";
import LibraryBookScreen from "../screens/LibraryBookScreen";
import UsernameScreen from "../screens/UsernameScreen";
import UserLinkScreen from "../screens/UserLinkScreen";

const Stack = createStackNavigator();

const Navigation = () => (
    <NavigationContainer>
        <Stack.Navigator>
            {/* Define unique names and appropriate titles for each screen */}
            <Stack.Screen name="Libraries" component={LibrariesScreen} options={{ title: 'Libraries' }} />
            <Stack.Screen name="Username" component={UsernameScreen} options={{ title: 'Users' }} />
            <Stack.Screen name="MainMenu" component={MainMenu} options={{ title: 'Menu' }} />
            <Stack.Screen name="LibraryBook" component={LibraryBookScreen} options={{ title: 'Library Books' }} />
            <Stack.Screen name="UserLink" component={UserLinkScreen} options={{ title: 'UserBooks' }} />
        </Stack.Navigator>
    </NavigationContainer>
);
//ok
export default Navigation;
