/**
 * NAVIGATION REFACTOR - 4-Tab Structure
 * 
 * Previous structure (6+ tabs):
 * - Home, Mentors, Books, Messages, Library (Curated), Profile
 * - Plus: Sessions, Book-Session, Session-Detail, Availability-Setup as separate screens
 * 
 * New structure (4 tabs only):
 * - Home (includes Books/Library access via Quick Access)
 * - Mentors (mentor browsing)
 * - Messages (includes Scheduling: Sessions, Book Session, Session Detail)
 * - Profile (includes Availability Setup for mentors)
 * 
 * All scheduling screens are now nested under Messages tab.
 * Books/Library accessed from Home screen, not as bottom tab.
 * Availability Setup moved to Profile section.
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
      }}
    >
      {/* TAB 1: Home - Hub for Books/Library access */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* TAB 2: Mentors - Browse and view mentor profiles */}
      <Tabs.Screen
        name="mentors"
        options={{
          title: 'Mentors',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      {/* TAB 3: Messages - Includes Scheduling (Sessions, Book, Details) */}
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />

      {/* TAB 4: Profile - Includes Availability Setup for mentors */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden screens - Not in bottom tab bar but accessible via navigation */}
      <Tabs.Screen
        name="books"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="curated"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="session-detail"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="book-session"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="availability-setup"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
