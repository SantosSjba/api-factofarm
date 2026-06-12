import { Inject, Injectable } from '@nestjs/common';
import { PERMISSIONS_REPOSITORY } from '../domain/permissions.repository';
import type { IPermissionsRepository } from '../domain/permissions.repository';

const MENU_ROOT_CODE = 'nav.usuarios_series';

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(PERMISSIONS_REPOSITORY) private readonly permissions: IPermissionsRepository,
  ) {}

  menuTree() {
    return this.permissions.findMenuTreeRoot(MENU_ROOT_CODE);
  }
}
