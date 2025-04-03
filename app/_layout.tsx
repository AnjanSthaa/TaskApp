import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { MaterialIcons } from '@expo/vector-icons'
import IndexScreen from './index'
import LoginScreen from './screens/Login'
import SignupScreen from './screens/Signup'
import { signOut } from 'firebase/auth'
import { auth } from '../firebaseConfig'
import ProfileScreen from './screens/ProfileScreen'
import { View } from 'react-native'

const Stack = createStackNavigator()

export default function RootLayout() {
  return (
    <Stack.Navigator initialRouteName='Login'>
      <Stack.Screen
        name='Login'
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='Signup'
        component={SignupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='Index'
        component={IndexScreen}
        options={({ navigation }) => ({
          title: 'Todo List',
          headerStyle: { backgroundColor: '#f5f5f5' },
          headerTitleStyle: { fontWeight: 'bold', color: '#333' },
          headerLeft: () => null,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons
                name='person'
                size={24}
                color='#333'
                style={{ marginRight: 15 }}
                onPress={() => navigation.navigate('Profile')}
              />
              <MaterialIcons
                name='logout'
                size={24}
                color='#333'
                style={{ marginRight: 15 }}
                onPress={async () => {
                  try {
                    await signOut(auth)
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Login' }],
                    })
                  } catch (error) {
                    console.error('Error logging out:', error)
                  }
                }}
              />
            </View>
          ),
        })}
      />
      <Stack.Screen
        name='Profile'
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  )
}
