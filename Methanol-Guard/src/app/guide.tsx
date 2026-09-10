import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GuideScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.shell}
      >
        {/* Header */}
        <View style={styles.top}>
          <Pressable onPress={() => router.replace('/')}>
            <View style={styles.brand}>
              <View style={styles.mark} />
              <Text style={styles.brandText}>Methanol Guard</Text>
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

        {/* Content */}
        <View style={styles.stack}>
          <Text style={styles.title}>How to run the strip</Text>

          <Text style={styles.lede}>
            Follow the same steps each time so the color reading is
            consistent and useful for preliminary field screening.
          </Text>

          {/* Step 1 */}
          <View style={styles.card}>
            <Text style={styles.stepNumber}>1</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                Collect a small sample
              </Text>
              <Text style={styles.cardText}>
                Use under 50 µL. Do not taste or ingest the drink during
                testing.
              </Text>
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.card}>
            <Text style={styles.stepNumber}>2</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                Apply to sensing zone
              </Text>
              <Text style={styles.cardText}>
                Methanol can be oxidized to formaldehyde, which can react
                with chromotropic acid to form a violet-colored signal.
              </Text>
            </View>
          </View>

          {/* Step 3 */}
          <View style={styles.card}>
            <Text style={styles.stepNumber}>3</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                Wait the kit time
              </Text>
              <Text style={styles.cardText}>
                Typical paper assays develop in a few minutes. Do not
                read a wet or dripping pad.
              </Text>
            </View>
          </View>

          {/* Step 4 */}
          <View style={styles.card}>
            <Text style={styles.stepNumber}>4</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                Photograph the strip
              </Text>
              <Text style={styles.cardText}>
                Keep the phone parallel to the strip. Avoid shadows,
                colored ambient light, and glare.
              </Text>
            </View>
          </View>

          {/* Step 5 */}
          <View style={styles.card}>
            <Text style={styles.stepNumber}>5</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                Interpret the signal
              </Text>
              <Text style={styles.cardText}>
                No purple indicates a low signal. Purple or violet is a
                suspicious signal. Any concerning result should be
                confirmed by laboratory analysis.
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.ghost,
                pressed && styles.pressed,
              ]}
              onPress={() => router.replace('/')}
            >
              <Text style={styles.ghostText}>Back</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.primary,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/sample')}
            >
              <Text style={styles.primaryText}>
                Enter sample details
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

  card: {
    flexDirection: 'row',
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 13,
    gap: 12,
  },

  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6e1d52',
    color: '#fffaf1',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 15,
    fontWeight: '700',
    overflow: 'hidden',
    paddingTop: 4,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1915',
    marginBottom: 3,
  },

  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5c564c',
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
    borderRadius: 2,
    paddingVertical: 12,
    alignItems: 'center',
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
    borderRadius: 2,
    paddingVertical: 12,
    alignItems: 'center',
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