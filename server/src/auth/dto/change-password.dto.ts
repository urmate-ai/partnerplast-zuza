import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Aktualne hasło jest wymagane' })
  @IsString({ message: 'Aktualne hasło musi być tekstem' })
  currentPassword: string;

  @IsNotEmpty({ message: 'Nowe hasło jest wymagane' })
  @IsString({ message: 'Nowe hasło musi być tekstem' })
  @MinLength(6, { message: 'Nowe hasło musi mieć minimum 6 znaków' })
  @MaxLength(100, { message: 'Nowe hasło może mieć maksimum 100 znaków' })
  newPassword: string;
}
