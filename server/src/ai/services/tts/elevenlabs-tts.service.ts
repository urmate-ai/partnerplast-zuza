import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ElevenLabsTtsService {
  private readonly logger = new Logger(ElevenLabsTtsService.name);

  private readonly apiKey: string | undefined;
  private readonly voiceId: string | undefined;
  private readonly modelId = 'eleven_turbo_v2_5';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ELEVENLABS_API_KEY');
    this.voiceId =
      this.configService.get<string>('ELEVENLABS_VOICE_ID_ALICE') ?? undefined;

    if (!this.apiKey) {
      this.logger.warn(
        'ELEVENLABS_API_KEY is not set – ElevenLabs TTS will not work.',
      );
    }

    if (!this.voiceId) {
      this.logger.warn(
        'ELEVENLABS_VOICE_ID_ALICE is not set – using ElevenLabs TTS requires a configured voice id.',
      );
    }
  }

  async synthesizeToBuffer(text: string): Promise<Buffer> {
    if (!this.apiKey || !this.voiceId) {
      this.logger.warn('Missing ElevenLabs configuration, skipping TTS call.');
      return Buffer.alloc(0);
    }

    const trimmed = text.trim();
    if (!trimmed) {
      this.logger.debug(
        'Empty text passed to ElevenLabs TTS, returning empty buffer.',
      );
      return Buffer.alloc(0);
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream`;

    const body = JSON.stringify({
      text: trimmed,
      model_id: this.modelId,
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.8,
        style: 0.4,
        use_speaker_boost: true,
      },
    });

    this.logger.debug(`Calling ElevenLabs TTS for ${trimmed.length} chars`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      this.logger.error(
        `ElevenLabs TTS failed with status ${response.status}: ${errorText}`,
      );
      throw new Error('Failed to synthesize speech with ElevenLabs.');
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
