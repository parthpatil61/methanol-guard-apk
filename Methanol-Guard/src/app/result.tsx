import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  analyzeJpegBuffer,
  type AnalysisResult,
} from '../lib/colorNative';

import { saveTest } from '../lib/storage';

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const imageUri =
    String(params.imageUri ?? '');

  /*
   * ROI selected on the camera screen.
   *
   * Defaults to center for compatibility
   * with older captured records/routes.
   */
  const roiX = Number(
    params.roiX ?? 0.5
  );

  const roiY = Number(
    params.roiY ?? 0.5
  );

  const [result, setResult] =
    useState<AnalysisResult | null>(null);

  const [analyzing, setAnalyzing] =
    useState(false);

  async function analyzeColor() {
    if (!imageUri) {
      Alert.alert(
        'No image',
        'No captured image was found. Please retake the photo.'
      );

      return;
    }

    try {
      setAnalyzing(true);

      /*
       * Read the camera JPEG as Base64.
       */
      const base64 =
        await FileSystem.readAsStringAsync(
          imageUri,
          {
            encoding:
              FileSystem.EncodingType.Base64,
          }
        );

      /*
       * Convert Base64 → Uint8Array.
       */
      const binary =
        atob(base64);

      const bytes =
        new Uint8Array(
          binary.length
        );

      for (
        let i = 0;
        i < binary.length;
        i++
      ) {
        bytes[i] =
          binary.charCodeAt(i);
      }

      /*
       * Analyze the selected ROI.
       */
      const analysis =
        analyzeJpegBuffer(
          bytes,
          roiX,
          roiY
        );

      setResult(
        analysis
      );

    } catch (error) {
      console.error(error);

      Alert.alert(
        'Analysis failed',
        'The photo could not be analyzed. Please retake the image and try again.'
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function openFDA() {
    Linking.openURL(
      'https://complaints.mahafda.in/'
    );
  }

  const bandLabel =
    result?.band === 'high'
      ? 'High risk'
      : result?.band === 'suspicious'
        ? 'Suspicious'
        : 'Screening: low signal';

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.shell
        }
      >

        {/* Header */}
        <View style={styles.top}>
          <Pressable
            onPress={() =>
              router.back()
            }
          >
            <Text style={styles.back}>
              ← Retake
            </Text>
          </Pressable>

          <View style={styles.brandRow}>
            <View style={styles.mark} />

            <Text style={styles.brand}>
              Methanol Guard
            </Text>
          </View>

          <View
            style={{ width: 55 }}
          />
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text
            style={styles.disclaimerText}
          >
            DEMO ONLY — provisional yellow-colour detection for the Nash-reagent
            reaction zone. Thresholds are not calibrated and do not establish
            methanol presence or concentration.
          </Text>
        </View>

        <View style={styles.stack}>

          <Text style={styles.title}>
            Screening result
          </Text>

          <Text style={styles.lede}>
            Review the photographed reaction zone and color analysis
            before saving the field record.
          </Text>

          {/* ROI information */}
          <View style={styles.roiInfo}>
            <Text
              style={styles.roiInfoTitle}
            >
              Sampling position
            </Text>

            <Text
              style={styles.roiInfoText}
            >
              {Math.round(roiX * 100)}% across,{' '}
              {Math.round(roiY * 100)}% down
            </Text>
          </View>

          {/* Captured image */}
          {imageUri ? (
            <View style={styles.imageCard}>
              <Image
                source={{
                  uri: imageUri,
                }}
                style={
                  styles.resultImage
                }
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={styles.noImage}>
              <Text
                style={styles.noImageText}
              >
                No image captured
              </Text>
            </View>
          )}

          {/* Result */}
          {result ? (
            <>
              {/* Score */}
              <View
                style={[
                  styles.scoreCard,
                  result.band === 'high'
                    ? styles.highCard
                    : result.band ===
                        'suspicious'
                      ? styles.suspiciousCard
                      : styles.safeCard,
                ]}
              >
                <View>
                  <Text
                    style={
                      styles.scoreLabel
                    }
                  >
                    Demo signal score
                  </Text>

                  <Text
                    style={styles.score}
                  >
                    {result.riskScore}

                    <Text
                      style={
                        styles.scoreSmall
                      }
                    >
                      /100
                    </Text>
                  </Text>
                </View>

                <View
                  style={[
                    styles.bandBox,
                    result.band ===
                    'high'
                      ? styles.highBand
                      : result.band ===
                          'suspicious'
                        ? styles.suspiciousBand
                        : styles.safeBand,
                  ]}
                >
                  <Text
                    style={[
                      styles.bandLabel,
                      result.band ===
                      'high'
                        ? styles.highText
                        : result.band ===
                            'suspicious'
                          ? styles.suspiciousText
                          : styles.safeText,
                    ]}
                  >
                    {bandLabel}
                  </Text>
                </View>
              </View>

              {/* Demo estimate */}
              <View
                style={styles.metricCard}
              >
                <Text
                  style={
                    styles.metricTitle
                  }
                >
                  Methanol concentration
                </Text>

                <Text
                  style={
                    styles.metricValue
                  }
                >
                  Not calibrated
                </Text>

                <Text
                  style={
                    styles.metricNote
                  }
                >
                  Concentration output is disabled until the strip is calibrated
                  against known methanol standards.
                </Text>
              </View>

              {/* Interpretation */}
              <View
                style={styles.card}
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Interpretation
                </Text>

                <Text
                  style={
                    styles.bodyText
                  }
                >
                  {result.interpretation}
                </Text>
              </View>

              {/* Quality */}
              <View
                style={styles.card}
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Image quality
                </Text>

                <QualityRow
                  name="Lighting"
                  value={
                    result.quality
                      .lighting ===
                    'ok'
                      ? 'OK'
                      : result.quality
                          .lighting ===
                        'dark'
                        ? 'Too dark'
                        : 'Overexposed'
                  }
                  warning={
                    result.quality
                      .lighting !==
                    'ok'
                  }
                />

                <QualityRow
                  name="Contrast"
                  value={
                    result.quality
                      .contrast ===
                    'ok'
                      ? 'OK'
                      : 'Low'
                  }
                  warning={
                    result.quality
                      .contrast !==
                    'ok'
                  }
                />

                <QualityRow
                  name="Yellow signal"
                  value={
                    result.quality
                      .yellowSignal ===
                    'strong'
                      ? 'Strong'
                      : result.quality
                          .purpleSignal ===
                        'ok'
                        ? 'Detected'
                        : 'Weak'
                  }
                  warning={
                    result.quality
                      .purpleSignal !==
                    'strong'
                  }
                />

                {result.quality.messages.map(
                  (message) => (
                    <Text
                      key={message}
                      style={
                        styles.warning
                      }
                    >
                      {message}
                    </Text>
                  )
                )}
              </View>

              {/* Color metrics */}
              <View
                style={styles.card}
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Color metrics
                </Text>

                <Metric
                  label="RGB"
                  value={`${result.metrics.r.toFixed(1)}, ${result.metrics.g.toFixed(1)}, ${result.metrics.b.toFixed(1)}`}
                />

                <Metric
                  label="HSV"
                  value={`${result.metrics.h.toFixed(1)}°, ${(result.metrics.s * 100).toFixed(1)}%, ${(result.metrics.v * 100).toFixed(1)}%`}
                />

                <Metric
                  label="Yellow index (demo)"
                  value={result.metrics.yellowIndex.toFixed(3)}
                />

                <Metric
                  label="Luminance"
                  value={result.metrics.luminance.toFixed(1)}
                />

                <Metric
                  label="Contrast"
                  value={result.metrics.contrast.toFixed(1)}
                />

                <Metric
                  label="GPS"
                  value={
                    params.lat &&
                    params.lng
                      ? `${params.lat}, ${params.lng}`
                      : 'Not recorded'
                  }
                />
              </View>
            </>
          ) : (
            <View
              style={styles.card}
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Ready for analysis
              </Text>

              <Text
                style={
                  styles.bodyText
                }
              >
                Analyze the captured image to calculate the preliminary
                RGB, HSV and provisional yellow-index measurements from the selected
                sampling circle.
              </Text>
            </View>
          )}

          {/* Analyze */}
          <Pressable
            style={({ pressed }) => [
              styles.primary,
              pressed &&
                styles.pressed,
            ]}
            onPress={
              analyzeColor
            }
            disabled={analyzing}
          >
            <Text
              style={
                styles.primaryText
              }
            >
              {analyzing
                ? 'Analyzing…'
                : result
                  ? 'Analyze again'
                  : 'Analyze color'}
            </Text>
          </Pressable>

          {/* Retake / Save */}
          <View
            style={styles.buttonRow}
          >
            <Pressable
              style={({ pressed }) => [
                styles.ghost,
                pressed &&
                  styles.pressed,
              ]}
              onPress={() =>
                router.back()
              }
            >
              <Text
                style={
                  styles.ghostText
                }
              >
                Retake
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.ghost,
                pressed &&
                  styles.pressed,
              ]}
              onPress={async () => {
                if (!result) {
                  Alert.alert(
                    'Analyze first',
                    'Please analyze the color before saving the test.'
                  );
                  return;
                }

                try {
                  await saveTest({
                    id: Date.now().toString(),

                    createdAt:
                      new Date().toISOString(),

                    inspectorId:
                      String(
                        params.inspectorId ??
                          ''
                      ),

                    brand:
                      String(
                        params.brand ??
                          ''
                      ),

                    batchId:
                      String(
                        params.batchId ??
                          ''
                      ),

                    locationLabel:
                      String(
                        params.locationLabel ??
                          ''
                      ),

                    notes:
                      String(
                        params.notes ??
                          ''
                      ),

                    lat:
                      params.lat &&
                      String(
                        params.lat
                      ) !== ''
                        ? Number(
                            params.lat
                          )
                        : null,

                    lng:
                      params.lng &&
                      String(
                        params.lng
                      ) !== ''
                        ? Number(
                            params.lng
                          )
                        : null,

                    imageUri,

                    result: {
                      riskScore:
                        result.riskScore,

                      band:
                        result.band,

                      estimatedMgL:
                        result.estimatedMgL,

                      interpretation:
                        result.interpretation,

                      metrics:
                        result.metrics,

                      quality:
                        result.quality,
                    },
                  });

                  Alert.alert(
                    'Test saved',
                    'This test has been saved locally on this device.'
                  );

                } catch (error) {
                  console.error(
                    error
                  );

                  Alert.alert(
                    'Save failed',
                    'Could not save this test.'
                  );
                }
              }}
            >
              <Text
                style={
                  styles.ghostText
                }
              >
                Save locally
              </Text>
            </Pressable>
          </View>

          {/* FDA */}
          {result &&
            result.band !==
              'safe' && (
              <Pressable
                style={
                  styles.fdaButton
                }
                onPress={
                  openFDA
                }
              >
                <Text
                  style={
                    styles.fdaText
                  }
                >
                  Open Maharashtra FDA complaint portal
                </Text>
              </Pressable>
            )}

          {/* Home */}
          <Pressable
            style={
              styles.homeButton
            }
            onPress={() =>
              router.replace('/')
            }
          >
            <Text
              style={
                styles.homeText
              }
            >
              Home
            </Text>
          </Pressable>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={styles.metricRow}
    >
      <Text
        style={
          styles.metricLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.metricSmallValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

function QualityRow({
  name,
  value,
  warning,
}: {
  name: string;
  value: string;
  warning: boolean;
}) {
  return (
    <View
      style={styles.metricRow}
    >
      <Text
        style={
          styles.metricLabel
        }
      >
        {name}
      </Text>

      <Text
        style={
          warning
            ? styles.warningValue
            : styles.okValue
        }
      >
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

  roiInfo: {
    backgroundColor: '#efe4c8',
    borderWidth: 1,
    borderColor: '#d4c392',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  roiInfoTitle: {
    color: '#4a1236',
    fontSize: 13,
    fontWeight: '700',
  },

  roiInfoText: {
    color: '#5c564c',
    fontSize: 12,
    marginTop: 2,
  },

  imageCard: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 8,
  },

  resultImage: {
    width: '100%',
    height: 260,
  },

  noImage: {
    height: 230,
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    alignItems: 'center',
    justifyContent: 'center',
  },

  noImageText: {
    color: '#5c564c',
  },

  scoreCard: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    borderLeftWidth: 4,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    lineHeight: 40,
    fontWeight: '700',
    color: '#1c1915',
  },

  scoreSmall: {
    fontSize: 17,
    fontWeight: '400',
  },

  bandBox: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
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

  bandLabel: {
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

  metricCard: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 13,
  },

  metricTitle: {
    color: '#5c564c',
    fontSize: 13,
  },

  metricValue: {
    color: '#1c1915',
    fontSize: 23,
    fontWeight: '700',
    marginTop: 3,
  },

  metricNote: {
    color: '#5c564c',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
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

  bodyText: {
    color: '#5c564c',
    fontSize: 14,
    lineHeight: 21,
  },

  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: '#eee5d6',
  },

  metricLabel: {
    color: '#5c564c',
    fontSize: 13,
  },

  metricSmallValue: {
    color: '#1c1915',
    fontSize: 13,
    maxWidth: '68%',
    textAlign: 'right',
  },

  okValue: {
    color: '#2f6b4f',
    fontSize: 13,
    fontWeight: '700',
  },

  warningValue: {
    color: '#9a5b12',
    fontSize: 13,
    fontWeight: '700',
  },

  warning: {
    color: '#9a5b12',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
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

  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },

  ghost: {
    flex: 1,
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

  fdaButton: {
    backgroundColor: '#f3e3e8',
    borderWidth: 1,
    borderColor: '#d9b7c3',
    padding: 12,
  },

  fdaText: {
    color: '#8b1e3d',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  homeButton: {
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