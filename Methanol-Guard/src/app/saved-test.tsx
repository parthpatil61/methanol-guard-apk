import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { generateTestReport } from '../lib/report';
import { loadTests, type TestRecord } from '../lib/storage';

export default function SavedTestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [test, setTest] = useState<TestRecord | null>(null);

  const loadRecord = useCallback(async () => {
    const tests = await loadTests();

    const found = tests.find(
      (item) => item.id === String(params.id)
    );

    setTest(found ?? null);
  }, [params.id]);

  useFocusEffect(
    useCallback(() => {
      loadRecord();
    }, [loadRecord])
  );

  if (!test) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.title}>Test not found</Text>

          <Text style={styles.lede}>
            This saved record could not be found on this device.
          </Text>

          <Pressable
            style={styles.primary}
            onPress={() => router.replace('/history')}
          >
            <Text style={styles.primaryText}>
              Back to test history
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
      </SafeAreaView>
    );
  }

  const result = test.result;

  const bandLabel =
    result.band === 'high'
      ? 'Risk'
      : result.band === 'suspicious'
        ? 'Suspicious'
        : 'Safe';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.shell}
      >
        {/* Header */}
        <View style={styles.top}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>← History</Text>
          </Pressable>

          <View style={styles.brandRow}>
            <View style={styles.mark} />
            <Text style={styles.brand}>Methanol Guard</Text>
          </View>

          <View style={{ width: 55 }} />
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Screening record only. A colorimetric result is a
            preliminary screen and does not prove that a drink is safe
            or establish legal proof.
          </Text>
        </View>

        <View style={styles.stack}>
          <Text style={styles.title}>Saved test</Text>

          <Text style={styles.date}>
            {new Date(test.createdAt).toLocaleString()}
          </Text>

          {/* Image */}
          {test.imageUri ? (
            <View style={styles.imageCard}>
              <Image
                source={{ uri: test.imageUri }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          ) : null}

          {/* Score */}
          <View
            style={[
              styles.scoreCard,
              result.band === 'high'
                ? styles.highCard
                : result.band === 'suspicious'
                  ? styles.suspiciousCard
                  : styles.safeCard,
            ]}
          >
            <View>
              <Text style={styles.scoreLabel}>
                Demo signal score
              </Text>

              <Text style={styles.score}>
                {result.riskScore}
                <Text style={styles.scoreSmall}>/100</Text>
              </Text>
            </View>

            <View
              style={[
                styles.band,
                result.band === 'high'
                  ? styles.highBand
                  : result.band === 'suspicious'
                    ? styles.suspiciousBand
                    : styles.safeBand,
              ]}
            >
              <Text
                style={[
                  styles.bandText,
                  result.band === 'high'
                    ? styles.highText
                    : result.band === 'suspicious'
                      ? styles.suspiciousText
                      : styles.safeText,
                ]}
              >
                {bandLabel}
              </Text>
            </View>
          </View>

          {/* Sample information */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Sample information
            </Text>

            <InfoRow
              label="Inspector ID"
              value={test.inspectorId || 'Not recorded'}
            />

            <InfoRow
              label="Brand / source"
              value={test.brand || 'Not recorded'}
            />

            <InfoRow
              label="Batch / bottle ID"
              value={test.batchId || 'Not recorded'}
            />

            <InfoRow
              label="Place"
              value={test.locationLabel || 'Not recorded'}
            />

            <InfoRow
              label="GPS"
              value={
                test.lat !== null && test.lng !== null
                  ? `${test.lat.toFixed(6)}, ${test.lng.toFixed(6)}`
                  : 'Not recorded'
              }
            />

            <InfoRow
              label="Notes"
              value={test.notes || 'None'}
            />
          </View>

          {/* Estimate */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Methanol concentration
            </Text>

            <Text style={styles.estimate}>
              Not calibrated
            </Text>

            <Text style={styles.note}>
              Provisional yellow-index demo only. Methanol concentration
              remains unavailable until laboratory calibration.
            </Text>
          </View>

          {/* Interpretation */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Interpretation
            </Text>

            <Text style={styles.body}>
              {result.interpretation}
            </Text>
          </View>

          {/* Quality */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Image quality
            </Text>

            <InfoRow
              label="Lighting"
              value={
                result.quality.lighting === 'ok'
                  ? 'OK'
                  : result.quality.lighting === 'dark'
                    ? 'Too dark'
                    : 'Overexposed'
              }
            />

            <InfoRow
              label="Contrast"
              value={
                result.quality.contrast === 'ok'
                  ? 'OK'
                  : 'Low'
              }
            />

            <InfoRow
              label="Yellow signal"
              value={
                result.quality.yellowSignal === 'strong'
                  ? 'Strong'
                  : result.quality.yellowSignal === 'ok'
                    ? 'Detected'
                    : 'Weak'
              }
            />
          </View>

          {/* Metrics */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Color metrics
            </Text>

            <InfoRow
              label="RGB"
              value={`${result.metrics.r.toFixed(1)}, ${result.metrics.g.toFixed(1)}, ${result.metrics.b.toFixed(1)}`}
            />

            <InfoRow
              label="HSV"
              value={`${result.metrics.h.toFixed(1)}°, ${(result.metrics.s * 100).toFixed(1)}%, ${(result.metrics.v * 100).toFixed(1)}%`}
            />

            <InfoRow
              label="Yellow index (demo)"
              value={(result.metrics.yellowIndex ?? 0).toFixed(3)}
            />

            <InfoRow
              label="Luminance"
              value={result.metrics.luminance.toFixed(1)}
            />

            <InfoRow
              label="Contrast"
              value={result.metrics.contrast.toFixed(1)}
            />
          </View>

          {/* Print / PDF report */}
          <Pressable
            style={styles.primary}
            onPress={async () => {
              try {
                await generateTestReport(test);
              } catch (error) {
                Alert.alert(
                  'Report error',
                  'Could not generate the PDF report.'
                );
                console.error(error);
              }
            }}
          >
            <Text style={styles.primaryText}>
              Print / PDF report
            </Text>
          </Pressable>

          {/* Back */}
          <Pressable
            style={styles.primary}
            onPress={() => router.replace('/history')}
          >
            <Text style={styles.primaryText}>
              Back to test history
            </Text>
          </Pressable>

          {/* Home */}
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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
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

  date: {
    fontSize: 12,
    color: '#5c564c',
  },

  imageCard: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 8,
  },

  image: {
    width: '100%',
    height: 280,
  },

  scoreCard: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    borderLeftWidth: 4,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  safeCard: {
    borderLeftColor: '#2f6b4f',
  },

  suspiciousCard: {
    borderLeftColor: '#9a5b12',
  },

  highCard: {
    borderLeftColor: '#8b1e3d',
  },

  scoreLabel: {
    fontSize: 13,
    color: '#5c564c',
  },

  score: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1c1915',
  },

  scoreSmall: {
    fontSize: 17,
    fontWeight: '400',
  },

  band: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  safeBand: {
    backgroundColor: '#e7efe9',
    borderColor: '#b9cdbf',
  },

  suspiciousBand: {
    backgroundColor: '#f5ead8',
    borderColor: '#dfc49c',
  },

  highBand: {
    backgroundColor: '#f3e3e8',
    borderColor: '#d9b7c3',
  },

  bandText: {
    fontSize: 13,
    fontWeight: '700',
  },

  safeText: {
    color: '#2f6b4f',
  },

  suspiciousText: {
    color: '#9a5b12',
  },

  highText: {
    color: '#8b1e3d',
  },

  card: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 13,
  },

  sectionTitle: {
    color: '#4a1236',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee5d6',
    paddingVertical: 7,
  },

  infoLabel: {
    color: '#5c564c',
    fontSize: 13,
  },

  infoValue: {
    flex: 1,
    color: '#1c1915',
    fontSize: 13,
    textAlign: 'right',
  },

  estimate: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1915',
  },

  note: {
    color: '#5c564c',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  body: {
    color: '#5c564c',
    fontSize: 14,
    lineHeight: 21,
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

  homeLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },

  homeText: {
    color: '#6e1d52',
    fontSize: 14,
    textDecorationLine: 'underline',
  },

  notFound: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 12,
  },
}); 