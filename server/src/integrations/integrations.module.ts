import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { GmailController } from './controllers/gmail.controller';
import { IntegrationsService } from './integrations.service';
import { GmailService } from './services/gmail.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IntegrationsController, GmailController],
  providers: [IntegrationsService, GmailService],
  exports: [IntegrationsService, GmailService],
})
export class IntegrationsModule {}
