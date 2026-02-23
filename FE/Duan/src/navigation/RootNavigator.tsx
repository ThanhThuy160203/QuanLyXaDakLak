import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';
import { useAuthStore } from '../store/auth.store';

export const RootNavigator = () => {
  const { user, hydrated, bootstrap } = useAuthStore(
    (state: any) => ({
      user: state.user,
      hydrated: state.hydrated,
      bootstrap: state.bootstrap,
    })
  );

  useEffect(() => {
    bootstrap();
  }, []);

  if (!hydrated) {
    return (
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
