import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

import { supabase } from './supabase';

export interface TestRecord {
  id: string;
  createdAt: string;

  inspectorId: string;
  brand: string;
  batchId: string;
  locationLabel: string;
  notes: string;

  lat: number | null;
  lng: number | null;

  imageUri: string;

  result: {
    riskScore: number;
    band: 'safe' | 'suspicious' | 'high';
    estimatedMgL: number;
    interpretation: string;

    metrics: {
      r: number;
      g: number;
      b: number;
      h: number;
      s: number;
      v: number;
      purpleIndex: number;
      luminance: number;
      contrast: number;
    };

    quality: {
      lighting: 'ok' | 'dark' | 'bright';
      contrast: 'ok' | 'low';
      purpleSignal: 'ok' | 'weak' | 'strong';
      retakeSuggested: boolean;
      messages: string[];
    };
  };
}

const STORAGE_KEY = '@methanol_guard_tests';
const IMAGE_BUCKET = 'test-images';

export async function loadTests(): Promise<TestRecord[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error('Could not load tests:', error);
    return [];
  }
}

/**
 * Upload the camera photo to Supabase Storage.
 *
 * Returns a public URL when successful.
 */
async function uploadTestImage(
  imageUri: string,
  testId: string,
): Promise<string | null> {
  try {
    if (!imageUri) {
      console.log('No image URI provided.');
      return null;
    }

    console.log('Reading test image...');

    const base64 = await FileSystem.readAsStringAsync(
      imageUri,
      {
        encoding: FileSystem.EncodingType.Base64,
      },
    );

    if (!base64) {
      console.error('Could not read image data.');
      return null;
    }

    const filePath = `tests/${testId}.jpg`;

    console.log(
      'Uploading image to Supabase Storage...',
      filePath,
    );

    const { error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(
        filePath,
        decode(base64),
        {
          contentType: 'image/jpeg',
          upsert: true,
        },
      );

    if (error) {
      console.error(
        'Image upload failed:',
        error,
      );

      return null;
    }

    /*
     * The bucket is currently public, so this URL
     * can be displayed directly by the authority app.
     */
    const {
      data: publicUrlData,
    } = supabase.storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(filePath);

    const publicUrl =
      publicUrlData.publicUrl;

    console.log(
      'Test image uploaded successfully!',
    );

    return publicUrl;
  } catch (error) {
    console.error(
      'Could not upload test image:',
      error,
    );

    return null;
  }
}

export async function saveTest(
  test: TestRecord,
): Promise<void> {
  /*
   * STEP 1
   * Save locally first.
   *
   * The existing app therefore continues
   * working even if cloud upload fails.
   */
  const tests = await loadTests();

  tests.unshift(test);

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(tests),
  );

  /*
   * STEP 2
   * Upload the actual strip photograph.
   */
  try {
    const cloudImageUrl =
      await uploadTestImage(
        test.imageUri,
        test.id,
      );

    /*
     * STEP 3
     * Upload the test record.
     *
     * If the image upload worked, store the
     * Supabase Storage URL instead of the
     * local device URI.
     */
    const { error } = await supabase
      .from('tests')
      .insert({
        id: test.id,
        created_at: test.createdAt,

        inspector_id: test.inspectorId,
        brand: test.brand,
        batch_id: test.batchId,
        location_label: test.locationLabel,
        notes: test.notes,

        latitude: test.lat,
        longitude: test.lng,

        image_url:
          cloudImageUrl ?? null,

        risk_score: test.result.riskScore,
        band: test.result.band,
        estimated_mg_l:
          test.result.estimatedMgL,
        interpretation:
          test.result.interpretation,

        red: test.result.metrics.r,
        green: test.result.metrics.g,
        blue: test.result.metrics.b,

        hue: test.result.metrics.h,
        saturation: test.result.metrics.s,
        value: test.result.metrics.v,

        purple_index:
          test.result.metrics.purpleIndex,
        luminance:
          test.result.metrics.luminance,
        contrast:
          test.result.metrics.contrast,

        lighting:
          test.result.quality.lighting,
        contrast_quality:
          test.result.quality.contrast,
        purple_signal:
          test.result.quality.purpleSignal,
        retake_suggested:
          test.result.quality.retakeSuggested,

        quality_messages:
          test.result.quality.messages,
      });

    if (error) {
      console.error(
        'Cloud upload failed:',
        error,
      );
    } else {
      console.log(
        'Test uploaded to Supabase successfully!',
      );

      if (cloudImageUrl) {
        console.log(
          'Cloud image URL:',
          cloudImageUrl,
        );
      }
    }
  } catch (error) {
    /*
     * Cloud failure must NOT prevent the
     * local test from being saved.
     */
    console.error(
      'Could not upload test to Supabase:',
      error,
    );
  }
}

export async function deleteTest(
  id: string,
): Promise<void> {
  const tests = await loadTests();

  const updated = tests.filter(
    (test) => test.id !== id,
  );

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated),
  );

  /*
   * Also remove the cloud database record.
   */
  try {
    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(
        'Could not delete cloud test:',
        error,
      );
    }
  } catch (error) {
    console.error(
      'Cloud delete failed:',
      error,
    );
  }

  /*
   * Remove the corresponding cloud image.
   */
  try {
    const filePath = `tests/${id}.jpg`;

    const { error } =
      await supabase.storage
        .from(IMAGE_BUCKET)
        .remove([filePath]);

    if (error) {
      console.error(
        'Could not delete cloud image:',
        error,
      );
    }
  } catch (error) {
    console.error(
      'Cloud image delete failed:',
      error,
    );
  }
}

export async function clearTests(): Promise<void> {
  await AsyncStorage.removeItem(
    STORAGE_KEY,
  );
}