import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import PaymentListScreen from '../screens/PaymentListScreen';
import UnmatchedQueueScreen from '../screens/UnmatchedQueueScreen';
import UnknownQueueScreen from '../screens/UnknownQueueScreen';

const Tab = createBottomTabNavigator();

// Placeholder screens for navigation
const MoreScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>More</Text>
    <Text style={styles.subtitle}>Settings and Profile</Text>
  </View>
);

export const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentListScreen}
        options={{
          tabBarLabel: 'Payments',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>💰</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Unmatched"
        component={UnmatchedQueueScreen}
        options={{
          tabBarLabel: 'Unmatched',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Unknown"
        component={UnknownQueueScreen}
        options={{
          tabBarLabel: 'Unknown',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>❓</Text>
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
});
