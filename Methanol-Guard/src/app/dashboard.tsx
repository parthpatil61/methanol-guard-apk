import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadTests, type TestRecord } from '../lib/storage';

export default function DashboardScreen() {
  const router = useRouter();

  const [tests, setTests] = useState<TestRecord[]>([]);

  const refresh = useCallback(async () => {
    const records = await loadTests();
    setTests(records);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const lowSignal = tests.filter(
    (test) => test.result.band === 'safe'
  ).length;

  const suspicious = tests.filter(
    (test) => test.result.band === 'suspicious'
  ).length;

  const highRisk = tests.filter(
    (test) => test.result.band === 'high'
  ).length;

  const places = tests.reduce<Record<string, number>>(
    (acc, test) => {
      const place =
        test.locationLabel.trim() || 'Unknown place';

      acc[place] = (acc[place] || 0) + 1;

      return acc;
    },
    {}
  );

  const placeEntries = Object.entries(places).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.shell}
      >
        {/* Header */}
        <View style={styles.top}>
          <Pressable onPress={() => router.replace('/')}>
            <Text style={styles.back}>← Home</Text>
          </Pressable>

          <View style={styles.brandRow}>
            <View style={styles.mark} />
            <Text style={styles.brand}>
              Methanol Guard
            </Text>
          </View>

          <View style={{ width: 55 }} />
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Counts stay on this device. No cloud sync in this
            prototype. Screening results require laboratory
            confirmation.
          </Text>
        </View>

        <View style={styles.stack}>
          <Text style={styles.title}>
            Local surveillance snapshot
          </Text>

          <Text style={styles.lede}>
            A quick summary of saved preliminary screening records.
          </Text>

          {/* Total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalNumber}>
              {tests.length}
            </Text>

            <Text style={styles.totalLabel}>
              total saved tests
            </Text>
          </View>

          {/* Counts */}
          <View style={styles.stats}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {lowSignal}
              </Text>

              <Text style={styles.statLabel}>
                low signal
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text
                style={[
                  styles.statNumber,
                  styles.suspiciousNumber,
                ]}
              >
                {suspicious}
              </Text>

              <Text style={styles.statLabel}>
                suspicious
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text
                style={[
                  styles.statNumber,
                  styles.highNumber,
                ]}
              >
                {highRisk}
              </Text>

              <Text style={styles.statLabel}>
                high risk
              </Text>
            </View>
          </View>

          {/* Places */}
          <View style={styles.placesCard}>
            <Text style={styles.sectionTitle}>
              Flagged tests by place
            </Text>

            {placeEntries.length === 0 ? (
              <Text style={styles.emptyText}>
                No saved screening records yet.
              </Text>
            ) : (
              placeEntries.map(([place, count]) => (
                <View
                  key={place}
                  style={styles.placeRow}
                >
                  <Text style={styles.placeName}>
                    {place}
                  </Text>

                  <Text style={styles.placeCount}>
                    {count}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Risk summary */}
          {highRisk > 0 && (
            <View style={styles.alertCard}>
              <Text style={styles.alertTitle}>
                {highRisk} high-risk screening
                {highRisk === 1 ? '' : 's'} recorded
              </Text>

              <Text style={styles.alertText}>
                These are preliminary screening signals. Samples
                with concerning results should be sent for
                confirmatory laboratory analysis.
              </Text>
            </View>
          )}

          {suspicious > 0 && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>
                Suspicious signals
              </Text>

              <Text style={styles.warningText}>
                {suspicious} record
                {suspicious === 1 ? '' : 's'} currently show a
                suspicious screening signal.
              </Text>
            </View>
          )}

          {/* History */}
          <Pressable
            style={({ pressed }) => [
              styles.primary,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/history')}
          >
            <Text style={styles.primaryText}>
              View test history
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.ghost,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/guide')}
          >
            <Text style={styles.ghostText}>
              Start new screen
            </Text>
          </Pressable>

          <Pressable
            style={styles.homeLink}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.homeText}>
              Home
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
    paddingTop: 18,
    paddingBottom: 48,
  },

  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  back: {
    color: '#6e1d52',
    fontSize: 15,
    fontWeight: '600',
  },

  brandRow: {
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

  brand: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4a1236',
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
  },

  lede: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5c564c',
  },

  totalCard: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 14,
  },

  totalNumber: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1c1915',
  },

  totalLabel: {
    fontSize: 13,
    color: '#5c564c',
  },

  stats: {
    flexDirection: 'row',
    gap: 8,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 10,
  },

  statNumber: {
    fontSize: 25,
    fontWeight: '700',
    color: '#2f6b4f',
  },

  suspiciousNumber: {
    color: '#9a5b12',
  },

  highNumber: {
    color: '#8b1e3d',
  },

  statLabel: {
    fontSize: 11,
    color: '#5c564c',
    marginTop: 2,
  },

  placesCard: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 13,
  },

  sectionTitle: {
    color: '#4a1236',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 7,
  },

  placeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee5d6',
    paddingVertical: 8,
  },

  placeName: {
    flex: 1,
    color: '#1c1915',
    fontSize: 14,
  },

  placeCount: {
    color: '#6e1d52',
    fontSize: 14,
    fontWeight: '700',
  },

  emptyText: {
    color: '#5c564c',
    fontSize: 13,
  },

  alertCard: {
    backgroundColor: '#f3e3e8',
    borderWidth: 1,
    borderColor: '#d9b7c3',
    padding: 13,
  },

  alertTitle: {
    color: '#8b1e3d',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },

  alertText: {
    color: '#5c564c',
    fontSize: 13,
    lineHeight: 19,
  },

  warningCard: {
    backgroundColor: '#f5ead8',
    borderWidth: 1,
    borderColor: '#dfc49c',
    padding: 13,
  },

  warningTitle: {
    color: '#9a5b12',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },

  warningText: {
    color: '#5c564c',
    fontSize: 13,
    lineHeight: 19,
  },

  primary: {
    backgroundColor: '#6e1d52',
    borderWidth: 1,
    borderColor: '#4a1236',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 2,
  },

  primaryText: {
    color: '#fffaf1',
    fontSize: 15,
    fontWeight: '600',
  },

  ghost: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 2,
  },

  ghostText: {
    color: '#1c1915',
    fontSize: 15,
  },

  homeLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },

  homeText: {
    color: '#6e1d52',
    fontSize: 14,
    textDecorationLine: 'underline',
  },

  pressed: {
    opacity: 0.65,
  },
});