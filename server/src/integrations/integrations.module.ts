import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { GmailController } from './controllers/gmail.controller';
import { CalendarController } from './controllers/calendar.controller';
import { IntegrationsService } from './integrations.service';
import { GmailService } from './services/gmail.service';
import { CalendarService } from './services/calendar.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    IntegrationsController,
    GmailController,
    CalendarController,
  ],
  providers: [IntegrationsService, GmailService, CalendarService],
  exports: [IntegrationsService, GmailService, CalendarService],
})
export class IntegrationsModule {}
