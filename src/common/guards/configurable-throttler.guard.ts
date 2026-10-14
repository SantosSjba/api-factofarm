import { Inject, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { PlatformSettingsService } from '../settings/platform-settings.service';

@Injectable()
export class ConfigurableThrottlerGuard extends ThrottlerGuard {
  @Inject(PlatformSettingsService)
  private readonly settings!: PlatformSettingsService;

  protected async handleRequest(props: ThrottlerRequest): Promise<boolean> {
    const targets = [props.context.getHandler(), props.context.getClass()];
    const login =
      props.context.getClass().name === 'AuthController' &&
      ['login', 'forgotPassword'].includes(props.context.getHandler().name);
    const explicitLimit = this.reflector.getAllAndOverride<number>(
      'THROTTLER:LIMIT' + props.throttler.name,
      targets,
    );
    if (login || explicitLimit === undefined) {
      const [limit, ttl] = await Promise.all([
        this.settings.get(login ? 'THROTTLE_LOGIN_LIMIT' : 'THROTTLE_LIMIT'),
        this.settings.get('THROTTLE_TTL_MS'),
      ]);
      return super.handleRequest({
        ...props,
        limit: Number(limit),
        ttl: Number(ttl),
        blockDuration: Number(ttl),
      });
    }
    return super.handleRequest(props);
  }
}
