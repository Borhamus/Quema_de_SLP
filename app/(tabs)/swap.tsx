import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SwapScreen() {
  const isSwapOpen = false; // Cambia a true para ver la interfaz de swap

  return (
    <SafeAreaView style={styles.container}>
      {!isSwapOpen ? (
        // LA CORTINA
        <ThemedView style={styles.curtain}>
          <IconSymbol name="lock.fill" size={80} color="#666" />
          <ThemedText type="title" style={{marginTop: 20}}>Cortina Cerrada</ThemedText>
          <ThemedText style={styles.description}>
            El intercambio de Axies se habilitará automáticamente al finalizar la fase de venta de tickets (72hs).
          </ThemedText>
        </ThemedView>
      ) : (
        // INTERFAZ DE SWAP
        <ThemedView style={styles.content}>
          <ThemedText type="title">Agujero Negro</ThemedText>
          <View style={styles.poolCard}>
            <ThemedText>Dinero Disponible para Swaps:</ThemedText>
            <ThemedText type="title" style={{color: '#28a745'}}>$1,250.00 USD</ThemedText>
          </View>
          
          <ThemedText type="subtitle">Floor Price Actual: 0.0015 ETH</ThemedText>
          
          <View style={styles.placeholderList}>
            <ThemedText color="#888">[ Aquí aparecerán tus Axies ]</ThemedText>
          </View>
        </ThemedView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  curtain: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  content: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 20 },
  description: { textAlign: 'center', color: '#888', marginTop: 10 },
  poolCard: { backgroundColor: '#1A1A1A', padding: 25, borderRadius: 20, width: '100%', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#28a745' },
  placeholderList: { height: 200, width: '100%', backgroundColor: '#111', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#444' }
});