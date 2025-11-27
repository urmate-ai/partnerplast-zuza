import { IsString, MinLength, MaxLength, IsOptional, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Imię musi być tekstem' })
  @MinLength(2, { message: 'Imię musi mieć minimum 2 znaki' })
  @MaxLength(100, { message: 'Imię może mieć maksimum 100 znaków' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Nieprawidłowy format email' })
  email?: string;
}

