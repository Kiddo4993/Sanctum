// ============================================================
// AudioService — Text-to-speech audio caching
//
// Caching strategy (3-tier):
//   1. Local file system (via expo-file-system) — fastest, offline
//   2. Supabase Storage bucket `verse-audio` — CDN-backed
//   3. ElevenLabs TTS API — generate fresh audio
//
// Audio files are cached forever — a verse narration never changes.
//
// Note: Uses the new expo-file-system class-based API (v15+):
//   File, Directory, Paths instead of legacy functional API.
// ============================================================

import axios from 'axios';
import { File, Directory, Paths } from 'expo-file-system';
import { supabase } from '../config/supabaseClient';
import type { CachedAudio } from '../types';

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY ?? '';
const ELEVENLABS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Default voice ID — "Rachel" (a warm, clear female voice)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

/** Local directory for audio file cache */
const AUDIO_CACHE_DIR_NAME = 'sanctum-audio';

/**
 * Get the audio cache directory, creating it if it doesn't exist.
 */
function getAudioCacheDir(): Directory {
  const dir = new Directory(Paths.cache, AUDIO_CACHE_DIR_NAME);
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

/**
 * Get audio for a verse, using the 3-tier cache:
 *   1. Local file system (fastest, offline-ready)
 *   2. Supabase Storage (fast, CDN-backed)
 *   3. ElevenLabs API (generate fresh)
 *
 * @param quoteId   The Supabase quote UUID
 * @param verseText Plain text of the verse to narrate
 * @param voiceId   Optional ElevenLabs voice ID override
 */
export async function getAudio(
  quoteId: string,
  verseText: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<CachedAudio> {
  const filename = `${quoteId}.mp3`;
  const cacheDir = getAudioCacheDir();
  const localFile = new File(cacheDir, filename);

  // ── Tier 1: Check local file system ───────────────────────
  if (localFile.exists) {
    console.log(`[AudioService] Local cache HIT for ${quoteId}`);
    return { quoteId, publicUrl: localFile.uri, localPath: localFile.uri };
  }

  // ── Tier 2: Check Supabase Storage ────────────────────────
  try {
    const { data: fileList } = await supabase.storage
      .from('verse-audio')
      .list('', { search: filename });

    if (fileList && fileList.length > 0) {
      const { data: urlData } = supabase.storage
        .from('verse-audio')
        .getPublicUrl(filename);

      if (urlData?.publicUrl) {
        console.log(`[AudioService] Supabase Storage HIT for ${quoteId}`);

        // Download to local cache for offline access (fire and forget)
        File.downloadFileAsync(urlData.publicUrl, cacheDir).catch(() => {});

        return { quoteId, publicUrl: urlData.publicUrl, localPath: localFile.uri };
      }
    }
  } catch {
    console.log(`[AudioService] Supabase Storage unavailable for ${quoteId}`);
  }

  // ── Tier 3: Generate via ElevenLabs ───────────────────────
  console.log(`[AudioService] Cache MISS — generating audio for ${quoteId}`);
  const audioUrl = await generateAndUploadAudio(quoteId, verseText, voiceId, localFile);

  return { quoteId, publicUrl: audioUrl, localPath: localFile.uri };
}

/**
 * Generate TTS audio, upload to Supabase Storage, and save locally.
 */
async function generateAndUploadAudio(
  quoteId: string,
  verseText: string,
  voiceId: string,
  localFile: File
): Promise<string> {
  if (!ELEVENLABS_API_KEY) {
    console.warn('[AudioService] No ElevenLabs API key — audio generation disabled');
    return '';
  }

  try {
    // Call ElevenLabs TTS API
    const response = await axios.post(
      `${ELEVENLABS_URL}/${voiceId}`,
      {
        text: verseText,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        responseType: 'arraybuffer',
      }
    );

    const audioBuffer = response.data as ArrayBuffer;
    const audioBytes = new Uint8Array(audioBuffer);
    const filename = `${quoteId}.mp3`;

    // Save locally using the new File API (write as Uint8Array)
    localFile.write(audioBytes);

    // Upload to Supabase Storage (fire and forget)
    // Supabase JS client accepts Blob, File, ArrayBuffer, or string
    supabase.storage
      .from('verse-audio')
      .upload(filename, audioBytes as unknown as Blob, {
        contentType: 'audio/mpeg',
        upsert: true,
      })
      .then(({ error }) => {
        if (error) console.warn('[AudioService] Failed to upload to Storage:', error.message);
        else console.log(`[AudioService] Uploaded ${filename} to Supabase Storage`);
      });

    // Return the public URL
    const { data: urlData } = supabase.storage
      .from('verse-audio')
      .getPublicUrl(filename);

    return urlData?.publicUrl ?? localFile.uri;
  } catch (error: any) {
    console.warn('[AudioService] ElevenLabs API failed:', error.message);
    return '';
  }
}

/**
 * Clear the local audio cache to free up device storage.
 */
export function clearLocalAudioCache(): void {
  try {
    const dir = new Directory(Paths.cache, AUDIO_CACHE_DIR_NAME);
    if (dir.exists) {
      dir.delete();
    }
    console.log('[AudioService] Local audio cache cleared');
  } catch (err) {
    console.warn('[AudioService] Failed to clear local cache:', err);
  }
}
