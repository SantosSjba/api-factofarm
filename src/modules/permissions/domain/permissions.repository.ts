export const PERMISSIONS_REPOSITORY = Symbol('PERMISSIONS_REPOSITORY');

export type PermissionMenuNode = {
  id: string;
  code: string;
  label: string | null;
  children: { id: string; code: string; label: string | null }[];
};

export interface IPermissionsRepository {
  findMenuTreeRoot(rootCode: string): Promise<PermissionMenuNode | null>;
  findMenuTreeRoots(rootCodes: string[]): Promise<PermissionMenuNode[]>;
}
