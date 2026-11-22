import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { encode } from 'base64-arraybuffer';

import { supabase } from '../lib/supabase';

type InvestigationStatus =
  | 'Not started'
  | 'Under investigation'
  | 'Closed';

type LabStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Not confirmed';

type CloudTest = {
  id: string;
  created_at: string;

  inspector_id: string | null;
  brand: string | null;
  batch_id: string | null;
  location_label: string | null;
  notes: string | null;

  latitude: number | null;
  longitude: number | null;

  image_url: string | null;

  risk_score: number | null;
  band: string | null;
  estimated_mg_l: number | null;
  interpretation: string | null;

  red: number | null;
  green: number | null;
  blue: number | null;

  hue: number | null;
  saturation: number | null;
  value: number | null;

  purple_index: number | null;
  yellow_index: number | null;
  luminance: number | null;
  contrast: number | null;

  lighting: string | null;
  contrast_quality: string | null;
  purple_signal: string | null;
  yellow_signal: string | null;
  retake_suggested: boolean | null;

  quality_messages: string[] | null;

  investigation_status: string | null;
  lab_confirmation_status: string | null;
  officer_remarks: string | null;
  investigation_date: string | null;
};

export default function CloudTestScreen() {
  const router = useRouter();

  const params = useLocalSearchParams();

  const id = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [test, setTest] =
    useState<CloudTest | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingReport, setGeneratingReport] =
    useState(false);

  const [investigationStatus, setInvestigationStatus] =
    useState<InvestigationStatus>('Not started');

  const [labStatus, setLabStatus] =
    useState<LabStatus>('Pending');

  const [officerRemarks, setOfficerRemarks] =
    useState('');

  const [investigationDate, setInvestigationDate] =
    useState('');

  useEffect(() => {
    async function loadCloudTest() {
      if (!id) {
        Alert.alert(
          'Record error',
          'No cloud test ID was provided.',
        );

        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tests')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error(
            'Could not load cloud test:',
            error,
          );

          Alert.alert(
            'Record error',
            'Could not retrieve this cloud record.',
          );

          return;
        }

        setTest(data);

        setInvestigationStatus(
          isInvestigationStatus(
            data.investigation_status,
          )
            ? data.investigation_status
            : 'Not started',
        );

        setLabStatus(
          isLabStatus(
            data.lab_confirmation_status,
          )
            ? data.lab_confirmation_status
            : 'Pending',
        );

        setOfficerRemarks(
          data.officer_remarks ?? '',
        );

        setInvestigationDate(
          data.investigation_date ?? '',
        );
      } catch (error) {
        console.error(
          'Cloud record error:',
          error,
        );

        Alert.alert(
          'Record error',
          'Something went wrong while loading the record.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadCloudTest();
  }, [id]);

  function isInvestigationStatus(
    value: string | null,
  ): value is InvestigationStatus {
    return (
      value === 'Not started' ||
      value === 'Under investigation' ||
      value === 'Closed'
    );
  }

  function isLabStatus(
    value: string | null,
  ): value is LabStatus {
    return (
      value === 'Pending' ||
      value === 'Confirmed' ||
      value === 'Not confirmed'
    );
  }

  function formatDate(date: string | null) {
    if (!date) {
      return 'Not provided';
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleString();
  }

  function formatNumber(
    value: number | null,
    decimals = 2,
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return 'Not available';
    }

    return value.toFixed(decimals);
  }

  function getBandLabel(
    band: string | null,
  ) {
    if (!band) {
      return 'Unknown';
    }

    if (band === 'high') {
      return 'Strong demo signal';
    }

    if (band === 'suspicious') {
      return 'Moderate demo signal';
    }

    return 'Weak demo signal';
  }

  function getBandColor(
    band: string | null,
  ) {
    if (band === 'high') {
      return '#8b1e3d';
    }

    if (band === 'suspicious') {
      return '#9a5b12';
    }

    return '#2f6b4f';
  }

  function setTodayAsInvestigationDate() {
    setInvestigationDate(
      new Date().toISOString(),
    );
  }

  async function saveAuthorityUpdate() {
    if (!test?.id) {
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('tests')
        .update({
          investigation_status:
            investigationStatus,

          lab_confirmation_status:
            labStatus,

          officer_remarks:
            officerRemarks.trim() || null,

          investigation_date:
            investigationDate || null,
        })
        .eq('id', test.id);

      if (error) {
        console.error(
          'Could not save authority update:',
          error,
        );

        Alert.alert(
          'Save failed',
          'The authority update could not be saved.',
        );

        return;
      }

      setTest((current) =>
        current
          ? {
              ...current,
              investigation_status:
                investigationStatus,
              lab_confirmation_status:
                labStatus,
              officer_remarks:
                officerRemarks.trim() || null,
              investigation_date:
                investigationDate || null,
            }
          : current,
      );

      Alert.alert(
        'Saved',
        'Authority case update saved successfully.',
      );
    } catch (error) {
      console.error(
        'Authority update error:',
        error,
      );

      Alert.alert(
        'Save failed',
        'Something went wrong while saving the case update.',
      );
    } finally {
      setSaving(false);
    }
  }

  function escapeHtml(value: unknown) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function getImageBase64(
    imageUrl: string,
  ): Promise<string | null> {
    try {
      console.log(
        'Fetching cloud image for PDF:',
        imageUrl,
      );

      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(
          `Image request failed: ${response.status} ${response.statusText}`,
        );
      }

      const arrayBuffer =
        await response.arrayBuffer();

      if (
        !arrayBuffer ||
        arrayBuffer.byteLength === 0
      ) {
        throw new Error(
          'Downloaded image is empty.',
        );
      }

      const base64 =
        encode(arrayBuffer);

      if (!base64) {
        throw new Error(
          'Base64 conversion failed.',
        );
      }

      console.log(
        'Cloud image converted to Base64 successfully.',
      );

      return base64;
    } catch (error) {
      console.error(
        'Could not fetch cloud image for PDF:',
        error,
      );

      return null;
    }
  }

  async function generateCaseReport() {
    if (!test) {
      return;
    }

    try {
      setGeneratingReport(true);

      let imageHtml = `
        <div class="no-photo">
          No strip photograph available.
        </div>
      `;

      if (test.image_url) {
        const base64Image =
          await getImageBase64(
            test.image_url,
          );

        if (base64Image) {
          imageHtml = `
            <div class="image-wrap">
              <img
                src="data:image/jpeg;base64,${base64Image}"
                class="strip-image"
              />
            </div>
          `;
        } else {
          imageHtml = `
            <div class="no-photo">
              Strip photograph could not be embedded
              in this report.
            </div>
          `;
        }
      }

      const qualityMessages =
        test.quality_messages &&
        test.quality_messages.length > 0
          ? test.quality_messages
              .map(
                (message) =>
                  `<li>${escapeHtml(
                    message,
                  )}</li>`,
              )
              .join('')
          : '<li>No quality warnings recorded.</li>';

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />

          <style>
            @page {
              size: A4;
              margin: 28px;
            }

            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #1c1915;
              background: #ffffff;
              font-size: 11px;
              line-height: 1.45;
            }

            .header {
              border-bottom: 2px solid #6e1d52;
              padding-bottom: 14px;
              margin-bottom: 18px;
            }

            .kicker {
              color: #6e1d52;
              font-size: 10px;
              font-weight: bold;
              letter-spacing: 2px;
              text-transform: uppercase;
            }

            h1 {
              font-size: 24px;
              margin: 5px 0 4px;
              color: #1c1915;
            }

            .case-id {
              color: #5c564c;
              font-size: 10px;
            }

            .section {
              margin-top: 18px;
              page-break-inside: avoid;
            }

            .section-title {
              color: #4a1236;
              font-size: 15px;
              font-weight: bold;
              margin-bottom: 8px;
              border-bottom: 1px solid #d8ceba;
              padding-bottom: 5px;
            }

            .status-box {
              border: 1px solid #d8ceba;
              padding: 14px;
              margin-bottom: 16px;
              page-break-inside: avoid;
            }

            .status-label {
              color: #5c564c;
              font-size: 10px;
            }

            .status-value {
              font-size: 20px;
              font-weight: bold;
              margin-top: 3px;
              color: ${escapeHtml(
                getBandColor(test.band),
              )};
            }

            .score {
              margin-top: 6px;
              font-size: 11px;
            }

            .estimate {
              margin-top: 3px;
              color: #5c564c;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            td {
              border-bottom: 1px solid #eee5d7;
              padding: 7px 5px;
              vertical-align: top;
            }

            td.label {
              width: 35%;
              color: #5c564c;
              font-weight: bold;
            }

            .image-wrap {
              border: 1px solid #d8ceba;
              padding: 8px;
              margin-top: 8px;
              text-align: center;
              page-break-inside: avoid;
            }

            .strip-image {
              width: 100%;
              max-height: 360px;
              object-fit: contain;
            }

            .no-photo {
              border: 1px solid #d8ceba;
              padding: 35px;
              text-align: center;
              color: #5c564c;
              margin-top: 8px;
            }

            .remarks {
              border: 1px solid #d8ceba;
              padding: 10px;
              min-height: 55px;
              white-space: pre-wrap;
            }

            .authority-box {
              border: 2px solid #6e1d52;
              padding: 12px;
              page-break-inside: avoid;
            }

            .authority-title {
              color: #6e1d52;
              font-size: 11px;
              font-weight: bold;
              letter-spacing: 1px;
              text-transform: uppercase;
              margin-bottom: 8px;
            }

            ul {
              padding-left: 18px;
              margin-top: 6px;
            }

            .disclaimer {
              margin-top: 24px;
              padding: 12px;
              background: #efe4c8;
              border: 1px solid #d4c392;
              page-break-inside: avoid;
            }

            .footer {
              margin-top: 20px;
              border-top: 1px solid #d8ceba;
              padding-top: 8px;
              color: #5c564c;
              font-size: 9px;
            }
          </style>
        </head>

        <body>

          <div class="header">
            <div class="kicker">
              AUTHORITY CASE REPORT
            </div>

            <h1>Methanol Guard</h1>

            <div class="case-id">
              Case ID:
              ${escapeHtml(test.id)}
            </div>
          </div>

          <div class="status-box">
            <div class="status-label">
              SCREENING RESULT
            </div>

            <div class="status-value">
              ${escapeHtml(
                getBandLabel(test.band),
              )}
            </div>

            <div class="score">
              Demo signal score:
              ${escapeHtml(
                test.risk_score ?? 0,
              )}/100
            </div>

            <div class="estimate">
              Methanol concentration:
              ${escapeHtml(
                'Not calibrated',
              )}
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              Test Information
            </div>

            <table>
              <tr>
                <td class="label">
                  Test date / time
                </td>
                <td>
                  ${escapeHtml(
                    formatDate(test.created_at),
                  )}
                </td>
              </tr>

              <tr>
                <td class="label">
                  Inspector
                </td>
                <td>
                  ${escapeHtml(
                    test.inspector_id ||
                      'Not provided',
                  )}
                </td>
              </tr>

              <tr>
                <td class="label">
                  Brand / source
                </td>
                <td>
                  ${escapeHtml(
                    test.brand ||
                      'Not provided',
                  )}
                </td>
              </tr>

              <tr>
                <td class="label">
                  Batch / bottle ID
                </td>
                <td>
                  ${escapeHtml(
                    test.batch_id ||
                      'Not provided',
                  )}
                </td>
              </tr>

              <tr>
                <td class="label">
                  Location
                </td>
                <td>
                  ${escapeHtml(
                    test.location_label ||
                      'Not provided',
                  )}
                </td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">
              GPS Location
            </div>

            <table>
              <tr>
                <td class="label">
                  Latitude
                </td>

                <td>
                  ${
                    test.latitude !== null
                      ? escapeHtml(
                          test.latitude,
                        )
                      : 'Not recorded'
                  }
                </td>
              </tr>

              <tr>
                <td class="label">
                  Longitude
                </td>

                <td>
                  ${
                    test.longitude !== null
                      ? escapeHtml(
                          test.longitude,
                        )
                      : 'Not recorded'
                  }
                </td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">
              Strip Photograph
            </div>

            ${imageHtml}
          </div>

          <div class="section">
            <div class="section-title">
              Interpretation
            </div>

            <div>
              ${escapeHtml(
                test.interpretation ||
                  'No interpretation recorded.',
              )}
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              Color Analysis
            </div>

            <table>
              <tr>
                <td class="label">
                  RGB
                </td>

                <td>
                  ${escapeHtml(
                    `${formatNumber(
                      test.red,
                    )}, ${formatNumber(
                      test.green,
                    )}, ${formatNumber(
                      test.blue,
                    )}`,
                  )}
                </td>
              </tr>

              <tr>
                <td class="label">
                  HSV
                </td>

                <td>
                  ${escapeHtml(
                    `${formatNumber(
                      test.hue,
                    )}, ${formatNumber(
                      test.saturation,
                    )}, ${formatNumber(
                      test.value,
                    )}`,
                  )}
                </td>
              </tr>

              <tr>
                <td class="label">
                  Yellow index (demo)
                </td>

                <td>
                  ${escapeHtml(
                    formatNumber(
                      test.yellow_index,
                    ),
                  )}
                </td>
              </tr>

              <tr>
                <td class="label">
                  Luminance
                </td>

                <td>
                  ${escapeHtml(
                    formatNumber(
                      test.luminance,
                    ),
                  )}
                </td>
              </tr>

              <tr>
                <td class="label">
                  Contrast
                </td>

                <td>
                  ${escapeHtml(
                    formatNumber(
                      test.contrast,
                    ),
                  )}
                </td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">
              Quality Assessment
            </div>

            <table>
              <tr>
                <td class="label">
                  Lighting
                </td>

                <td>
                  ${escapeHtml(
                    test.lighting ||
                      'Not available',
                  )}
                </td>
              </tr>

              <tr>
                <td class="label">
                  Contrast
                </td>

                <td>
                  ${escapeHtml(
                    test.contrast_quality ||
                      'Not available',
                  )}
                </td>
              </tr>

              <tr>
                <td class="label">
                  Yellow signal
                </td>

                <td>
                  ${escapeHtml(
                    test.yellow_signal ||
                      'Not available',
                  )}
                </td>
              </tr>

              <tr>
                <td class="label">
                  Retake suggested
                </td>

                <td>
                  ${
                    test.retake_suggested
                      ? 'Yes'
                      : 'No'
                  }
                </td>
              </tr>
            </table>

            <ul>
              ${qualityMessages}
            </ul>
          </div>

          <div class="section">
            <div class="section-title">
              Field Notes
            </div>

            <div>
              ${escapeHtml(
                test.notes ||
                  'No notes recorded.',
              )}
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              Authority Case Management
            </div>

            <div class="authority-box">
              <div class="authority-title">
                Authority Only
              </div>

              <table>
                <tr>
                  <td class="label">
                    Investigation status
                  </td>

                  <td>
                    ${escapeHtml(
                      investigationStatus,
                    )}
                  </td>
                </tr>

                <tr>
                  <td class="label">
                    Laboratory confirmation
                  </td>

                  <td>
                    ${escapeHtml(
                      labStatus,
                    )}
                  </td>
                </tr>

                <tr>
                  <td class="label">
                    Investigation date
                  </td>

                  <td>
                    ${escapeHtml(
                      investigationDate
                        ? formatDate(
                            investigationDate,
                          )
                        : 'Not provided',
                    )}
                  </td>
                </tr>
              </table>

              <div style="margin-top:10px;">
                <strong>
                  Officer remarks
                </strong>
              </div>

              <div class="remarks">
                ${escapeHtml(
                  officerRemarks.trim() ||
                    'No officer remarks recorded.',
                )}
              </div>
            </div>
          </div>

          <div class="disclaimer">
            <strong>
              Preliminary screening disclaimer
            </strong>

            <div style="margin-top:5px;">
              This report documents a preliminary
              screening result from the Methanol Guard
              field screening system. The screening
              result should not be treated as definitive
              laboratory confirmation. Suspected
              contamination should be evaluated using
              appropriate laboratory testing and
              applicable authority procedures.
            </div>
          </div>

          <div class="footer">
            Generated by Methanol Guard Authority Portal.
          </div>

        </body>
        </html>
      `;

      console.log(
        'Generating authority case PDF...',
      );

      const { uri } =
        await Print.printToFileAsync({
          html,
        });

      console.log(
        'PDF generated:',
        uri,
      );

      const canShare =
        await Sharing.isAvailableAsync();

      if (!canShare) {
        Alert.alert(
          'Report created',
          'The PDF report was generated successfully, but sharing is not available on this device.',
        );

        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle:
          'Share Methanol Guard Case Report',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.error(
        'Case report generation error:',
        error,
      );

      Alert.alert(
        'Report failed',
        'Could not generate the authority case report.',
      );
    } finally {
      setGeneratingReport(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color="#6e1d52"
          />

          <Text style={styles.loadingText}>
            Loading cloud record...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!test) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.shell}>
          <Text style={styles.title}>
            Cloud record unavailable
          </Text>

          <Pressable
            style={styles.primary}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryText}>
              Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.shell}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.kicker}>
            AUTHORITY PORTAL
          </Text>

          <Text style={styles.title}>
            Cloud Test Record
          </Text>

          <Text style={styles.recordId}>
            ID: {test.id}
          </Text>
        </View>

        {/* Screening status */}
        <View
          style={[
            styles.statusCard,
            test.band === 'high' &&
              styles.highRiskCard,
          ]}
        >
          <Text style={styles.statusLabel}>
            Screening result
          </Text>

          <Text
            style={[
              styles.statusValue,
              {
                color: getBandColor(
                  test.band,
                ),
              },
            ]}
          >
            {getBandLabel(test.band)}
          </Text>

          <Text style={styles.score}>
            Demo signal score: {test.risk_score ?? 0}/100
          </Text>

          <Text style={styles.estimate}>
            Methanol concentration: Not calibrated
          </Text>

          {test.band === 'high' && (
            <View style={styles.highRiskNotice}>
              <Text
                style={styles.highRiskNoticeTitle}
              >
                HIGH-RISK CASE
              </Text>

              <Text
                style={styles.highRiskNoticeText}
              >
                This screening record requires
                authority review and laboratory
                confirmation.
              </Text>
            </View>
          )}
        </View>

        {/* Basic information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Test information
          </Text>

          <InfoRow
            label="Date / time"
            value={formatDate(
              test.created_at,
            )}
          />

          <InfoRow
            label="Inspector"
            value={
              test.inspector_id ||
              'Not provided'
            }
          />

          <InfoRow
            label="Brand / source"
            value={
              test.brand ||
              'Not provided'
            }
          />

          <InfoRow
            label="Batch / bottle ID"
            value={
              test.batch_id ||
              'Not provided'
            }
          />

          <InfoRow
            label="Location"
            value={
              test.location_label ||
              'Not provided'
            }
          />
        </View>

        {/* GPS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            GPS location
          </Text>

          <InfoRow
            label="Latitude"
            value={
              test.latitude !== null
                ? String(test.latitude)
                : 'Not recorded'
            }
          />

          <InfoRow
            label="Longitude"
            value={
              test.longitude !== null
                ? String(test.longitude)
                : 'Not recorded'
            }
          />
        </View>

        {/* Strip image */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Strip photograph
          </Text>

          {test.image_url ? (
            <Image
              source={{
                uri: test.image_url,
              }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.noImage}>
              <Text
                style={styles.noImageText}
              >
                No photograph available
              </Text>
            </View>
          )}

          <Text style={styles.imageNote}>
            Photograph stored with the cloud
            test record.
          </Text>
        </View>

        {/* Interpretation */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Interpretation
          </Text>

          <Text style={styles.bodyText}>
            {test.interpretation ||
              'No interpretation recorded.'}
          </Text>
        </View>

        {/* Color metrics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Color analysis
          </Text>

          <InfoRow
            label="RGB"
            value={`${formatNumber(
              test.red,
            )}, ${formatNumber(
              test.green,
            )}, ${formatNumber(test.blue)}`}
          />

          <InfoRow
            label="HSV"
            value={`${formatNumber(
              test.hue,
            )}, ${formatNumber(
              test.saturation,
            )}, ${formatNumber(test.value)}`}
          />

          <InfoRow
            label="Yellow index (demo)"
            value={formatNumber(
              test.yellow_index,
            )}
          />

          <InfoRow
            label="Luminance"
            value={formatNumber(
              test.luminance,
            )}
          />

          <InfoRow
            label="Contrast"
            value={formatNumber(
              test.contrast,
            )}
          />
        </View>

        {/* Quality */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Quality assessment
          </Text>

          <InfoRow
            label="Lighting"
            value={
              test.lighting ||
              'Not available'
            }
          />

          <InfoRow
            label="Contrast"
            value={
              test.contrast_quality ||
              'Not available'
            }
          />

          <InfoRow
            label="Yellow signal"
            value={
              test.yellow_signal ||
              'Not available'
            }
          />

          <InfoRow
            label="Retake suggested"
            value={
              test.retake_suggested
                ? 'Yes'
                : 'No'
            }
          />

          {test.quality_messages &&
            test.quality_messages.length >
              0 && (
              <View style={styles.messages}>
                {test.quality_messages.map(
                  (message, index) => (
                    <Text
                      key={`${message}-${index}`}
                      style={styles.message}
                    >
                      • {message}
                    </Text>
                  ),
                )}
              </View>
            )}
        </View>

        {/* Field notes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Field notes
          </Text>

          <Text style={styles.bodyText}>
            {test.notes ||
              'No notes recorded.'}
          </Text>
        </View>

        {/* Authority-only case management */}
        <View style={styles.authorityCard}>
          <View style={styles.authorityHeader}>
            <Text style={styles.authorityKicker}>
              AUTHORITY ONLY
            </Text>

            <Text style={styles.authorityTitle}>
              Case Management
            </Text>

            <Text
              style={styles.authoritySubtitle}
            >
              Internal investigation information.
              Customers cannot access these fields.
            </Text>
          </View>

          {/* Investigation status */}
          <Text style={styles.fieldLabel}>
            Investigation status
          </Text>

          <View style={styles.optionRow}>
            <OptionButton
              label="Not started"
              selected={
                investigationStatus ===
                'Not started'
              }
              onPress={() =>
                setInvestigationStatus(
                  'Not started',
                )
              }
            />

            <OptionButton
              label="Under investigation"
              selected={
                investigationStatus ===
                'Under investigation'
              }
              onPress={() =>
                setInvestigationStatus(
                  'Under investigation',
                )
              }
            />

            <OptionButton
              label="Closed"
              selected={
                investigationStatus ===
                'Closed'
              }
              onPress={() =>
                setInvestigationStatus(
                  'Closed',
                )
              }
            />
          </View>

          {/* Lab status */}
          <Text
            style={[
              styles.fieldLabel,
              { marginTop: 16 },
            ]}
          >
            Laboratory confirmation
          </Text>

          <View style={styles.optionRow}>
            <OptionButton
              label="Pending"
              selected={
                labStatus === 'Pending'
              }
              onPress={() =>
                setLabStatus('Pending')
              }
            />

            <OptionButton
              label="Confirmed"
              selected={
                labStatus === 'Confirmed'
              }
              onPress={() =>
                setLabStatus('Confirmed')
              }
            />

            <OptionButton
              label="Not confirmed"
              selected={
                labStatus === 'Not confirmed'
              }
              onPress={() =>
                setLabStatus(
                  'Not confirmed',
                )
              }
            />
          </View>

          {/* Investigation date */}
          <Text
            style={[
              styles.fieldLabel,
              { marginTop: 16 },
            ]}
          >
            Investigation date
          </Text>

          <View style={styles.dateRow}>
            <TextInput
              value={investigationDate}
              onChangeText={
                setInvestigationDate
              }
              placeholder="ISO date/time"
              placeholderTextColor="#8a8276"
              style={[
                styles.textInput,
                styles.dateInput,
              ]}
              autoCapitalize="none"
            />

            <Pressable
              style={styles.todayButton}
              onPress={
                setTodayAsInvestigationDate
              }
            >
              <Text
                style={styles.todayButtonText}
              >
                Today
              </Text>
            </Pressable>
          </View>

          {/* Officer remarks */}
          <Text
            style={[
              styles.fieldLabel,
              { marginTop: 16 },
            ]}
          >
            Officer remarks
          </Text>

          <TextInput
            value={officerRemarks}
            onChangeText={setOfficerRemarks}
            placeholder="Add internal authority remarks..."
            placeholderTextColor="#8a8276"
            style={[
              styles.textInput,
              styles.remarksInput,
            ]}
            multiline
            textAlignVertical="top"
          />

          {/* Save */}
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.pressed,
            ]}
            onPress={saveAuthorityUpdate}
            disabled={
              saving || generatingReport
            }
          >
            <Text style={styles.saveButtonText}>
              {saving
                ? 'Saving case update...'
                : 'Save authority update'}
            </Text>
          </Pressable>

          {/* Generate PDF */}
          <Pressable
            style={({ pressed }) => [
              styles.reportButton,
              pressed && styles.pressed,
            ]}
            onPress={generateCaseReport}
            disabled={
              saving || generatingReport
            }
          >
            <Text
              style={styles.reportButtonText}
            >
              {generatingReport
                ? 'Generating case report...'
                : 'Generate Case Report'}
            </Text>
          </Pressable>

          {test.investigation_date && (
            <Text style={styles.lastUpdated}>
              Last investigation date:{' '}
              {formatDate(
                test.investigation_date,
              )}
            </Text>
          )}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Screening record only. This result is a
            preliminary screening signal and should
            not be treated as definitive laboratory
            confirmation.
          </Text>
        </View>

        {/* Back */}
        <Pressable
          style={styles.primary}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryText}>
            Back to cloud records
          </Text>
        </Pressable>
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

function OptionButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.optionButton,
        selected &&
          styles.optionButtonSelected,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionText,
          selected &&
            styles.optionTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
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

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  loadingText: {
    color: '#5c564c',
    fontSize: 15,
  },

  header: {
    marginBottom: 16,
  },

  kicker: {
    color: '#6e1d52',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },

  title: {
    color: '#1c1915',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },

  recordId: {
    color: '#5c564c',
    fontSize: 13,
    marginTop: 5,
  },

  statusCard: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 16,
    marginBottom: 12,
  },

  highRiskCard: {
    borderColor: '#8b1e3d',
  },

  statusLabel: {
    color: '#5c564c',
    fontSize: 13,
  },

  statusValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },

  score: {
    color: '#1c1915',
    fontSize: 15,
    marginTop: 8,
  },

  estimate: {
    color: '#5c564c',
    fontSize: 14,
    marginTop: 3,
  },

  highRiskNotice: {
    backgroundColor: '#f3e2e7',
    borderWidth: 1,
    borderColor: '#8b1e3d',
    padding: 10,
    marginTop: 12,
  },

  highRiskNoticeTitle: {
    color: '#8b1e3d',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },

  highRiskNoticeText: {
    color: '#5c564c',
    fontSize: 12,
    lineHeight: 17,
  },

  card: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 14,
    marginBottom: 12,
  },

  cardTitle: {
    color: '#4a1236',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },

  infoRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee5d7',
  },

  infoLabel: {
    color: '#5c564c',
    fontSize: 12,
    marginBottom: 2,
  },

  infoValue: {
    color: '#1c1915',
    fontSize: 15,
  },

  bodyText: {
    color: '#1c1915',
    fontSize: 15,
    lineHeight: 22,
  },

  image: {
    width: '100%',
    height: 280,
    backgroundColor: '#eee7dc',
  },

  noImage: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eee7dc',
  },

  noImageText: {
    color: '#5c564c',
    fontSize: 14,
  },

  imageNote: {
    color: '#5c564c',
    fontSize: 11,
    marginTop: 8,
  },

  messages: {
    marginTop: 10,
    gap: 5,
  },

  message: {
    color: '#5c564c',
    fontSize: 13,
    lineHeight: 19,
  },

  authorityCard: {
    backgroundColor: '#fffaf1',
    borderWidth: 2,
    borderColor: '#6e1d52',
    padding: 14,
    marginBottom: 12,
  },

  authorityHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#d8ceba',
    paddingBottom: 12,
    marginBottom: 12,
  },

  authorityKicker: {
    color: '#6e1d52',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  authorityTitle: {
    color: '#1c1915',
    fontSize: 21,
    fontWeight: '700',
    marginTop: 3,
  },

  authoritySubtitle: {
    color: '#5c564c',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  fieldLabel: {
    color: '#4a1236',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },

  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  optionButton: {
    backgroundColor: '#f7f1e6',
    borderWidth: 1,
    borderColor: '#d8ceba',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  optionButtonSelected: {
    backgroundColor: '#6e1d52',
    borderColor: '#4a1236',
  },

  optionText: {
    color: '#1c1915',
    fontSize: 12,
    fontWeight: '600',
  },

  optionTextSelected: {
    color: '#fffaf1',
  },

  dateRow: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
  },

  dateInput: {
    flex: 1,
  },

  textInput: {
    backgroundColor: '#f7f1e6',
    borderWidth: 1,
    borderColor: '#d8ceba',
    color: '#1c1915',
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  remarksInput: {
    minHeight: 110,
  },

  todayButton: {
    backgroundColor: '#efe4c8',
    borderWidth: 1,
    borderColor: '#d4c392',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },

  todayButtonText: {
    color: '#6e1d52',
    fontSize: 12,
    fontWeight: '700',
  },

  saveButton: {
    backgroundColor: '#6e1d52',
    borderWidth: 1,
    borderColor: '#4a1236',
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },

  saveButtonText: {
    color: '#fffaf1',
    fontSize: 15,
    fontWeight: '700',
  },

  reportButton: {
    backgroundColor: '#efe4c8',
    borderWidth: 1,
    borderColor: '#9a7b2f',
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 9,
  },

  reportButtonText: {
    color: '#4a1236',
    fontSize: 15,
    fontWeight: '700',
  },

  lastUpdated: {
    color: '#5c564c',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },

  disclaimer: {
    backgroundColor: '#efe4c8',
    borderWidth: 1,
    borderColor: '#d4c392',
    padding: 12,
    marginBottom: 12,
  },

  disclaimerText: {
    color: '#1c1915',
    fontSize: 12,
    lineHeight: 18,
  },

  primary: {
    backgroundColor: '#6e1d52',
    borderWidth: 1,
    borderColor: '#4a1236',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },

  primaryText: {
    color: '#fffaf1',
    fontSize: 16,
    fontWeight: '600',
  },

  pressed: {
    opacity: 0.65,
  },
});