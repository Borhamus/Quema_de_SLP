import { StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SpecialScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText style={styles.emoji}>🏆</ThemedText>
        <ThemedText type="title">Gran Evento Anual</ThemedText>
        
        <ThemedText style={styles.info}>
          Solo para leyendas. Para entrar necesitas usar una llave anual minteada en tu perfil.
        </ThemedText>

        <ThemedView style={styles.keySlot}>
           <ThemedText style={{color: '#FFD700', fontWeight: 'bold'}}>INSERTAR LLAVE 2024</ThemedText>
        </ThemedView>

        <TouchableOpacity style={styles.disabledButton}>
          <ThemedText style={{color: '#555'}}>Participar en Sorteo Especial</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, gap: 15 },
  emoji: { fontSize: 60 },
  info: { textAlign: 'center', color: '#ccc', marginBottom: 20 },
  keySlot: { width: '100%', height: 100, borderRadius: 20, backgroundColor: '#1A1A1A', borderWidth: 2, borderColor: '#FFD700', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  disabledButton: { marginTop: 20, padding: 15, borderRadius: 10, backgroundColor: '#222', width: '100%', alignItems: 'center' }
});