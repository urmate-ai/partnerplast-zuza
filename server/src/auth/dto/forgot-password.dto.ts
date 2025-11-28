import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'Email jest wymagany' })
  @IsEmail({}, { message: 'Nieprawidłowy format email' })
  email: string;
}
