import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { ColdChainController } from './cold-chain.controller';
import { ColdChainService } from './cold-chain.service';

@Module({
  imports: [CommonModule],
  controllers: [ColdChainController],
  providers: [ColdChainService],
})
export class ColdChainModule {}
