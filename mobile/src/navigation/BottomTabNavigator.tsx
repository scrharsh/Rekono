import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import PaymentListScreen from '../screens/PaymentListScreen';
import UnmatchedQueueScreen from '../screens/UnmatchedQueueScreen';
import UnknownQueueScreen from '../screens/UnknownQueueScreen';

const Tab = createBottomTabNavigator();

function TabGlyph({ label, color }: { label: string; color: string }) {
  return (
    <View style={{
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${color}20`,
      borderWidth: 1,
      borderColor: `${color}40`,
    }}>
      <Text style={{ fontSize: 10, fontWeight: '800', color, letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}

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
        tabBarActiveTintColor: '#1f5eff',
        tabBarInactiveTintColor: '#5f6b7d',
        tabBarStyle: {
          height: 66,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: '#ffffff',
          borderTopColor: '#d7e1ee',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        headerShown: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <TabGlyph label="HM" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentListScreen}
        options={{
          tabBarLabel: 'Payments',
          tabBarIcon: ({ color }) => (
            <TabGlyph label="PM" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Unmatched"
        component={UnmatchedQueueScreen}
        options={{
          tabBarLabel: 'Unmatched',
          tabBarIcon: ({ color }) => (
            <TabGlyph label="UN" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Unknown"
        component={UnknownQueueScreen}
        options={{
          tabBarLabel: 'Unknown',
          tabBarIcon: ({ color }) => (
            <TabGlyph label="UK" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color }) => (
            <TabGlyph label="MR" color={color} />
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
