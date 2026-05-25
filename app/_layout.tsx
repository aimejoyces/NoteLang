import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import LoadingScreen from '../components/Loading';
import { ThemeProvider } from '../context/Theme';
import { auth } from '../services/firebase';

function InitialLayout() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    setUser(auth.currentUser);

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });

    setAuthReady(true);

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    const isAuthRoute =
      segments[0] === 'screens' &&
      (segments[1] === 'login' || segments[1] === 'register');
    const isWelcomeRoute = segments[0] !== 'screens';
    const isProtectedRoute =
      segments[0] === 'screens' &&
      segments[1] !== 'login' &&
      segments[1] !== 'register';

    if (user && (isAuthRoute || isWelcomeRoute)) {
      router.replace('/screens/home');
    } else if (!user && isProtectedRoute) {
      router.replace('/');
    }
  }, [authReady, router, segments, user]);

  if (!authReady) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="screens/login" options={{ headerShown: false }} />
      <Stack.Screen name="screens/register" options={{ headerShown: false }} />
      <Stack.Screen name="screens/home" options={{ headerShown: false }} />
      <Stack.Screen name="screens/profile" options={{ headerShown: false }} />
      <Stack.Screen name="screens/add-edit" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <InitialLayout />
    </ThemeProvider>
  );
}
