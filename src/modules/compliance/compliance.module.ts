import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { BillingModule } from '../billing/billing.module';
import { ComplianceController, LegalController } from './compliance.controller';
import { LegalService } from './services/legal.service';
import { LpdpService } from './services/lpdp.service';
import { PharmacistLicenseService } from './services/pharmacist-license.service';
import { RegulatedPriceService } from './services/regulated-price.service';
import { PleService } from './services/ple.service';
import { TaxWithholdingService } from './services/tax-withholding.service';
import { SunatBooksService } from './services/sunat-books.service';
import { SensitiveHealthCryptoService } from './services/sensitive-health-crypto.service';

@Module({
  imports: [CommonModule, BillingModule],
  controllers: [LegalController, ComplianceController],
  providers: [
    LegalService,
    LpdpService,
    PharmacistLicenseService,
    RegulatedPriceService,
    PleService,
    TaxWithholdingService,
    SunatBooksService,
    SensitiveHealthCryptoService,
  ],
  exports: [
    LpdpService,
    PharmacistLicenseService,
    RegulatedPriceService,
    SensitiveHealthCryptoService,
  ],
})
export class ComplianceModule {}
