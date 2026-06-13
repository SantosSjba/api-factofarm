import type {
  CreateUserInput,
  UpdateUserInput,
  UserListFilters,
  UserSnapshot,
} from './user.types';
import type { PaginatedResult } from '../../../common/dto/pagination.dto';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  create(input: CreateUserInput): Promise<UserSnapshot>;
  findAll(filters?: UserListFilters): Promise<PaginatedResult<UserSnapshot>>;
  findById(id: string): Promise<UserSnapshot | null>;
  findByEmail(email: string): Promise<UserSnapshot | null>;
  update(id: string, input: UpdateUserInput): Promise<UserSnapshot>;
  syncPermissions(userId: string, permissionCodes: string[]): Promise<UserSnapshot>;
  delete(id: string): Promise<void>;
  establishmentBelongsToTenant(establishmentId: string, tenantId: string): Promise<boolean>;
}
