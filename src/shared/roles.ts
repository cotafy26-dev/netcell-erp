/**
 * Papéis e matriz de permissões (RBAC).
 * A API valida por `permission` (recurso:ação); o front usa para esconder UI.
 */

export const ROLES = [
  'ADMIN',
  'FINANCEIRO',
  'COMERCIAL',
  'TECNICO',
  'SUPERVISOR',
  'CLIENTE',
] as const;

export type Role = (typeof ROLES)[number];

export const RESOURCES = [
  'dashboard',
  'customers',
  'crm',
  'equipment',
  'inventory',
  'contracts',
  'service_orders',
  'rentals',
  'finance',
  'fiscal',
  'tickets',
  'calendar',
  'users',
  'reports',
  'integrations',
  'settings',
  'portal',
] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = 'read' | 'create' | 'update' | 'delete' | 'export' | 'approve';
export type Permission = `${Resource}:${Action}` | '*';

const ALL: Action[] = ['read', 'create', 'update', 'delete', 'export', 'approve'];

function grant(resources: Resource[], actions: Action[] = ALL): Permission[] {
  return resources.flatMap((r) => actions.map((a) => `${r}:${a}` as Permission));
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: ['*'],

  SUPERVISOR: [
    ...grant([
      'dashboard', 'customers', 'crm', 'equipment', 'inventory', 'contracts',
      'service_orders', 'rentals', 'tickets', 'calendar', 'reports',
    ]),
    'finance:read', 'finance:export', 'fiscal:read', 'users:read', 'settings:read',
  ],

  FINANCEIRO: [
    'dashboard:read',
    ...grant(['finance', 'fiscal']),
    'customers:read', 'contracts:read', 'rentals:read', 'service_orders:read',
    'reports:read', 'reports:export',
  ],

  COMERCIAL: [
    'dashboard:read',
    ...grant(['crm', 'customers', 'contracts']),
    'equipment:read', 'rentals:read', 'rentals:create', 'rentals:update',
    'reports:read', 'calendar:read', 'calendar:create', 'calendar:update',
  ],

  TECNICO: [
    'dashboard:read',
    ...grant(['service_orders', 'tickets']),
    'equipment:read', 'equipment:update', 'inventory:read', 'inventory:update',
    'customers:read', 'calendar:read', 'calendar:create', 'calendar:update',
  ],

  CLIENTE: [
    'portal:read', 'portal:create', 'portal:update',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  if (perms.includes('*')) return true;
  if (perms.includes(permission)) return true;
  const [resource] = permission.split(':');
  return perms.includes(`${resource}:*` as Permission);
}
