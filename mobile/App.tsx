import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import SaleEntryScreen from './src/screens/SaleEntryScreen';
import PaymentListScreen from './src/screens/PaymentListScreen';
import UnmatchedQueueScreen from './src/screens/UnmatchedQueueScreen';
import UnknownQueueScreen from './src/screens/UnknownQueueScreen';
import { smsReceiverService } from './src/services/smsReceiver.native';

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
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    // Initialize SMS receiver on app start
    const initSMSReceiver = async () => {
      try {
        // Get showroom ID from storage or context
        const showroomId = 'default'; // Replace with actual showroom ID from auth
        await smsReceiverService.startListening(showroomId);
      } catch (error) {
        console.error('Failed to start SMS receiver:', error);
      }
    };

    initSMSReceiver();

    return () => {
      smsReceiverService.stopListening();
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
