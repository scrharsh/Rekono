import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './src/screens/HomeScreen';
import SaleEntryScreen from './src/screens/SaleEntryScreen';
import PaymentListScreen from './src/screens/PaymentListScreen';
import UnmatchedQueueScreen from './src/screens/UnmatchedQueueScreen';
import UnknownQueueScreen from './src/screens/UnknownQueueScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import CatalogScreen from './src/screens/CatalogScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import SplashScreen from './src/screens/SplashScreen';
import { smsReceiverService } from './src/services/smsReceiver.native';
import { hydrateBusinessContextFromServer } from './src/services/businessProfile.service';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
        }}
      />
      <Tab.Screen 
        name="Sales" 
        component={SaleEntryScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📝</Text>,
        }}
      />
      <Tab.Screen 
        name="Payments" 
        component={PaymentListScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💰</Text>,
        }}
      />
      <Tab.Screen 
        name="Unmatched" 
        component={UnmatchedQueueScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📋</Text>,
        }}
      />
      <Tab.Screen 
        name="Unknown" 
        component={UnknownQueueScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>❓</Text>,
        }}
      />
      <Tab.Screen 
        name="Catalog" 
        component={CatalogScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📖</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isReady, setIsReady] = React.useState(false);
  const [initialRoute, setInitialRoute] = React.useState<'Login' | 'Signup' | 'Onboarding' | 'Main'>('Login');

  useEffect(() => {
    const initApp = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const onboarded = await AsyncStorage.getItem('onboardingComplete');

        if (token) {
          setInitialRoute(onboarded === 'true' ? 'Main' : 'Onboarding');
        } else {
          setInitialRoute('Login');
        }

        // Refresh bootstrapped business/showroom context from server when authenticated.
        try {
          if (token) {
            await hydrateBusinessContextFromServer();
          }
        } catch (contextError) {
          console.error('Failed to hydrate business context:', contextError);
        }
        
        try {
          if (token) {
            const showroomId = await AsyncStorage.getItem('showroomId') || 'default';
            await smsReceiverService.startListening(showroomId);
          }
        } catch (smsError) {
          console.error('Failed to start SMS receiver:', smsError);
        }

        setIsReady(true);
      } catch (error) {
        console.error('Failed to init app:', error);
        setIsReady(true);
      }
    };

    initApp();

    return () => {
      smsReceiverService.stopListening();
    };
  }, []);

  if (!isReady) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
