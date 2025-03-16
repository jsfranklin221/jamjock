import { supabase } from './supabase';
import { toast } from 'sonner';

/**
 * Uploads a file to Supabase storage
 */
export const uploadToStorage = async (
  bucket: string,
  path: string,
  file: Blob
): Promise<string> => {
  try {
    // Remove any existing file at the path first
    await supabase.storage
      .from(bucket)
      .remove([path]);

    // Upload new file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true // Allow overwriting existing files
      });

    if (error) throw error;
    if (!data?.path) throw new Error('Upload failed - no path returned');

    return data.path;
  } catch (error) {
    console.error('Storage upload error:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Downloads and stores a backing track
 */
export const downloadAndStoreBacking = async (
  sourceUrl: string,
  songId: string
): Promise<string> => {
  try {
    // Download the backing track
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error('Failed to download backing track');
    
    const blob = await response.blob();
    const filename = `backing/${songId}.mp3`;

    // Upload to backing_tracks bucket
    const path = await uploadToStorage('backing_tracks', filename, blob);
    return path;
  } catch (error) {
    console.error('Backing track error:', error);
    throw new Error('Failed to store backing track');
  }
};

/**
 * Uploads a voice sample recording
 */
export const uploadVoiceSample = async (
  audioBlob: Blob,
  userId?: string
): Promise<string> => {
  const timestamp = Date.now();
  const filename = `recordings/${userId || 'anonymous'}_${timestamp}.wav`;

  try {
    return await uploadToStorage('voice_samples', filename, audioBlob);
  } catch (error) {
    toast.error('Failed to upload voice sample');
    throw error;
  }
};

/**
 * Uploads a preview or full version of a generated song
 */
export const uploadGeneratedAudio = async (
  audioBlob: Blob,
  songId: string,
  isPreview: boolean = false
): Promise<string> => {
  const prefix = isPreview ? 'previews' : 'full';
  const path = `${prefix}/${songId}.wav`;

  try {
    return await uploadToStorage('voice_samples', path, audioBlob);
  } catch (error) {
    toast.error(`Failed to upload ${isPreview ? 'preview' : 'full version'}`);
    throw error;
  }
};

/**
 * Gets a signed URL for a stored file
 */
export const getSignedUrl = async (
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    if (!data?.signedUrl) throw new Error('Failed to generate signed URL');

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL error:', error);
    throw new Error('Failed to generate access URL');
  }
};

/**
 * Deletes a file from storage
 */
export const deleteFromStorage = async (
  bucket: string,
  path: string
): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  } catch (error) {
    console.error('Storage delete error:', error);
    throw new Error('Failed to delete file');
  }
};