import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

// IMPORTACIÓN CORREGIDA: Usamos ruta relativa "../../" para subir dos carpetas y entrar a assets
import AxiesGif from '../../assets/images/AxiesCaminando.gif'; 

export default function HomeScreen() {
  const [showInfo, setShowInfo] = useState(false);
  const [showLastEvent, setShowLastEvent] = useState(false);

  return (
    // SOLUCIÓN AL ERROR DE SINTAXIS: 
    // SafeAreaView envuelve TODO. No hay elementos sueltos fuera de él.
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 1. BANNER ANIMADO (TU GIF) */}
        <View style={styles.bannerWrapper}>
          <Image 
            source={AxiesGif} 
            style={styles.banner}
            resizeMode="contain" 
          />
        </View>

        <ThemedText type="title" style={styles.mainTitle}>Evento de Quema SLP</ThemedText>

        {/* 2. CARD PRINCIPAL: TOTAL QUEMADO */}
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle" style={{ color: '#fff', marginBottom: 10 }}>Impacto Global</ThemedText>
          
          <View style={styles.statsRow}>
            <ThemedText style={styles.bigStat}>Total de SLP 🔥:</ThemedText>
            <ThemedText style={styles.bigStat}> 1.5M <ThemedText style={styles.statLabel}>SLP</ThemedText></ThemedText>
          </View>
          
          <View style={styles.statsRow}>
            <ThemedText style={styles.bigStat}>Axies Liberados:</ThemedText>
            <ThemedText style={styles.bigStat}>420 <ThemedText style={styles.statLabel}>Axies</ThemedText></ThemedText>
          </View>
        </ThemedView>

        {/* 3. SECCIÓN: ¿QUÉ ES ESTA PÁGINA? */}
        <TouchableOpacity 
          style={styles.accordionHeader} 
          onPress={() => setShowInfo(!showInfo)}
          activeOpacity={0.7}
        >
          <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>¿Qué es este proyecto?</ThemedText>
          <IconSymbol name={showInfo ? "chevron.up" : "chevron.down"} size={20} color="#fff" />
        </TouchableOpacity>
        
        {showInfo && (
          <ThemedView style={styles.accordionContent}>
            <ThemedText style={styles.infoText}>
              Este es un esfuerzo comunitario para sanear la economía de Axie Infinity. 
              Al participar, ayudás a reducir la sobrepoblación de Axies y el suministro 
              excesivo de SLP, haciendo que tus activos valgan más a largo plazo. 
              ¡Es un win-win para todos los holders!
            </ThemedText>
          </ThemedView>
        )}

        {/* 4. SECCIÓN: EVENTO ANTERIOR */}
        <TouchableOpacity 
          style={styles.accordionHeader} 
          onPress={() => setShowLastEvent(!showLastEvent)}
          activeOpacity={0.7}
        >
          <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>Evento Anterior [Mayo 2024]</ThemedText>
          <IconSymbol name={showLastEvent ? "chevron.up" : "chevron.down"} size={20} color="#fff" />
        </TouchableOpacity>

        {showLastEvent && (
          <ThemedView style={styles.accordionContent}>
            <ThemedText style={styles.infoText}>
              • SLP Quemado: 500,000 {"\n"}
              • Axies Liberados: 120 {"\n"}
              • Premio Mayor: Mystic Axie #1234
            </ThemedText>
          </ThemedView>
        )}

        <View style={{ height: 20 }} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  // Estilos del Banner
  bannerWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  banner: {
    width: '100%',
    height: 220,
    backgroundColor: '#111',
  },
  mainTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  // Estilos de la Tarjeta
  card: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bigStat: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'normal',
  },
  // Estilos Acordeón
  accordionHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginTop: 10,
  },
  accordionContent: {
    width: '100%',
    paddingVertical: 15,
    backgroundColor: '#111',
    borderRadius: 8,
    marginTop: 5,
    paddingHorizontal: 10,
  },
  infoText: {
    color: '#ccc',
    lineHeight: 22,
  },
});