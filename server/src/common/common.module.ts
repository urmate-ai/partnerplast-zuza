import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from './services/email.service';
import { TokenService } from './services/token.service';

@Global()
@Module({
  imports: [JwtModule],
  providers: [EmailService, TokenService],
  exports: [EmailService, TokenService],
})
export class CommonModule {}

