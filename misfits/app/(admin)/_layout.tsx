import React from 'react';
import { Stack, Redirect } from 'expo-router';

import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user || user.role !== 'admin') {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
