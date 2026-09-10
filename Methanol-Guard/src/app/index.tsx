import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadTests } from '../lib/storage';
import { testSupabaseConnection } from '../lib/testSupabase';

const FDA_URL = 'https://complaints.mahafda.in/';

export default function HomeScreen() {
  const router = useRouter();

  const [savedTests, setSavedTests] = useState(0);
  const [highRiskFlags, setHighRiskFlags] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadStats() {
        try {
          const tests = await loadTests();

          if (!active) return;

          setSavedTests(tests.length);

          const highRisk = tests.filter(
            (test) => test.result.band === 'high',
          ).length;

          setHighRiskFlags(highRisk);
        } catch (error) {
          console.error('Could not load home statistics:', error);

          if (!active) return;

          setSavedTests(0);
          setHighRiskFlags(0);
        }
      }

      loadStats();

      return () => {
        active = false;
      };
    }, []),
  );

  async function handleSupabaseTest() {
    try {
      const connected = await testSupabaseConnection();

      Alert.alert(
        connected
          ? 'Supabase Connected ✅'
          : 'Connection Failed ❌',
        connected
          ? 'Methanol Guard can access the tests database.'
          : 'Check the Supabase URL, key, and database permissions.',
      );
    } catch (error) {
      console.error('Supabase test failed:', error);

      Alert.alert(
        'Connection Failed ❌',
        'Could not connect to Supabase.',
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.shell}
      >
        {/* Header */}
        <View style={styles.top}>
          <Pressable
            style={styles.brand}
            onPress={() => router.replace('/')}
          >
            <View style={styles.mark} />

            <Text style={styles.brandText}>
              Methanol Guard
            </Text>
          </Pressable>

          <Text style={styles.tag}>
            Field screening companion
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Screening tool only — purple color is a preliminary
            chromotropic-acid style signal. Confirm with a laboratory.
            Not medical or legal advice.
          </Text>
        </View>

        {/* Main */}
        <View style={styles.stack}>
          <Text style={styles.title}>
            Instant strip screening for suspected methanol in alcohol
          </Text>

          <Text style={styles.lede}>
            Photograph a paper colorimetric strip, measure the violet
            reaction zone, and log a field record for inspectors. Built
            for Aviskar as a companion to a chromotropic-acid paper strip.
          </Text>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {savedTests}
              </Text>

              <Text style={styles.statLabel}>
                saved tests
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {highRiskFlags}
              </Text>

              <Text style={styles.statLabel}>
                high-risk flags
              </Text>
            </View>
          </View>

          {/* Start */}
          <Pressable
            style={({ pressed }) => [
              styles.primary,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/guide')}
          >
            <Text style={styles.primaryText}>
              Start new screen
            </Text>
          </Pressable>

          {/* Secondary buttons */}
          <View style={styles.row}>
            <Pressable
              style={({ pressed }) => [
                styles.ghost,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/history')}
            >
              <Text style={styles.ghostText}>
                Test history
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.ghost,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/dashboard')}
            >
              <Text style={styles.ghostText}>
                Dashboard
              </Text>
            </Pressable>
          </View>

          {/* Government Authority */}
          <View style={styles.authorityCard}>
            <Text style={styles.authorityTitle}>
              Government Authority
            </Text>

            <Text style={styles.authorityText}>
              Authorized personnel can access the Methanol Guard
              surveillance portal.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.authorityButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/authority-login')}
            >
              <Text style={styles.authorityButtonText}>
                Government Authority Portal
              </Text>
            </Pressable>
          </View>

          {/* Temporary Supabase Test */}
          <Pressable
            style={({ pressed }) => [
              styles.authorityButton,
              pressed && styles.pressed,
            ]}
            onPress={handleSupabaseTest}
          >
            <Text style={styles.authorityButtonText}>
              Test Cloud Connection
            </Text>
          </Pressable>

          {/* Steps */}
          <View style={styles.steps}>
            <Text style={styles.step}>
              <Text style={styles.stepNumber}>1. </Text>
              Apply sample to the strip and wait the kit time.
            </Text>

            <Text style={styles.step}>
              <Text style={styles.stepNumber}>2. </Text>
              Photograph the reaction pad in even light.
            </Text>

            <Text style={styles.step}>
              <Text style={styles.stepNumber}>3. </Text>
              Place the circle on the purple (or blank) zone.
            </Text>

            <Text style={styles.step}>
              <Text style={styles.stepNumber}>4. </Text>
              Save GPS + batch notes. High risk → lab confirmation.
            </Text>
          </View>

          {/* FDA */}
          <Pressable
            onPress={() => Linking.openURL(FDA_URL)}
          >
            <Text style={styles.fda}>
              Maharashtra FDA complaint portal
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f1e6',
  },

  shell: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 48,
  },

  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  mark: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#6e1d52',
    borderWidth: 3,
    borderColor: '#ead8c0',
  },

  brandText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4a1236',
  },

  tag: {
    fontSize: 12,
    color: '#5c564c',
  },

  disclaimer: {
    backgroundColor: '#efe4c8',
    borderWidth: 1,
    borderColor: '#d4c392',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 18,
  },

  disclaimerText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#1c1915',
  },

  stack: {
    gap: 12,
  },

  title: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '700',
    color: '#1c1915',
    letterSpacing: -0.5,
  },

  lede: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5c564c',
  },

  stats: {
    flexDirection: 'row',
    gap: 10,
  },

  statBox: {
    flex: 1,
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 12,
  },

  statNumber: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1c1915',
  },

  statLabel: {
    fontSize: 13,
    color: '#5c564c',
    marginTop: 2,
  },

  primary: {
    backgroundColor: '#6e1d52',
    borderWidth: 1,
    borderColor: '#4a1236',
    borderRadius: 2,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
  },

  primaryText: {
    color: '#fffaf1',
    fontSize: 16,
    fontWeight: '600',
  },

  row: {
    flexDirection: 'row',
    gap: 8,
  },

  ghost: {
    flex: 1,
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    borderRadius: 2,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
  },

  ghostText: {
    color: '#1c1915',
    fontSize: 15,
  },

  /* Government Authority */

  authorityCard: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 14,
    marginTop: 2,
  },

  authorityTitle: {
    color: '#4a1236',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },

  authorityText: {
    color: '#5c564c',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },

  authorityButton: {
    backgroundColor: '#4a1236',
    borderWidth: 1,
    borderColor: '#6e1d52',
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
  },

  authorityButtonText: {
    color: '#fffaf1',
    fontSize: 14,
    fontWeight: '600',
  },

  pressed: {
    opacity: 0.65,
  },

  steps: {
    marginTop: 8,
    gap: 9,
    paddingLeft: 4,
  },

  step: {
    fontSize: 14,
    lineHeight: 21,
    color: '#1c1915',
  },

  stepNumber: {
    fontWeight: '700',
    color: '#6e1d52',
  },

  fda: {
    color: '#6e1d52',
    fontSize: 15,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
});