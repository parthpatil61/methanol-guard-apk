import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewTestScreen() {
    const router = useRouter();

const [sampleId, setSampleId] = useState('');
const [sampleType, setSampleType] = useState('');
const [description, setDescription] = useState('');
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>New Test</Text>

        <Text style={styles.subtitle}>
          Enter the sample details before scanning the test strip.
        </Text>

        <View style={styles.card}>

          <Text style={styles.label}>Sample ID</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. MG-001"
            placeholderTextColor="#8A9AA0"
          />

          <Text style={styles.label}>Sample Type</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Alcoholic beverage"
            placeholderTextColor="#8A9AA0"
            value={sampleType}
            onChangeText={setSampleType}
          />

          <Text style={styles.label}>Sample Description</Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Optional description"
            placeholderTextColor="#8A9AA0"
            multiline
            value={description}
            onChangeText={setDescription}
          />

        </View>

        <Pressable
          style={styles.button}
          onPress={() => router.push('/camera')}
        >
          <Text style={styles.buttonText}>Continue to Scan →</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  back: {
    fontSize: 16,
    color: '#167D8D',
    fontWeight: '600',
    marginBottom: 25,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#123B4A',
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#687A82',
    marginTop: 8,
    marginBottom: 25,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#123B4A',
    marginBottom: 8,
    marginTop: 10,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D6E0E3',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#123B4A',
    backgroundColor: '#FAFCFC',
  },

  textArea: {
    height: 100,
    paddingTop: 15,
    textAlignVertical: 'top',
  },

  button: {
    height: 56,
    backgroundColor: '#167D8D',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});