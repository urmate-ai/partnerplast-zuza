import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Imię jest wymagane' })
  @IsString({ message: 'Imię musi być tekstem' })
  @MinLength(2, { message: 'Imię musi mieć minimum 2 znaki' })
  @MaxLength(100, { message: 'Imię może mieć maksimum 100 znaków' })
  name: string;

  @IsNotEmpty({ message: 'Email jest wymagany' })
  @IsEmail({}, { message: 'Nieprawidłowy format email' })
  email: string;

  @IsNotEmpty({ message: 'Hasło jest wymagane' })
  @IsString({ message: 'Hasło musi być tekstem' })
  @MinLength(6, { message: 'Hasło musi mieć minimum 6 znaków' })
  @MaxLength(100, { message: 'Hasło może mieć maksimum 100 znaków' })
  password: string;
}

export class LoginDto {
  @IsNotEmpty({ message: 'Email jest wymagany' })
  @IsEmail({}, { message: 'Nieprawidłowy format email' })
  email: string;

  @IsNotEmpty({ message: 'Hasło jest wymagane' })
  @IsString({ message: 'Hasło musi być tekstem' })
  password: string;
}
