import type { CreateUserInput, UpdateUserInput, UserSnapshot } from './user.types';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  create(input: CreateUserInput): Promise<UserSnapshot>;
  findAll(): Promise<UserSnapshot[]>;
  findById(id: string): Promise<UserSnapshot | null>;
  findByEmail(email: string): Promise<UserSnapshot | null>;
  update(id: string, input: UpdateUserInput): Promise<UserSnapshot>;
  delete(id: string): Promise<void>;
}
