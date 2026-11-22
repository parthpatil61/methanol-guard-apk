import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../lib/supabase';
import type { TestRecord } from '../lib/storage';

type FilterType =
  | 'all'
  | 'high'
  | 'suspicious'
  | 'safe';

type InvestigationStatus =
  | 'Not started'
  | 'Under investigation'
  | 'Closed';

type LabStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Not confirmed';

type AuthorityTest = TestRecord & {
  investigationStatus: InvestigationStatus;
  labStatus: LabStatus;
  officerRemarks: string;
  investigationDate: string | null;
};

export default function AuthorityDashboardScreen() {
  const router = useRouter();

  const [tests, setTests] =
    useState<AuthorityTest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [searchText, setSearchText] =
    useState('');

  const [activeFilter, setActiveFilter] =
    useState<FilterType>('all');

  const [sortHighRiskFirst, setSortHighRiskFirst] =
    useState(true);

  const [sortNewestFirst, setSortNewestFirst] =
    useState(true);

  function isInvestigationStatus(
    value: unknown,
  ): value is InvestigationStatus {
    return (
      value === 'Not started' ||
      value === 'Under investigation' ||
      value === 'Closed'
    );
  }

  function isLabStatus(
    value: unknown,
  ): value is LabStatus {
    return (
      value === 'Pending' ||
      value === 'Confirmed' ||
      value === 'Not confirmed'
    );
  }

  const loadCloudTests = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        console.error(
          'Could not load cloud authority records:',
          error,
        );

        Alert.alert(
          'Cloud records error',
          'Could not load records from the cloud.',
        );

        return;
      }

      const records: AuthorityTest[] = (
        data ?? []
      ).map((item) => ({
        id: String(item.id),

        createdAt:
          item.created_at,

        inspectorId:
          item.inspector_id ?? '',

        brand:
          item.brand ?? '',

        batchId:
          item.batch_id ?? '',

        locationLabel:
          item.location_label ?? '',

        notes:
          item.notes ?? '',

        lat:
          item.latitude ?? null,

        lng:
          item.longitude ?? null,

        imageUri:
          item.image_url ?? '',

        result: {
          riskScore: Number(
            item.risk_score ?? 0,
          ),

          band:
            item.band === 'high'
              ? 'high'
              : item.band ===
                  'suspicious'
                ? 'suspicious'
                : 'safe',

          estimatedMgL: Number(
            item.estimated_mg_l ?? 0,
          ),

          interpretation:
            item.interpretation ?? '',

          metrics: {
            r: Number(
              item.red ?? 0,
            ),

            g: Number(
              item.green ?? 0,
            ),

            b: Number(
              item.blue ?? 0,
            ),

            h: Number(
              item.hue ?? 0,
            ),

            s: Number(
              item.saturation ?? 0,
            ),

            v: Number(
              item.value ?? 0,
            ),

            purpleIndex: Number(
              item.purple_index ?? 0,
            ),

            yellowIndex: Number(
              item.yellow_index ?? 0,
            ),

            luminance: Number(
              item.luminance ?? 0,
            ),

            contrast: Number(
              item.contrast ?? 0,
            ),
          },

          quality: {
            lighting:
              item.lighting === 'dark'
                ? 'dark'
                : item.lighting === 'bright'
                  ? 'bright'
                  : 'ok',

            contrast:
              item.contrast_quality === 'low'
                ? 'low'
                : 'ok',

            purpleSignal:
              item.purple_signal ===
              'strong'
                ? 'strong'
                : item.purple_signal ===
                    'weak'
                  ? 'weak'
                  : 'ok',

            yellowSignal:
              item.yellow_signal === 'strong'
                ? 'strong'
                : item.yellow_signal === 'weak'
                  ? 'weak'
                  : 'ok',

            retakeSuggested:
              Boolean(
                item.retake_suggested,
              ),

            messages:
              Array.isArray(
                item.quality_messages,
              )
                ? item.quality_messages
                : [],
          },
        },

        investigationStatus:
          isInvestigationStatus(
            item.investigation_status,
          )
            ? item.investigation_status
            : 'Not started',

        labStatus:
          isLabStatus(
            item.lab_confirmation_status,
          )
            ? item.lab_confirmation_status
            : 'Pending',

        officerRemarks:
          item.officer_remarks ?? '',

        investigationDate:
          item.investigation_date ?? null,
      }));

      setTests(records);
    } catch (error) {
      console.error(
        'Could not load cloud tests:',
        error,
      );

      Alert.alert(
        'Error',
        'Could not connect to the cloud database.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCloudTests();
    }, [loadCloudTests]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadCloudTests();
  }

  const totalTests =
    tests.length;

  const highRisk =
    tests.filter(
      (test) =>
        test.result.band === 'high',
    ).length;

  const underInvestigation =
    tests.filter(
      (test) =>
        test.investigationStatus ===
        'Under investigation',
    ).length;

  const closedCases =
    tests.filter(
      (test) =>
        test.investigationStatus ===
        'Closed',
    ).length;

  const pendingLab =
    tests.filter(
      (test) =>
        test.labStatus ===
        'Pending',
    ).length;

  const confirmedLab =
    tests.filter(
      (test) =>
        test.labStatus ===
        'Confirmed',
    ).length;

  const highRiskOpen =
    tests.filter(
      (test) =>
        test.result.band === 'high' &&
        test.investigationStatus !==
          'Closed',
    ).length;

  const normalizedSearch =
    searchText
      .trim()
      .toLowerCase();

  const filteredTests = useMemo(() => {
    const filtered =
      tests.filter((test) => {
        const matchesFilter =
          activeFilter === 'all' ||
          test.result.band ===
            activeFilter;

        if (!matchesFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const searchableText = [
          test.id,
          test.inspectorId,
          test.brand,
          test.batchId,
          test.locationLabel,
          test.notes,
          test.investigationStatus,
          test.labStatus,
          test.officerRemarks,
        ]
          .join(' ')
          .toLowerCase();

        return searchableText.includes(
          normalizedSearch,
        );
      });

    return [...filtered].sort(
      (a, b) => {
        if (sortHighRiskFirst) {
          const priority = (
            test: AuthorityTest,
          ) => {
            if (
              test.result.band ===
              'high' &&
              test.investigationStatus !==
                'Closed'
            ) {
              return 0;
            }

            if (
              test.result.band ===
              'high'
            ) {
              return 1;
            }

            if (
              test.investigationStatus ===
              'Under investigation'
            ) {
              return 2;
            }

            if (
              test.result.band ===
              'suspicious'
            ) {
              return 3;
            }

            if (
              test.labStatus ===
              'Pending'
            ) {
              return 4;
            }

            if (
              test.investigationStatus ===
              'Closed'
            ) {
              return 5;
            }

            return 6;
          };

          const priorityDifference =
            priority(a) -
            priority(b);

          if (
            priorityDifference !==
            0
          ) {
            return priorityDifference;
          }
        }

        const timeA =
          new Date(
            a.createdAt,
          ).getTime();

        const timeB =
          new Date(
            b.createdAt,
          ).getTime();

        if (sortNewestFirst) {
          return timeB - timeA;
        }

        return timeA - timeB;
      },
    );
  }, [
    tests,
    activeFilter,
    normalizedSearch,
    sortHighRiskFirst,
    sortNewestFirst,
  ]);

  function formatDate(
    value: string,
  ) {
    try {
      return new Date(
        value,
      ).toLocaleString();
    } catch {
      return value;
    }
  }

  function bandLabel(
    band: TestRecord['result']['band'],
  ) {
    if (
      band === 'high'
    ) {
      return 'High risk';
    }

    if (
      band === 'suspicious'
    ) {
      return 'Suspicious';
    }

    return 'Low signal';
  }

  function bandColor(
    band: TestRecord['result']['band'],
  ) {
    if (
      band === 'high'
    ) {
      return '#8b1e3d';
    }

    if (
      band === 'suspicious'
    ) {
      return '#9a5b12';
    }

    return '#2f6b4f';
  }

  function investigationColor(
    status: InvestigationStatus,
  ) {
    if (
      status ===
      'Under investigation'
    ) {
      return '#9a5b12';
    }

    if (
      status === 'Closed'
    ) {
      return '#2f6b4f';
    }

    return '#5c564c';
  }

  function labColor(
    status: LabStatus,
  ) {
    if (
      status === 'Confirmed'
    ) {
      return '#2f6b4f';
    }

    if (
      status === 'Pending'
    ) {
      return '#9a5b12';
    }

    return '#5c564c';
  }

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
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.replace('/')
            }
          >
            <Text style={styles.back}>
              ← Customer app
            </Text>
          </Pressable>

          <Text
            style={styles.headerTitle}
          >
            Authority Portal
          </Text>

          <View
            style={{ width: 90 }}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Government Surveillance
        </Text>

        <Text style={styles.lede}>
          Central view of Methanol
          Guard screening records
          submitted by customers.
        </Text>

        {/* Cloud notice */}
        <View style={styles.notice}>
          <Text
            style={styles.noticeTitle}
          >
            CLOUD AUTHORITY PORTAL
          </Text>

          <Text
            style={styles.noticeText}
          >
            Records shown here are
            retrieved from the Methanol
            Guard cloud database.
          </Text>
        </View>

        {/* Statistics */}
        <View style={styles.stats}>
          <View
            style={styles.statBox}
          >
            <Text
              style={styles.statNumber}
            >
              {totalTests}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Total tests
            </Text>
          </View>

          <View
            style={styles.statBox}
          >
            <Text
              style={[
                styles.statNumber,
                {
                  color:
                    '#8b1e3d',
                },
              ]}
            >
              {highRisk}
            </Text>

            <Text
              style={styles.statLabel}
            >
              High-risk
            </Text>
          </View>

          <View
            style={styles.statBox}
          >
            <Text
              style={[
                styles.statNumber,
                {
                  color:
                    '#9a5b12',
                },
              ]}
            >
              {underInvestigation}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Under investigation
            </Text>
          </View>

          <View
            style={styles.statBox}
          >
            <Text
              style={[
                styles.statNumber,
                {
                  color:
                    '#2f6b4f',
                },
              ]}
            >
              {closedCases}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Closed cases
            </Text>
          </View>

          <View
            style={styles.statBox}
          >
            <Text
              style={[
                styles.statNumber,
                {
                  color:
                    '#9a5b12',
                },
              ]}
            >
              {pendingLab}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Lab pending
            </Text>
          </View>

          <View
            style={styles.statBox}
          >
            <Text
              style={[
                styles.statNumber,
                {
                  color:
                    '#2f6b4f',
                },
              ]}
            >
              {confirmedLab}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Lab confirmed
            </Text>
          </View>
        </View>

        {/* Priority warning */}
        {highRiskOpen > 0 && (
          <View
            style={styles.alertCard}
          >
            <Text
              style={styles.alertTitle}
            >
              Priority review required
            </Text>

            <Text
              style={styles.alertText}
            >
              {highRiskOpen}{' '}
              high-risk open case
              {highRiskOpen === 1
                ? ''
                : 's'} currently
              require
              {highRiskOpen === 1
                ? 's'
                : ''}{' '}
              authority review.
              Confirm through
              appropriate laboratory
              procedures.
            </Text>
          </View>
        )}

        {/* Search */}
        <View
          style={styles.searchCard}
        >
          <Text
            style={styles.searchTitle}
          >
            Search records
          </Text>

          <TextInput
            value={searchText}
            onChangeText={
              setSearchText
            }
            placeholder="Brand, batch, inspector, location, ID, case status..."
            placeholderTextColor="#8a8276"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Result filters */}
        <View
          style={styles.filterSection}
        >
          <Text
            style={styles.filterTitle}
          >
            Filter by result
          </Text>

          <View
            style={styles.filterRow}
          >
            <Pressable
              style={[
                styles.filterButton,
                activeFilter ===
                  'all' &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setActiveFilter(
                  'all',
                )
              }
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter ===
                    'all' &&
                    styles.filterTextActive,
                ]}
              >
                All
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterButton,
                activeFilter ===
                  'high' &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setActiveFilter(
                  'high',
                )
              }
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter ===
                    'high' &&
                    styles.filterTextActive,
                ]}
              >
                High-risk
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterButton,
                activeFilter ===
                  'suspicious' &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setActiveFilter(
                  'suspicious',
                )
              }
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter ===
                    'suspicious' &&
                    styles.filterTextActive,
                ]}
              >
                Suspicious
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterButton,
                activeFilter ===
                  'safe' &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setActiveFilter(
                  'safe',
                )
              }
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter ===
                    'safe' &&
                    styles.filterTextActive,
                ]}
              >
                Low signal
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Case filters */}
        <View
          style={styles.filterSection}
        >
          <Text
            style={styles.filterTitle}
          >
            Dashboard sorting
          </Text>

          <View
            style={styles.filterRow}
          >
            <Pressable
              style={[
                styles.filterButton,
                sortHighRiskFirst &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setSortHighRiskFirst(
                  (current) =>
                    !current,
                )
              }
            >
              <Text
                style={[
                  styles.filterText,
                  sortHighRiskFirst &&
                    styles.filterTextActive,
                ]}
              >
                {sortHighRiskFirst
                  ? 'Priority first'
                  : 'Priority off'}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterButton,
                sortNewestFirst &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setSortNewestFirst(
                  (current) =>
                    !current,
                )
              }
            >
              <Text
                style={[
                  styles.filterText,
                  sortNewestFirst &&
                    styles.filterTextActive,
                ]}
              >
                {sortNewestFirst
                  ? 'Newest first'
                  : 'Oldest first'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Quick status summary */}
        <View
          style={styles.statusSummary}
        >
          <Text
            style={styles.statusSummaryTitle}
          >
            Case workflow
          </Text>

          <View
            style={styles.workflowRow}
          >
            <View
              style={styles.workflowItem}
            >
              <Text
                style={[
                  styles.workflowNumber,
                  {
                    color:
                      '#9a5b12',
                  },
                ]}
              >
                {underInvestigation}
              </Text>

              <Text
                style={styles.workflowLabel}
              >
                Active
              </Text>
            </View>

            <View
              style={styles.workflowItem}
            >
              <Text
                style={[
                  styles.workflowNumber,
                  {
                    color:
                      '#9a5b12',
                  },
                ]}
              >
                {pendingLab}
              </Text>

              <Text
                style={styles.workflowLabel}
              >
                Lab pending
              </Text>
            </View>

            <View
              style={styles.workflowItem}
            >
              <Text
                style={[
                  styles.workflowNumber,
                  {
                    color:
                      '#2f6b4f',
                  },
                ]}
              >
                {confirmedLab}
              </Text>

              <Text
                style={styles.workflowLabel}
              >
                Lab confirmed
              </Text>
            </View>

            <View
              style={styles.workflowItem}
            >
              <Text
                style={[
                  styles.workflowNumber,
                  {
                    color:
                      '#2f6b4f',
                  },
                ]}
              >
                {closedCases}
              </Text>

              <Text
                style={styles.workflowLabel}
              >
                Closed
              </Text>
            </View>
          </View>
        </View>

        {/* Results header */}
        <View
          style={styles.sectionHeader}
        >
          <Text
            style={styles.sectionTitle}
          >
            Cloud tests
          </Text>

          <Text
            style={styles.resultCount}
          >
            {filteredTests.length} found
          </Text>
        </View>

        {/* Loading */}
        {loading ? (
          <View
            style={styles.emptyCard}
          >
            <ActivityIndicator
              size="small"
              color="#6e1d52"
            />

            <Text
              style={styles.emptyText}
            >
              Loading cloud records...
            </Text>
          </View>
        ) : filteredTests.length ===
          0 ? (
          <View
            style={styles.emptyCard}
          >
            <Text
              style={styles.emptyTitle}
            >
              No matching tests
            </Text>

            <Text
              style={styles.emptyText}
            >
              Try changing the search
              text or result filter.
            </Text>
          </View>
        ) : (
          filteredTests.map(
            (test) => (
              <View
                key={test.id}
                style={[
                  styles.testCard,
                  test.result.band ===
                    'high' &&
                    test.investigationStatus !==
                      'Closed' &&
                    styles.priorityCard,
                ]}
              >
                {/* Top line */}
                <View
                  style={
                    styles.testTop
                  }
                >
                  <Text
                    style={
                      styles.testId
                    }
                  >
                    {test.id}
                  </Text>

                  <Text
                    style={[
                      styles.band,
                      {
                        color:
                          bandColor(
                            test
                              .result
                              .band,
                          ),
                      },
                    ]}
                  >
                    {bandLabel(
                      test
                        .result
                        .band,
                    )}
                  </Text>
                </View>

                <Text
                  style={styles.testDate}
                >
                  {formatDate(
                    test.createdAt,
                  )}
                </Text>

                {/* Priority */}
                {test.result.band ===
                  'high' &&
                  test.investigationStatus !==
                    'Closed' && (
                    <View
                      style={
                        styles.priorityBadge
                      }
                    >
                      <Text
                        style={
                          styles.priorityBadgeText
                        }
                      >
                        PRIORITY REVIEW
                      </Text>
                    </View>
                  )}

                {/* Details */}
                <Text
                  style={styles.testDetail}
                >
                  Inspector:{' '}
                  {test.inspectorId ||
                    'Not provided'}
                </Text>

                <Text
                  style={styles.testDetail}
                >
                  Brand:{' '}
                  {test.brand ||
                    'Not provided'}
                </Text>

                <Text
                  style={styles.testDetail}
                >
                  Batch:{' '}
                  {test.batchId ||
                    'Not provided'}
                </Text>

                <Text
                  style={styles.testDetail}
                >
                  Location:{' '}
                  {test.locationLabel ||
                    'Not provided'}
                </Text>

                <Text
                  style={styles.testDetail}
                >
                  Risk score:{' '}
                  {
                    test.result
                      .riskScore
                  }
                  /100
                </Text>

                <Text
                  style={styles.testDetail}
                >
                  Screening estimate:{' '}
                  {
                    test.result
                      .estimatedMgL
                  }{' '}
                  mg/L
                </Text>

                {/* Case status */}
                <View
                  style={
                    styles.caseStatusBox
                  }
                >
                  <View
                    style={
                      styles.caseStatusRow
                    }
                  >
                    <Text
                      style={
                        styles.caseStatusLabel
                      }
                    >
                      Investigation
                    </Text>

                    <Text
                      style={[
                        styles.caseStatusValue,
                        {
                          color:
                            investigationColor(
                              test.investigationStatus,
                            ),
                        },
                      ]}
                    >
                      {
                        test.investigationStatus
                      }
                    </Text>
                  </View>

                  <View
                    style={
                      styles.caseStatusRow
                    }
                  >
                    <Text
                      style={
                        styles.caseStatusLabel
                      }
                    >
                      Laboratory
                    </Text>

                    <Text
                      style={[
                        styles.caseStatusValue,
                        {
                          color:
                            labColor(
                              test.labStatus,
                            ),
                        },
                      ]}
                    >
                      {
                        test.labStatus
                      }
                    </Text>
                  </View>
                </View>

                {/* Investigation date */}
                {test.investigationDate && (
                  <Text
                    style={
                      styles.caseDate
                    }
                  >
                    Investigation date:{' '}
                    {formatDate(
                      test.investigationDate,
                    )}
                  </Text>
                )}

                {/* Officer remarks indicator */}
                {test.officerRemarks
                  .trim()
                  .length > 0 && (
                  <View
                    style={
                      styles.remarksBadge
                    }
                  >
                    <Text
                      style={
                        styles.remarksBadgeText
                      }
                    >
                      Officer remarks
                      recorded
                    </Text>
                  </View>
                )}

                {/* Open cloud record */}
                <Pressable
                  style={
                    styles.cloudBadge
                  }
                  onPress={() =>
                    router.push(
                      `/cloud-test?id=${test.id}`,
                    )
                  }
                >
                  <Text
                    style={
                      styles.cloudBadgeText
                    }
                  >
                    ☁ Cloud record
                  </Text>
                </Pressable>
              </View>
            ),
          )
        )}

        {/* Actions */}
        <View
          style={styles.actions}
        >
          <Pressable
            style={({
              pressed,
            }) => [
              styles.primary,
              pressed &&
                styles.pressed,
            ]}
            onPress={
              handleRefresh
            }
          >
            <Text
              style={
                styles.primaryText
              }
            >
              {refreshing
                ? 'Refreshing...'
                : 'Refresh cloud records'}
            </Text>
          </Pressable>

          <Pressable
            style={({
              pressed,
            }) => [
              styles.ghost,
              pressed &&
                styles.pressed,
            ]}
            onPress={() =>
              router.push(
                '/history',
              )
            }
          >
            <Text
              style={styles.ghostText}
            >
              View local records
            </Text>
          </Pressable>

          <Pressable
            style={({
              pressed,
            }) => [
              styles.ghost,
              pressed &&
                styles.pressed,
            ]}
            onPress={() =>
              router.replace('/')
            }
          >
            <Text
              style={styles.ghostText}
            >
              Return to customer app
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
    paddingTop: 12,
    paddingBottom: 48,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  back: {
    color: '#6e1d52',
    fontSize: 14,
    fontWeight: '600',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#4a1236',
    fontSize: 18,
    fontWeight: '700',
  },

  title: {
    color: '#1c1915',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    marginBottom: 6,
  },

  lede: {
    color: '#5c564c',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },

  notice: {
    backgroundColor: '#efe4c8',
    borderWidth: 1,
    borderColor: '#d4c392',
    padding: 11,
    marginBottom: 14,
  },

  noticeTitle: {
    color: '#6e1d52',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },

  noticeText: {
    color: '#5c564c',
    fontSize: 12,
    lineHeight: 17,
  },

  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },

  statBox: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 12,
  },

  statNumber: {
    color: '#1c1915',
    fontSize: 25,
    fontWeight: '700',
  },

  statLabel: {
    color: '#5c564c',
    fontSize: 12,
    marginTop: 2,
  },

  alertCard: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#8b1e3d',
    padding: 12,
    marginBottom: 14,
  },

  alertTitle: {
    color: '#8b1e3d',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },

  alertText: {
    color: '#5c564c',
    fontSize: 13,
    lineHeight: 19,
  },

  searchCard: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 12,
    marginBottom: 10,
  },

  searchTitle: {
    color: '#4a1236',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },

  searchInput: {
    backgroundColor: '#f7f1e6',
    borderWidth: 1,
    borderColor: '#d8ceba',
    color: '#1c1915',
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  filterSection: {
    marginBottom: 14,
  },

  filterTitle: {
    color: '#4a1236',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  filterButton: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    paddingVertical: 8,
    paddingHorizontal: 11,
  },

  filterButtonActive: {
    backgroundColor: '#6e1d52',
    borderColor: '#4a1236',
  },

  filterText: {
    color: '#1c1915',
    fontSize: 12,
    fontWeight: '600',
  },

  filterTextActive: {
    color: '#fffaf1',
  },

  statusSummary: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 12,
    marginBottom: 14,
  },

  statusSummaryTitle: {
    color: '#4a1236',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },

  workflowRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  workflowItem: {
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
    paddingVertical: 5,
  },

  workflowNumber: {
    fontSize: 21,
    fontWeight: '700',
  },

  workflowLabel: {
    color: '#5c564c',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  sectionTitle: {
    color: '#4a1236',
    fontSize: 19,
    fontWeight: '700',
  },

  resultCount: {
    color: '#5c564c',
    fontSize: 12,
  },

  emptyCard: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#1c1915',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },

  emptyText: {
    color: '#5c564c',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },

  testCard: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 13,
    marginBottom: 9,
  },

  priorityCard: {
    borderColor: '#8b1e3d',
    borderWidth: 2,
  },

  testTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  testId: {
    flex: 1,
    color: '#1c1915',
    fontSize: 13,
    fontWeight: '700',
  },

  band: {
    fontSize: 13,
    fontWeight: '700',
  },

  testDate: {
    color: '#5c564c',
    fontSize: 11,
    marginTop: 3,
    marginBottom: 8,
  },

  priorityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3e2e7',
    borderWidth: 1,
    borderColor: '#8b1e3d',
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 8,
  },

  priorityBadgeText: {
    color: '#8b1e3d',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  testDetail: {
    color: '#1c1915',
    fontSize: 13,
    lineHeight: 19,
  },

  caseStatusBox: {
    backgroundColor: '#f7f1e6',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 9,
    marginTop: 9,
  },

  caseStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 3,
  },

  caseStatusLabel: {
    color: '#5c564c',
    fontSize: 11,
  },

  caseStatusValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '700',
  },

  caseDate: {
    color: '#5c564c',
    fontSize: 11,
    marginTop: 7,
  },

  remarksBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#efe4c8',
    borderWidth: 1,
    borderColor: '#d4c392',
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 7,
  },

  remarksBadgeText: {
    color: '#6e1d52',
    fontSize: 10,
    fontWeight: '600',
  },

  cloudBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#efe4c8',
    borderWidth: 1,
    borderColor: '#d4c392',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 9,
  },

  cloudBadgeText: {
    color: '#6e1d52',
    fontSize: 11,
    fontWeight: '600',
  },

  actions: {
    marginTop: 8,
    gap: 8,
  },

  primary: {
    backgroundColor: '#6e1d52',
    borderWidth: 1,
    borderColor: '#4a1236',
    paddingVertical: 12,
    alignItems: 'center',
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
  },

  ghostText: {
    color: '#1c1915',
    fontSize: 14,
  },

  pressed: {
    opacity: 0.65,
  },
});