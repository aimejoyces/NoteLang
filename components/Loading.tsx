import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/Theme';

const LoadingScreen: React.FC = () => {
  const { isDark } = useTheme();
  
  const colors = {
    background: isDark ? '#121212' : '#f8faff',
    text: isDark ? '#a0a0a0' : '#64748b',
    primary: '#4f46e5',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.text }]}>Loading...</Text>
    </View>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 12,
    fontSize: 15,
  },
});
