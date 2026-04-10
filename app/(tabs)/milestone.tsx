import React from 'react';
import { StyleSheet, View, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

// DATOS SIMULADOS
const GOAL_TOTAL = 500; 
const CURRENT_TOTAL = 135; 

const milestonesData = [
  { id: 1, amount: 50, title: 'Milestone 1: Reclutamiento', status: 'completed', bought: 'Axie #1234 (Pekin)', txHash: '0x8a...4b2' },
  { id: 2, amount: 100, title: 'Milestone 2: Equipamiento', status: 'completed', bought: 'Item: Espada Legendaria', txHash: '0x7c...9a1' },
  { id: 3, amount: 200, title: 'Milestone 3: Expansión', status: 'pending', bought: null, txHash: null },
  { id: 4, amount: 500, title: 'Milestone Final: Gran Premio', status: 'pending', bought: null, txHash: null },
];

export default function MilestoneScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* TÍTULO */}
        <ThemedText type="title" style={styles.headerTitle}>Progreso Comunitario</ThemedText>

        {/* 1. EL TERMÓMETRO */}
        <View style={styles.thermometerContainer}>
          <View style={styles.thermometerLabels}>
            <ThemedText style={{color: '#fff', fontWeight: 'bold'}}>${CURRENT_TOTAL} Recaudados</ThemedText>
            <ThemedText style={{color: '#888'}}>Meta: ${GOAL_TOTAL}</ThemedText>
          </View>
          
          <View style={styles.thermometerBg}>
            <View style={[
              styles.thermometerFill, 
              { width: `${(CURRENT_TOTAL / GOAL_TOTAL) * 100}%` }
            ]} />
          </View>
          <ThemedText style={styles.percentageText}>
            {Math.round((CURRENT_TOTAL / GOAL_TOTAL) * 100)}% Completado
          </ThemedText>
        </View>

        {/* 2. LISTA DE MILESTONES */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>Logros Alcanzados</ThemedText>
        <FlatList
          data={milestonesData}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={[styles.milestoneItem, item.status === 'completed' && styles.completedMilestone]}>
              <IconSymbol 
                name={item.status === 'completed' ? "checkmark.circle.fill" : "circle"} 
                size={24} 
                color={item.status === 'completed' ? "#28a745" : "#444"} 
              />
              <View style={styles.milestoneInfo}>
                <ThemedText style={styles.milestoneAmount}>Meta: ${item.amount}</ThemedText>
                <ThemedText style={styles.milestoneDesc}>{item.title}</ThemedText>
                
                {item.status === 'completed' && (
                  <View style={styles.rewardBox}>
                    <ThemedText style={styles.rewardText}>🎁 Comprado por el sistema:</ThemedText>
                    <ThemedText style={styles.assetName}>{item.bought}</ThemedText>
                    <ThemedText style={styles.txHash}>Tx: {item.txHash}</ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}
        />

        {/* 3. WALLET DE LA PAGINA */}
        <ThemedView style={styles.treasuryBox}>
          <ThemedText type="defaultSemiBold" style={{color: '#FFD700', marginBottom: 10}}>
            🏛️ Tesorería del Proyecto (Wallet)
          </ThemedText>
          <ThemedText style={styles.treasuryText}>
            Todos los activos comprados por los milestones se almacenan en esta billetera pública en Ronin Network.
          </ThemedText>
          <View style={styles.addressBox}>
            <ThemedText style={styles.addressText}>ronin:9f...3a2b</ThemedText>
            <TouchableOpacity><IconSymbol name="doc.on.doc" size={16} color="#888" /></TouchableOpacity>
          </View>
        </ThemedView>

        {/* Espacio final para scroll */}
        <View style={{ height: 30 }} />

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
    paddingBottom: 50 // Extra padding para la tab bar
  },
  headerTitle: {
    color: '#fff',
    marginBottom: 25,
    textAlign: 'center',
  },
  // Estilos del Termómetro
  thermometerContainer: {
    marginBottom: 30,
  },
  thermometerLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  thermometerBg: {
    height: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
  },
  thermometerFill: {
    height: '100%',
    backgroundColor: '#FFD700', // Dorado
    borderRadius: 10,
  },
  percentageText: {
    textAlign: 'center',
    color: '#FFD700',
    marginTop: 5,
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    color: '#fff',
    marginBottom: 15,
    marginTop: 10,
  },
  // Estilos de Items Milestone
  milestoneItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'flex-start',
  },
  completedMilestone: {
    borderColor: '#28a745',
    backgroundColor: '#0f2b12',
  },
  milestoneInfo: {
    marginLeft: 15,
    flex: 1,
  },
  milestoneAmount: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  milestoneDesc: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 5,
  },
  rewardBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#000',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  rewardText: {
    fontSize: 12,
    color: '#888',
  },
  assetName: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 14,
  },
  txHash: {
    fontSize: 10,
    color: '#555',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  // Estilos de Tesorería
  treasuryBox: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  treasuryText: {
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  addressText: {
    color: '#fff',
    marginRight: 10,
    fontFamily: 'monospace',
  },
});