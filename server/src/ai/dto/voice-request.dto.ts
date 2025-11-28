import { IsOptional, IsString, MaxLength } from 'class-validator';

export class VoiceRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  context?: string;
}
