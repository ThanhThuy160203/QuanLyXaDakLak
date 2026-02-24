import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '../store/auth.store';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';

export const RootNavigator = () => {
  // Subscribe to individual slices to avoid recreating snapshot objects every render
  const user = useAuthStore(state => state.user);
  const hydrated = useAuthStore(state => state.hydrated);

  useEffect(() => {
    useAuthStore.getState().bootstrap();
  }, []);

  if (!hydrated) {
    return (
      // eslint-disable-next-line react-native/no-inline-styles
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};
