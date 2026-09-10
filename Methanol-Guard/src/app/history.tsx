import { useFocusEffect, useRouter } from 'expo-router';
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

import {
    deleteTest,
    loadTests,
    type TestRecord,
} from '../lib/storage';

export default function HistoryScreen() {
  const router = useRouter();
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const records = await loadTests();
    setTests(records);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  function confirmDelete(test: TestRecord) {
    Alert.alert(
      'Delete test?',
      'This saved test will be removed from this device.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTest(test.id);
            refresh();
          },
        },
      ]
    );
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

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
            <Text style={styles.brand}>Methanol Guard</Text>
          </View>

          <View style={{ width: 55 }} />
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Screening records are stored locally on this device.
            Screening results require laboratory confirmation.
          </Text>
        </View>

        <View style={styles.stack}>
          <Text style={styles.title}>Test history</Text>

          <Text style={styles.lede}>
            Saved field screening records from this device.
          </Text>

          {loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                Loading tests…
              </Text>
            </View>
          ) : tests.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                No saved tests
              </Text>

              <Text style={styles.emptyText}>
                Completed tests will appear here after you save them
                locally.
              </Text>

              <Pressable
                style={styles.primary}
                onPress={() => router.push('/guide')}
              >
                <Text style={styles.primaryText}>
                  Start new screen
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.countCard}>
                <Text style={styles.countNumber}>
                  {tests.length}
                </Text>

                <Text style={styles.countText}>
                  saved test{tests.length === 1 ? '' : 's'}
                </Text>
              </View>

              {tests.map((test) => {
                const highRisk = test.result.band === 'high';
                const suspicious =
                  test.result.band === 'suspicious';

                return (
                  <View
                    key={test.id}
                    style={[
                      styles.testCard,
                      highRisk
                        ? styles.highCard
                        : suspicious
                          ? styles.suspiciousCard
                          : styles.safeCard,
                    ]}
                  >
                    {/* Image */}
                    {test.imageUri ? (
                      <Image
                        source={{ uri: test.imageUri }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.thumbnailEmpty}>
                        <Text style={styles.thumbnailText}>
                          No image
                        </Text>
                      </View>
                    )}

                    {/* Info */}
                    <View style={styles.testInfo}>
                      <View style={styles.testHeader}>
                        <Text style={styles.testDate}>
                          {formatDate(test.createdAt)}
                        </Text>

                        <View
                          style={[
                            styles.badge,
                            highRisk
                              ? styles.highBadge
                              : suspicious
                                ? styles.suspiciousBadge
                                : styles.safeBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              highRisk
                                ? styles.highText
                                : suspicious
                                  ? styles.suspiciousText
                                  : styles.safeText,
                            ]}
                          >
                            {highRisk
                              ? 'High risk'
                              : suspicious
                                ? 'Suspicious'
                                : 'Low signal'}
                          </Text>
                        </View>
                      </View>

                      {test.brand ? (
                        <Text style={styles.brandInfo}>
                          {test.brand}
                        </Text>
                      ) : null}

                      {test.batchId ? (
                        <Text style={styles.detail}>
                          Batch: {test.batchId}
                        </Text>
                      ) : null}

                      {test.locationLabel ? (
                        <Text style={styles.detail}>
                          Place: {test.locationLabel}
                        </Text>
                      ) : null}

                      <Text style={styles.scoreText}>
                        Risk score: {test.result.riskScore}/100
                      </Text>

                      <View style={styles.actions}>
                        <Pressable
                          style={styles.openButton}
                          onPress={() =>
                            router.push({
                              pathname: '/saved-test',
                              params: {
                                id: test.id,
                              },
                            })
                          }
                        >
                          <Text style={styles.openText}>
                            Open record
                          </Text>
                        </Pressable>

                        <Pressable
                          style={styles.deleteButton}
                          onPress={() => confirmDelete(test)}
                        >
                          <Text style={styles.deleteText}>
                            Delete
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}

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

  countCard: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 12,
  },

  countNumber: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1c1915',
  },

  countText: {
    fontSize: 13,
    color: '#5c564c',
  },

  empty: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 18,
    gap: 9,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1c1915',
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5c564c',
  },

  testCard: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    borderLeftWidth: 4,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
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

  thumbnail: {
    width: 86,
    height: 86,
    backgroundColor: '#eee5d6',
  },

  thumbnailEmpty: {
    width: 86,
    height: 86,
    backgroundColor: '#eee5d6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  thumbnailText: {
    color: '#5c564c',
    fontSize: 11,
  },

  testInfo: {
    flex: 1,
    gap: 3,
  },

  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },

  testDate: {
    flex: 1,
    color: '#5c564c',
    fontSize: 11,
  },

  badge: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
  },

  safeBadge: {
    backgroundColor: '#e7efe9',
    borderColor: '#b9cdbf',
  },

  suspiciousBadge: {
    backgroundColor: '#f5ead8',
    borderColor: '#dfc49c',
  },

  highBadge: {
    backgroundColor: '#f3e3e8',
    borderColor: '#d9b7c3',
  },

  badgeText: {
    fontSize: 10,
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

  brandInfo: {
    color: '#1c1915',
    fontSize: 15,
    fontWeight: '700',
  },

  detail: {
    color: '#5c564c',
    fontSize: 12,
  },

  scoreText: {
    color: '#1c1915',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  actions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 5,
  },

  openButton: {
    backgroundColor: '#6e1d52',
    paddingVertical: 7,
    paddingHorizontal: 9,
  },

  openText: {
    color: '#fffaf1',
    fontSize: 11,
    fontWeight: '600',
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: '#d8ceba',
    paddingVertical: 7,
    paddingHorizontal: 9,
  },

  deleteText: {
    color: '#8b1e3d',
    fontSize: 11,
    fontWeight: '600',
  },

  primary: {
    backgroundColor: '#6e1d52',
    borderWidth: 1,
    borderColor: '#4a1236',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 5,
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
});