import { UserRole } from '../../types/index.ts';

export type RoleVerificationStatus =
  | 'idle' // Unauthenticated visitor or session logged out
  | 'verifying' // Role verification query in progress
  | 'verified' // Genuine role records verified from public.user_roles
  | 'unassigned' // Database queried successfully, but zero roles found
  | 'error' // Table missing, permission denied, or network failure
  | 'demo'; // Prototype UI exploration mode (no genuine auth)

export interface RoleResolutionResult {
  status: RoleVerificationStatus;
  roles: UserRole[];
  activeRole: UserRole | null;
  error: string | null;
}

export interface ResolveUserRolesParams {
  dbRoles?: Array<{ role: unknown }> | null;
  dbError?: { message: string; code?: string } | null;
  userMetadata?: Record<string, unknown> | null;
  isDemo?: boolean;
  demoRole?: UserRole | null;
}

export const ALLOWED_ROLES: ReadonlyArray<UserRole> = ['customer', 'vendor', 'admin'];

/**
 * Pure, authoritative role-resolution engine.
 *
 * Security Requirements:
 * 1. NEVER trust `userMetadata.role` or any client-provided metadata for authorization.
 * 2. Database errors (missing table PGRST205/42P01, permission denied 42501, network failure)
 *    MUST return status 'error' and activeRole: null. Never silently default to Customer/Vendor/Admin.
 * 3. An authenticated user with zero roles in public.user_roles MUST return status 'unassigned'
 *    and activeRole: null.
 * 4. Prototype demo sessions must be explicitly marked status 'demo' and separated from genuine auth.
 */
export function resolveUserRoles({
  dbRoles,
  dbError,
  userMetadata: _userMetadata, // Explicitly ignored for authorization
  isDemo = false,
  demoRole = null,
}: ResolveUserRolesParams): RoleResolutionResult {
  // 1. Explicit prototype demo exploration session
  if (isDemo) {
    const active = demoRole && ALLOWED_ROLES.includes(demoRole) ? demoRole : 'customer';
    return {
      status: 'demo',
      roles: [active],
      activeRole: active,
      error: null,
    };
  }

  // 2. Database query failed (e.g., public.user_roles missing, permission denied, network error)
  if (dbError) {
    const isMissingTable =
      dbError.code === 'PGRST205' ||
      dbError.code === '42P01' ||
      dbError.message?.toLowerCase().includes('could not find the table') ||
      dbError.message?.toLowerCase().includes('does not exist');

    const errorMsg = isMissingTable
      ? `Role verification failed: Table 'public.user_roles' is missing from the database schema cache. Run migration '001_initial_schema.sql' to provision roles.`
      : `Role verification failed: ${dbError.message || 'Database error occurred while querying public.user_roles.'}`;

    return {
      status: 'error',
      roles: [],
      activeRole: null,
      error: errorMsg,
    };
  }

  // 3. Database returned null or undefined without explicit error
  if (!dbRoles) {
    return {
      status: 'unassigned',
      roles: [],
      activeRole: null,
      error: 'No role records were returned from public.user_roles.',
    };
  }

  // 4. Validate and filter role records from trusted database source only
  const validRoles: UserRole[] = [];
  for (const record of dbRoles) {
    if (typeof record?.role === 'string' && (ALLOWED_ROLES as readonly string[]).includes(record.role)) {
      const typedRole = record.role as UserRole;
      if (!validRoles.includes(typedRole)) {
        validRoles.push(typedRole);
      }
    }
  }

  // 5. Query succeeded, but user has no assigned roles in public.user_roles
  if (validRoles.length === 0) {
    return {
      status: 'unassigned',
      roles: [],
      activeRole: null,
      error: 'Authenticated user has no assigned roles in public.user_roles.',
    };
  }

  // 6. Role priority for verified users: admin > vendor > customer
  let activeRole: UserRole = 'customer';
  if (validRoles.includes('admin')) {
    activeRole = 'admin';
  } else if (validRoles.includes('vendor')) {
    activeRole = 'vendor';
  } else if (validRoles.includes('customer')) {
    activeRole = 'customer';
  }

  return {
    status: 'verified',
    roles: validRoles,
    activeRole,
    error: null,
  };
}
