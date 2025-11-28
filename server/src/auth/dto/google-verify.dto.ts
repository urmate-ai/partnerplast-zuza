import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleVerifyDto {
  @IsNotEmpty({ message: 'Access token jest wymagany' })
  @IsString({ message: 'Access token musi być tekstem' })
  accessToken: string;
}

