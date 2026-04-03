import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View } from 'react-native';
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
import SettingsScreen from './src/screens/SettingsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SubscriptionGateScreen from './src/screens/SubscriptionGateScreen';
import { smsReceiverService } from './src/services/smsReceiver.native';
import { hydrateBusinessContextFromServer } from './src/services/businessProfile.service';
import { getStoredUser } from './src/services/auth.service';
import { getUnreadNotificationCount, subscribeToNotificationChanges } from './src/services/notification.service';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabGlyph({ label, color }: { label: string; color: string }) {
  const active = color === '#1f5eff';
  return (
    <View
      style={{
        width: 26,
        height: 26,
        borderRadius: 9,
        backgroundColor: active ? '#e9f0ff' : '#f1f5f9',
        borderWidth: 1,
        borderColor: active ? '#c8dafd' : '#d7e1ee',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: '800', color, letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

function MainTabs() {
  const [notificationCount, setNotificationCount] = React.useState(0);

  useEffect(() => {
    let active = true;

    const refreshCount = async () => {
      try {
        const count = await getUnreadNotificationCount(40);
        if (active) {
          setNotificationCount(count);
        }
      } catch {
        if (active) {
          setNotificationCount(0);
        }
      }
    };

    void refreshCount();
    const unsubscribe = subscribeToNotificationChanges(() => {
      void refreshCount();
    });

    const timer = setInterval(() => {
      void refreshCount();
    }, 60000);

    return () => {
      active = false;
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1f5eff',
        tabBarInactiveTintColor: '#5f6b7d',
        headerStyle: {
          backgroundColor: '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: '#d7e1ee',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: '#102135',
          fontWeight: '700',
          fontSize: 17,
        },
        headerTintColor: '#102135',
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: '#ffffff',
          borderTopColor: '#d7e1ee',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Workspace',
          tabBarLabel: 'Workspace',
          tabBarIcon: ({ color }) => <TabGlyph label="WS" color={color} />,
        }}
      />
      <Tab.Screen 
        name="Sales" 
        component={SaleEntryScreen}
        options={{
          title: 'New Sale',
          tabBarLabel: 'New Sale',
          tabBarIcon: ({ color }) => <TabGlyph label="SL" color={color} />,
        }}
      />
      <Tab.Screen 
        name="Payments" 
        component={PaymentListScreen}
        options={{
          title: 'Payment Inbox',
          tabBarLabel: 'Inbox',
          tabBarIcon: ({ color }) => <TabGlyph label="PI" color={color} />,
        }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          tabBarLabel: 'Alerts',
          tabBarBadge: notificationCount > 0 ? notificationCount : undefined,
          tabBarIcon: ({ color }) => <TabGlyph label="NT" color={color} />,
        }}
      />
      <Tab.Screen 
        name="Unmatched" 
        component={UnmatchedQueueScreen}
        options={{
          title: 'Pending Sales',
          tabBarLabel: 'Pending',
          tabBarIcon: ({ color }) => <TabGlyph label="PS" color={color} />,
        }}
      />
      <Tab.Screen 
        name="Unknown" 
        component={UnknownQueueScreen}
        options={{
          title: 'Auto Match',
          tabBarLabel: 'Auto Match',
          tabBarIcon: ({ color }) => <TabGlyph label="AM" color={color} />,
        }}
      />
      <Tab.Screen 
        name="Catalog" 
        component={CatalogScreen}
        options={{
          title: 'Saved Items',
          tabBarLabel: 'Items',
          tabBarIcon: ({ color }) => <TabGlyph label="IT" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isReady, setIsReady] = React.useState(false);
  const [initialRoute, setInitialRoute] = React.useState<'Login' | 'Signup' | 'Onboarding' | 'Main' | 'Subscription'>('Login');

  const isSubscriptionActive = (user: Record<string, unknown> | null) => {
    const subscription = (user?.subscription || {}) as Record<string, unknown>;
    const required = Boolean(subscription.required);
    const status = String(subscription.status || 'inactive');
    return !required || status === 'active';
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const onboarded = await AsyncStorage.getItem('onboardingComplete');
        const user = await getStoredUser();

        if (token) {
          setInitialRoute(
            isSubscriptionActive(user) ? (onboarded === 'true' ? 'Main' : 'Onboarding') : 'Subscription',
          );
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
        <Stack.Screen name="Subscription" component={SubscriptionGateScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
