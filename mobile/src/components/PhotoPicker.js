import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';
import client, { BASE_URL } from '../api/client';

export default function PhotoPicker({ currentPhoto, onPhotoSelected }) {
  const [uploading, setUploading] = useState(false);

  function getPhotoUri(path) {
    if (!path) return null;
    // If already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // Otherwise, construct URL from base
    return `${BASE_URL}/${path.replace(/^\//, '')}`;
  }

  async function pickImage() {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant photo library access to choose photos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadPhoto(result.assets[0]);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera access to take photos.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadPhoto(result.assets[0]);
    }
  }

  async function uploadPhoto(asset) {
    setUploading(true);
    try {
      const formData = new FormData();
      const uri = asset.uri;
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri,
        name: filename,
        type,
      });

      const res = await client.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const path = res.data.path || res.data.url || res.data.storagePath;
      if (path) {
        onPhotoSelected(path);
      }
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Could not upload photo.');
    } finally {
      setUploading(false);
    }
  }

  function showOptions() {
    Alert.alert('Choose Photo', 'Select a source', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const photoUri = getPhotoUri(currentPhoto);

  return (
    <View style={styles.container}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>{'\u{1F4F7}'}</Text>
          <Text style={styles.placeholderText}>No photo yet</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, uploading && styles.buttonDisabled]}
        onPress={showOptions}
        disabled={uploading}
        activeOpacity={0.8}
      >
        {uploading ? (
          <View style={styles.uploadingRow}>
            <ActivityIndicator color={colors.gold} size="small" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>
            {currentPhoto ? 'Change Photo' : 'Choose Photo'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  placeholderIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  placeholderText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  button: {
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.gold,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  uploadingText: {
    color: colors.gold,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
});
