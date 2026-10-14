import { UserRole } from '../../types/index.ts';
import { RoleVerificationStatus } from './roleResolution.ts';

export type AppRoute = 'landing' | 'login' | 'register' | 'customer' | 'vendor' | 'admin';

export const PUBLIC_ROUTES: readonly string[] = ['landing', 'login', 'register'];
export const PROTECTED_ROUTES: readonly string[] = ['customer', 'vendor', 'admin'];

export interface AuthAccessState {
  isAuthenticated: boolean;
  role: UserRole | null;
  roleVerificationStatus: RoleVerificationStatus;
}

export interface AccessCheckResult {
  allowed: boolean;
  redirectTo?: string;
  reason?: 'AUTH_REQUIRED' | 'ROLE_UNAUTHORIZED' | 'ROLE_UNVERIFIED';
}

/**
 * Returns true if the route is publicly accessible without authentication.
 */
export function isPublicRoute(route: string): boolean {
  return PUBLIC_ROUTES.includes(route);
}

/**
 * Evaluates whether a user with given auth state is permitted to access a target route.
 * Enforces role isolation without any demo bypasses.
 */
export function checkRouteAccess(route: string, auth: AuthAccessState): AccessCheckResult {
  // 1. Public routes (landing, login, register) are always accessible
  if (isPublicRoute(route)) {
    return { allowed: true };
  }

  // 2. All marketplace features require real authentication
  if (!auth.isAuthenticated) {
    return {
      allowed: false,
      redirectTo: 'login',
      reason: 'AUTH_REQUIRED',
    };
  }

  // 3. Customer portal: accessible to all authenticated users
  if (route === 'customer') {
    return { allowed: true };
  }

  // 4. Vendor portal: requires verified vendor role
  if (route === 'vendor') {
    if (auth.role === 'vendor' && auth.roleVerificationStatus === 'verified') {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: auth.role === 'vendor' ? 'ROLE_UNVERIFIED' : 'ROLE_UNAUTHORIZED',
    };
  }

  // 5. Admin portal: requires verified admin role
  if (route === 'admin') {
    if (auth.role === 'admin' && auth.roleVerificationStatus === 'verified') {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: auth.role === 'admin' ? 'ROLE_UNVERIFIED' : 'ROLE_UNAUTHORIZED',
    };
  }

  return { allowed: true };
}

/**
 * Resolves where a user should be redirected after successful authentication.
 * Preserves the intended route if authorized, or falls back to the user's role home.
 */
export function resolvePostLoginRoute(
  intendedRoute: string | null,
  role: UserRole | null,
  verificationStatus: RoleVerificationStatus = 'verified'
): string {
  // A merchant logging in must always be routed directly to their own vendor shop portal
  if (role === 'vendor') {
    return 'vendor';
  }

  if (intendedRoute && !isPublicRoute(intendedRoute)) {
    if (intendedRoute === 'vendor') {
      return 'customer';
    }
    if (intendedRoute === 'admin') {
      return role === 'admin' && verificationStatus === 'verified' ? 'admin' : 'customer';
    }
    return intendedRoute;
  }

  if (role === 'admin' && verificationStatus === 'verified') return 'admin';
  return 'customer';
}
