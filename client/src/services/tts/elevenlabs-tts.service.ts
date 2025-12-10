import * as Crypto from 'expo-crypto';
import { writeAsStringAsync, cacheDirectory, EncodingType } from 'expo-file-system/legacy';

const ELEVENLABS_API_KEY = process.env.sk_[REDACTED];
const ELEVENLABS_VOICE_ID = process.env.[REDACTED];
const ELEVENLABS_MODEL_ID = 'eleven_turbo_v2_5';

function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  if (typeof btoa !== 'undefined') {
    return btoa(binary);
  }
  throw new Error('btoa is not available in this environment');
}

export async function synthesizeToAudio(
  text: string,
): Promise<{ uri: string } | null> {
  if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
    console.warn('[TTS] Missing ElevenLabs configuration, skipping TTS call.');
    return null;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    console.debug('[TTS] Empty text passed to ElevenLabs TTS');
    return null;
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`;

  const body = JSON.stringify({
    text: trimmed,
    model_id: ELEVENLABS_MODEL_ID,
    apply_text_normalization: 'on',
    voice_settings: {
      stability: 0.4,
      similarity_boost: 0.8,
      style: 0.4,
      use_speaker_boost: true,
    },
  });

  console.debug(`[TTS] Calling ElevenLabs TTS for ${trimmed.length} chars`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(
        `[TTS] ElevenLabs TTS failed with status ${response.status}: ${errorText}`,
      );
      throw new Error('Failed to synthesize speech with ElevenLabs.');
    }

    const contentType = response.headers.get('content-type') || '';
    console.debug(
      `[TTS] ElevenLabs response: status=${response.status}, content-type=${contentType}`,
    );

    if (!contentType.includes('audio')) {
      const errorText = await response.text().catch(() => '');
      console.error(
        `[TTS] ElevenLabs returned non-audio content-type: ${contentType}, body: ${errorText.substring(0, 500)}`,
      );
      throw new Error(
        'ElevenLabs did not return audio - check API key and voice ID.',
      );
    }

    const fileHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      trimmed,
    );
    const fileName = `tts_${fileHash.substring(0, 16)}.mp3`;
    
    if (!cacheDirectory) {
      throw new Error('Cache directory is not available');
    }
    const audioUri = `${cacheDirectory}${fileName}`;
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const base64 = uint8ArrayToBase64(uint8Array);
    
    await writeAsStringAsync(audioUri, base64, {
      encoding: EncodingType.Base64,
    });

    console.debug(`[TTS] ElevenLabs TTS successful: saved to ${audioUri}`);

    return { uri: audioUri };
  } catch (error) {
    console.error('[TTS] Failed to synthesize speech:', error);
    throw error;
  }
}
    
