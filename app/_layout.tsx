import { BackToTestButton } from '@/components/BackToTestButton';
import { TestModeProvider } from '@/contexts/test-mode-context';
import { WalletProvider } from '@/contexts/wallet-context';
import { Stack } from 'expo-router';
import { DarkTheme, ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <WalletProvider>
      <TestModeProvider>
        <ThemeProvider value={DarkTheme}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="ritual/index" options={{ headerShown: true, headerTitle: 'Todos los Rituales', headerStyle: { backgroundColor: '#0b0000' }, headerTintColor: '#CC0000', headerTitleStyle: { fontSize: 14, letterSpacing: 1 } }} />
            <Stack.Screen name="ritual/[id]/index" options={{ headerShown: true, headerTitle: 'Ritual', headerStyle: { backgroundColor: '#0b0000' }, headerTintColor: '#CC0000' }} />
            <Stack.Screen name="ritual/[id]/participants" options={{ headerShown: true, headerTitle: 'Participantes', headerStyle: { backgroundColor: '#0b0000' }, headerTintColor: '#CC0000' }} />
            <Stack.Screen name="ritual/[id]/axies" options={{ headerShown: true, headerTitle: 'Axies Liberados', headerStyle: { backgroundColor: '#0b0000' }, headerTintColor: '#CC0000' }} />
          </Stack>
          <BackToTestButton />
          <StatusBar style="light" />
        </ThemeProvider>
      </TestModeProvider>
    </WalletProvider>
  );
}