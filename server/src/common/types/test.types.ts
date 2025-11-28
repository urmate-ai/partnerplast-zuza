import type { User, Chat, Message, Integration } from '@prisma/client';
import type { AudioFile } from '../../ai/types/ai.types';

export type MockUser = Partial<User>;
export type MockChat = Partial<Chat>;
export type MockMessage = Partial<Message>;
export type MockIntegration = Partial<Integration>;
export type MockAudioFile = Partial<AudioFile>;

export type PrismaUpdateResult = {
  id: string;
  [key: string]: unknown;
};
