import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);

  // ROI position in normalized coordinates.
  // 0 = left/top, 1 = right/bottom.
  const [roiX, setRoiX] = useState(0.5);
  const [roiY, setRoiY] = useState(0.5);

  // Actual camera frame dimensions.
  const [frameWidth, setFrameWidth] = useState(0);
  const [frameHeight, setFrameHeight] = useState(0);

  if (!permission) {
    return <View style={styles.loading} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.permission}>
          <Text style={styles.title}>Camera access</Text>

          <Text style={styles.lede}>
            Methanol Guard needs camera access to photograph the
            colorimetric reaction zone.
          </Text>

          <Pressable
            style={styles.primary}
            onPress={requestPermission}
          >
            <Text style={styles.primaryText}>
              Allow camera
            </Text>
          </Pressable>

          <Pressable
            style={styles.ghost}
            onPress={() => router.back()}
          >
            <Text style={styles.ghostText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function moveROI(
    locationX: number,
    locationY: number,
  ) {
    if (frameWidth <= 0 || frameHeight <= 0) {
      return;
    }

    // Radius is 75px, so keep the center away from
    // the extreme edges of the preview.
    const marginX = 75 / frameWidth;
    const marginY = 75 / frameHeight;

    const normalizedX = Math.min(
      1 - marginX,
      Math.max(marginX, locationX / frameWidth),
    );

    const normalizedY = Math.min(
      1 - marginY,
      Math.max(marginY, locationY / frameHeight),
    );

    setRoiX(normalizedX);
    setRoiY(normalizedY);
  }

  async function capturePhoto() {
    if (!cameraRef.current || capturing) return;

    try {
      setCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
      });

      if (!photo?.uri) {
        Alert.alert(
          'Capture failed',
          'Could not capture the image.',
        );
        return;
      }

      router.push({
        pathname: '/result',
        params: {
          imageUri: photo.uri,

          // Selected ROI position.
          roiX: String(roiX),
          roiY: String(roiY),

          inspectorId: String(params.inspectorId ?? ''),
          brand: String(params.brand ?? ''),
          batchId: String(params.batchId ?? ''),
          locationLabel: String(params.locationLabel ?? ''),
          notes: String(params.notes ?? ''),
          lat: String(params.lat ?? ''),
          lng: String(params.lng ?? ''),
        },
      });
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Camera error',
        'Could not capture the strip. Please try again.',
      );
    } finally {
      setCapturing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            Capture the reaction zone
          </Text>

          <View style={{ width: 50 }} />
        </View>

        {/* Description */}
        <Text style={styles.lede}>
          Tap the photo to move the sampling circle onto the pad.
        </Text>

        {/* Camera */}
        <View
          style={styles.frame}
          onLayout={(event) => {
            setFrameWidth(event.nativeEvent.layout.width);
            setFrameHeight(event.nativeEvent.layout.height);
          }}
        >
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
          />

          {/* Dark overlay */}
          <View
            pointerEvents="none"
            style={styles.overlay}
          />

          {/* Touch area */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={(event) => {
              moveROI(
                event.nativeEvent.locationX,
                event.nativeEvent.locationY,
              );
            }}
          />

          {/* Sampling frame */}
          <View
            pointerEvents="none"
            style={styles.roiFrame}
          >
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Movable ROI circle */}
            <View
              style={[
                styles.roiCircle,
                {
                  left: roiX * frameWidth - 75,
                  top: roiY * frameHeight - 75,
                },
              ]}
            />
          </View>

          <Text
            pointerEvents="none"
            style={styles.frameHint}
          >
            Tap the reaction zone to move the circle
          </Text>
        </View>

        {/* Selected position */}
        <Text style={styles.positionText}>
          Sampling position:{' '}
          {Math.round(roiX * 100)}%,{' '}
          {Math.round(roiY * 100)}%
        </Text>

        {/* Tips */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Tips</Text>

          <Text style={styles.tipText}>
            Keep the phone parallel to the strip and use even light.
            Avoid shadows, glare and colored ambient light.
          </Text>
        </View>

        {/* Capture */}
        <Pressable
          style={({ pressed }) => [
            styles.captureButton,
            pressed && styles.pressed,
          ]}
          onPress={capturePhoto}
          disabled={capturing}
        >
          <View style={styles.captureInner} />
        </Pressable>

        <Text style={styles.captureLabel}>
          {capturing
            ? 'Capturing…'
            : 'Tap to capture'}
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f1e6',
  },

  loading: {
    flex: 1,
    backgroundColor: '#f7f1e6',
  },

  shell: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  back: {
    color: '#6e1d52',
    fontSize: 15,
    fontWeight: '600',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#4a1236',
  },

  lede: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5c564c',
    textAlign: 'center',
    marginBottom: 12,
  },

  frame: {
    flex: 1,
    minHeight: 330,
    backgroundColor: '#211d19',
    borderWidth: 1,
    borderColor: '#d8ceba',
    overflow: 'hidden',
    position: 'relative',
  },

  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  roiFrame: {
    ...StyleSheet.absoluteFill,
  },

  roiCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#fffaf1',
    backgroundColor: 'rgba(255,250,241,0.08)',
  },

  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fffaf1',
  },

  topLeft: {
    left: 25,
    top: '20%',
    borderLeftWidth: 4,
    borderTopWidth: 4,
  },

  topRight: {
    right: 25,
    top: '20%',
    borderRightWidth: 4,
    borderTopWidth: 4,
  },

  bottomLeft: {
    left: 25,
    bottom: '20%',
    borderLeftWidth: 4,
    borderBottomWidth: 4,
  },

  bottomRight: {
    right: 25,
    bottom: '20%',
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },

  frameHint: {
    position: 'absolute',
    bottom: 12,
    left: 15,
    right: 15,
    textAlign: 'center',
    color: '#fffaf1',
    fontSize: 13,
  },

  positionText: {
    textAlign: 'center',
    color: '#5c564c',
    fontSize: 12,
    marginTop: 6,
  },

  tipCard: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 10,
    marginTop: 8,
  },

  tipTitle: {
    color: '#4a1236',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },

  tipText: {
    color: '#5c564c',
    fontSize: 13,
    lineHeight: 18,
  },

  captureButton: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fffaf1',
    borderWidth: 3,
    borderColor: '#6e1d52',
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6e1d52',
  },

  captureLabel: {
    textAlign: 'center',
    color: '#5c564c',
    fontSize: 13,
    marginTop: 5,
  },

  permission: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 14,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: '#1c1915',
  },

  primary: {
    backgroundColor: '#6e1d52',
    paddingVertical: 13,
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
    paddingVertical: 13,
    alignItems: 'center',
  },

  ghostText: {
    color: '#1c1915',
    fontSize: 15,
  },

  pressed: {
    opacity: 0.65,
  },
});