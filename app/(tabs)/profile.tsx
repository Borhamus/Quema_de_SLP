import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native'; // Agregué ScrollView
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProfileScreen() {
  const eventoActivo = true; 
  const tickets = []; // Aquí irían tus tickets reales (array vacío = bolsa vacía)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <ThemedView style={styles.content}>
        <ThemedText type="title">Mi Perfil</ThemedText>
          
          {/* Botón de Conexión */}
          <TouchableOpacity style={styles.connectButton}>
            <IconSymbol name="wallet.pass.fill" size={20} color="white" />
            <ThemedText style={styles.buttonText}>Conectar Ronin Wallet</ThemedText>
          </TouchableOpacity>

          {/* Sección de Tickets (ARREGLADO EL 0) */}
          <View style={styles.card}>
            <ThemedText type="subtitle">Mis Tickets del Mes</ThemedText>
            {/* AGREGADO lineHeight y textAlignVertical para evitar que se corte el 0 */}
            <ThemedText 
              type="defaultSemiBold" 
              style={{
                fontSize: 40, 
                lineHeight: 50, // Esto empuja el texto hacia arriba un poco
                textAlignVertical: 'center'
              }}
            >
              0
            </ThemedText>
            <ThemedText style={{ color: '#888' }}>Has acumulado 0/12 para la llave anual</ThemedText>
          </View>

          {/* Botón de Compra condicional */}
          {eventoActivo && (
            <TouchableOpacity style={styles.buyButton}>
              <ThemedText style={styles.buttonText}>Comprar Ticket (3 USD en SLP)</ThemedText>
              <ThemedText style={{fontSize: 10, color: 'white', marginTop: 5}}>Puedes comprar más de uno</ThemedText>
            </TouchableOpacity>
          )}

          {/* NUEVA SECCIÓN: LA BOLSA (INVENTARIO) */}
          <View style={styles.bagSection}>
            <ThemedText type="subtitle" style={styles.bagTitle}>👜 Tu Bolsa</ThemedText>
            
            <View style={styles.bagGrid}>
              {tickets.length === 0 ? (
                // ESTADO VACÍO
                <View style={styles.emptyBag}>
                  <IconSymbol name="bag" size={40} color="#333" />
                  <ThemedText style={styles.emptyText}>No tienes tickets en la bolsa</ThemedText>
                </View>
              ) : (
                // AQUÍ SE MAPEARÍAN LOS TICKETS (Ejemplo visual)
                /* tickets.map(ticket => <TicketCard key={ticket.id} />) */
                <ThemedText>Tickets aparecerían aquí</ThemedText>
              )}
            </View>
          </View>

          

          {/* Botón de Mintear Llave (Deshabilitado) */}
          <TouchableOpacity style={[styles.connectButton, {backgroundColor: '#444'}]}>
            <ThemedText style={styles.buttonText}>Mintear Llave Anual 🔑</ThemedText>
          </TouchableOpacity>
          
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  scrollContent: {
    padding: 20,
  },
  content: { 
    alignItems: 'center', 
    gap: 25, // Más espacio entre elementos
    paddingBottom: 30
  },
  connectButton: { 
    backgroundColor: '#1273ea', 
    padding: 15, 
    borderRadius: 12, 
    flexDirection: 'row', 
    gap: 10, 
    width: '100%', 
    justifyContent: 'center',
    alignItems: 'center'
  },
  buyButton: { 
    backgroundColor: '#28a745', 
    padding: 20, 
    borderRadius: 12, 
    width: '100%', 
    alignItems: 'center' 
  },
  buttonText: { 
    color: 'white', 
    fontWeight: 'bold',
    fontSize: 16
  },
  card: { 
    backgroundColor: '#1A1A1A', 
    padding: 20, 
    borderRadius: 15, 
    width: '100%', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#333',
    minHeight: 120, // Asegura que la tarjeta tenga altura suficiente para el texto
    justifyContent: 'center' // Centra todo verticalmente dentro de la tarjeta
  },
  // Estilos de la Bolsa
  bagSection: {
    width: '100%',
  },
  bagTitle: {
    marginBottom: 10,
    color: '#fff',
  },
  bagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#111',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 150, // Altura mínima para que se vea como un espacio
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyBag: {
    alignItems: 'center',
    opacity: 0.5
  },
  emptyText: {
    color: '#666',
    marginTop: 10,
    fontSize: 14
  }
});