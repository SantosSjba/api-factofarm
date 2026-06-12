import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { FilesModule } from '../files/files.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { MockBillingProvider } from './providers/mock-billing.provider';
import { NubefactBillingProvider } from './providers/nubefact-billing.provider';
import { FactilizaBillingProvider } from './providers/factiliza-billing.provider';
import { BillingArtifactService } from './services/billing-artifact.service';
import { UblBuilderService } from './services/ubl-builder.service';

import { FactilizaConsultaClient } from './services/factiliza-consulta.client';

@Module({
  imports: [CommonModule, FilesModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    UblBuilderService,
    BillingArtifactService,
    MockBillingProvider,
    NubefactBillingProvider,
    FactilizaBillingProvider,
    FactilizaConsultaClient,
  ],
  exports: [BillingService],
})
export class BillingModule {}
