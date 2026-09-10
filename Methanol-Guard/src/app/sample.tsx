import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SampleScreen() {
  const router = useRouter();

  const [inspectorId, setInspectorId] = useState('');
  const [brand, setBrand] = useState('');
  const [batchId, setBatchId] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [notes, setNotes] = useState('');

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [recordingGps, setRecordingGps] = useState(false);

  async function recordGPS() {
    try {
      setRecordingGps(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Location permission',
          'Location permission is required to record GPS for this test.'
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLat(position.coords.latitude);
      setLng(position.coords.longitude);

      Alert.alert(
        'GPS recorded',
        `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
      );
    } catch {
      Alert.alert(
        'GPS error',
        'Could not record the current location.'
      );
    } finally {
      setRecordingGps(false);
    }
  }

  function continueToCamera() {
    router.push({
      pathname: '/camera',
      params: {
        inspectorId,
        brand,
        batchId,
        locationLabel,
        notes,
        lat: lat !== null ? String(lat) : '',
        lng: lng !== null ? String(lng) : '',
      },
    });
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
            <View style={styles.brandRow}>
              <View style={styles.mark} />
              <Text style={styles.brand}>Methanol Guard</Text>
            </View>
          </Pressable>

          <Text style={styles.tag}>Field screening companion</Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Screening tool only — purple color is a preliminary
            chromotropic-acid style signal. Confirm with a laboratory.
            Not medical or legal advice.
          </Text>
        </View>

        <View style={styles.stack}>
          <Text style={styles.title}>Enter sample details</Text>

          <Text style={styles.lede}>
            Record the sample information before photographing the
            reaction strip.
          </Text>

          {/* Inspector */}
          <View style={styles.field}>
            <Text style={styles.label}>Inspector ID</Text>
            <TextInput
              value={inspectorId}
              onChangeText={setInspectorId}
              placeholder="Enter inspector ID"
              placeholderTextColor="#8b8274"
              style={styles.input}
            />
          </View>

          {/* Brand */}
          <View style={styles.field}>
            <Text style={styles.label}>Brand / source</Text>
            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder="Brand or source"
              placeholderTextColor="#8b8274"
              style={styles.input}
            />
          </View>

          {/* Batch */}
          <View style={styles.field}>
            <Text style={styles.label}>Batch / bottle ID</Text>
            <TextInput
              value={batchId}
              onChangeText={setBatchId}
              placeholder="Batch or bottle number"
              placeholderTextColor="#8b8274"
              style={styles.input}
            />
          </View>

          {/* Place */}
          <View style={styles.field}>
            <Text style={styles.label}>Place name</Text>
            <TextInput
              value={locationLabel}
              onChangeText={setLocationLabel}
              placeholder="Location / establishment"
              placeholderTextColor="#8b8274"
              style={styles.input}
            />
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes"
              placeholderTextColor="#8b8274"
              style={[styles.input, styles.notesInput]}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* GPS */}
          <View style={styles.gpsCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.gpsTitle}>GPS location</Text>

              <Text style={styles.gpsText}>
                {lat !== null && lng !== null
                  ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                  : 'No location recorded'}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.ghostSmall,
                pressed && styles.pressed,
              ]}
              onPress={recordGPS}
              disabled={recordingGps}
            >
              <Text style={styles.ghostSmallText}>
                {recordingGps ? 'Recording…' : 'Record GPS'}
              </Text>
            </Pressable>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.ghost,
                pressed && styles.pressed,
              ]}
              onPress={() => router.back()}
            >
              <Text style={styles.ghostText}>Back</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.primary,
                pressed && styles.pressed,
              ]}
              onPress={continueToCamera}
            >
              <Text style={styles.primaryText}>
                Photograph strip
              </Text>
            </Pressable>
          </View>
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
    marginBottom: 12,
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
  },

  lede: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5c564c',
  },

  field: {
    gap: 6,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1915',
  },

  input: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: '#1c1915',
  },

  notesInput: {
    minHeight: 90,
  },

  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 12,
    gap: 10,
  },

  gpsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1915',
  },

  gpsText: {
    fontSize: 13,
    color: '#5c564c',
    marginTop: 3,
  },

  ghostSmall: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 2,
  },

  ghostSmallText: {
    color: '#1c1915',
    fontSize: 13,
    fontWeight: '600',
  },

  buttons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
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

  primary: {
    flex: 1,
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

  pressed: {
    opacity: 0.65,
  },
});