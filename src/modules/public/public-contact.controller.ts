import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { ComplaintRequestDto } from './dto/complaint-request.dto';
import { ContactRequestDto } from './dto/contact-request.dto';
import { PublicComplaintsService } from './public-complaints.service';
import { PublicContactService } from './public-contact.service';

@ApiTags('public')
@Controller('public')
export class PublicContactController {
  constructor(
    private readonly contact: PublicContactService,
    private readonly complaints: PublicComplaintsService,
  ) {}

  @Public()
  @Post('contact')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Solicitud de contacto desde la landing (habilitar cuenta)' })
  submit(@Body() dto: ContactRequestDto) {
    return this.contact.submitLead(dto);
  }

  @Public()
  @Post('libro-reclamaciones')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Registro en libro de reclamaciones virtual (Ley 29571)' })
  submitComplaint(@Body() dto: ComplaintRequestDto) {
    return this.complaints.submit(dto);
  }
}
