import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { GmailController } from './controllers/gmail.controller';
import { CalendarController } from './controllers/calendar.controller';
import { IntegrationsService } from './integrations.service';
import { GmailService } from './services/gmail/gmail.service';
import { CalendarService } from './services/calendar/calendar.service';
import { GoogleOAuthService } from './services/oauth/google-oauth.service';
import { GoogleIntegrationService } from './services/google/google-integration.service';
import { TokenEncryptionService } from './services/oauth/token-encryption.service';
import { OAuthStateService } from './services/oauth/oauth-state.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IntegrationsController, GmailController, CalendarController],
  providers: [
    IntegrationsService,
    GmailService,
    CalendarService,
    GoogleOAuthService,
    GoogleIntegrationService,
    TokenEncryptionService,
    OAuthStateService,
  ],
  exports: [
    IntegrationsService,
    GmailService,
    CalendarService,
    GoogleOAuthService,
    GoogleIntegrationService,
  ],
})
export class IntegrationsModule {}
