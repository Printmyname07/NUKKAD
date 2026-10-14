/**
 * Unit Test Suite: Authentication & Route Access Control
 *
 * Verifies access control requirements:
 * 1. Public routes allow unauthenticated access (landing, login, register).
 * 2. Protected features (customer, vendor, admin) require authentication.
 * 3. Unauthenticated access attempts redirect to sign-in with intended destination preserved.
 * 4. Authenticated customer role cannot access vendor or admin views.
 * 5. Privileged vendor and admin portals require verified database roles.
 * 6. Post-login redirection preserves intended destination when authorized and falls back safely when unauthorized.
 */

import {
  isPublicRoute,
  checkRouteAccess,
  resolvePostLoginRoute,
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
} from '../../src/features/auth/accessControl.ts';

function runAccessControlTests() {
  console.log('[TEST] Running Access Control & Route Guard Unit Tests...');

  // Case 1: Public routes verification
  for (const route of PUBLIC_ROUTES) {
    if (!isPublicRoute(route)) {
      throw new Error(`Expected ${route} to be a public route`);
    }
    const access = checkRouteAccess(route, {
      isAuthenticated: false,
      role: null,
      roleVerificationStatus: 'idle',
    });
    if (!access.allowed) {
      throw new Error(`Public route ${route} was blocked for unauthenticated visitor`);
    }
  }
  console.log('  ✓ Case 1: Public routes (landing, login, register) allow unauthenticated access');

  // Case 2: Protected routes deny unauthenticated visitors
  for (const route of PROTECTED_ROUTES) {
    if (isPublicRoute(route)) {
      throw new Error(`Expected ${route} to be protected, not public`);
    }
    const access = checkRouteAccess(route, {
      isAuthenticated: false,
      role: null,
      roleVerificationStatus: 'idle',
    });
    if (access.allowed || access.redirectTo !== 'login' || access.reason !== 'AUTH_REQUIRED') {
      throw new Error(`Protected route ${route} failed to require authentication: ${JSON.stringify(access)}`);
    }
  }
  console.log('  ✓ Case 2: Protected routes (customer, vendor, admin) strictly require authentication');

  // Case 3: Authenticated customer can access customer portal
  const customerAccess = checkRouteAccess('customer', {
    isAuthenticated: true,
    role: 'customer',
    roleVerificationStatus: 'verified',
  });
  if (!customerAccess.allowed) {
    throw new Error('Authenticated customer was blocked from customer portal');
  }
  console.log('  ✓ Case 3: Authenticated customer allowed into customer portal');

  // Case 4: Authenticated customer cannot access vendor or admin portals
  const customerVendorAttempt = checkRouteAccess('vendor', {
    isAuthenticated: true,
    role: 'customer',
    roleVerificationStatus: 'verified',
  });
  if (customerVendorAttempt.allowed || customerVendorAttempt.reason !== 'ROLE_UNAUTHORIZED') {
    throw new Error(`Customer was improperly allowed vendor access: ${JSON.stringify(customerVendorAttempt)}`);
  }

  const customerAdminAttempt = checkRouteAccess('admin', {
    isAuthenticated: true,
    role: 'customer',
    roleVerificationStatus: 'verified',
  });
  if (customerAdminAttempt.allowed || customerAdminAttempt.reason !== 'ROLE_UNAUTHORIZED') {
    throw new Error(`Customer was improperly allowed admin access: ${JSON.stringify(customerAdminAttempt)}`);
  }
  console.log('  ✓ Case 4: Authenticated customer strictly blocked from vendor and admin portals');

  // Case 5: Unverified vendor is blocked from vendor portal
  const unverifiedVendorAccess = checkRouteAccess('vendor', {
    isAuthenticated: true,
    role: 'vendor',
    roleVerificationStatus: 'unassigned',
  });
  if (unverifiedVendorAccess.allowed || unverifiedVendorAccess.reason !== 'ROLE_UNVERIFIED') {
    throw new Error(`Unverified vendor was improperly granted access: ${JSON.stringify(unverifiedVendorAccess)}`);
  }
  console.log('  ✓ Case 5: Unverified vendor blocked from vendor tools');

  // Case 6: Verified vendor is permitted in vendor portal
  const verifiedVendorAccess = checkRouteAccess('vendor', {
    isAuthenticated: true,
    role: 'vendor',
    roleVerificationStatus: 'verified',
  });
  if (!verifiedVendorAccess.allowed) {
    throw new Error('Verified vendor was blocked from vendor portal');
  }
  console.log('  ✓ Case 6: Verified vendor granted access to vendor operations');

  // Case 7: Unverified admin is blocked from admin portal
  const unverifiedAdminAccess = checkRouteAccess('admin', {
    isAuthenticated: true,
    role: 'admin',
    roleVerificationStatus: 'error',
  });
  if (unverifiedAdminAccess.allowed || unverifiedAdminAccess.reason !== 'ROLE_UNVERIFIED') {
    throw new Error(`Unverified admin was granted access during error: ${JSON.stringify(unverifiedAdminAccess)}`);
  }
  console.log('  ✓ Case 7: Unverified admin blocked from platform administration');

  // Case 8: Verified admin is permitted in admin portal
  const verifiedAdminAccess = checkRouteAccess('admin', {
    isAuthenticated: true,
    role: 'admin',
    roleVerificationStatus: 'verified',
  });
  if (!verifiedAdminAccess.allowed) {
    throw new Error('Verified admin was blocked from admin portal');
  }
  console.log('  ✓ Case 8: Verified admin granted access to administrative tools');

  // Case 9: Post-login redirection preserves intended destination when authorized
  const redirectCustomer = resolvePostLoginRoute('customer', 'customer', 'verified');
  if (redirectCustomer !== 'customer') {
    throw new Error(`Expected customer redirect to customer, got ${redirectCustomer}`);
  }

  const redirectVendor = resolvePostLoginRoute('vendor', 'vendor', 'verified');
  if (redirectVendor !== 'vendor') {
    throw new Error(`Expected vendor redirect to vendor, got ${redirectVendor}`);
  }

  // If customer intended to go to vendor, fall back safely to customer
  const redirectCustomerToVendorAttempt = resolvePostLoginRoute('vendor', 'customer', 'verified');
  if (redirectCustomerToVendorAttempt !== 'customer') {
    throw new Error(`Customer attempting vendor destination should fall back to customer, got ${redirectCustomerToVendorAttempt}`);
  }

  // Default redirect when no intended route was stored
  const defaultCustomer = resolvePostLoginRoute(null, 'customer', 'verified');
  if (defaultCustomer !== 'customer') {
    throw new Error(`Expected default customer redirect, got ${defaultCustomer}`);
  }

  const defaultVendor = resolvePostLoginRoute(null, 'vendor', 'verified');
  if (defaultVendor !== 'vendor') {
    throw new Error(`Expected default vendor redirect, got ${defaultVendor}`);
  }
  console.log('  ✓ Case 9: Post-login destination preserved when authorized; falls back safely to role home');

  // Case 10: Vendor logging in always resolves strictly to their own vendor shop portal
  const vendorRedirectFromCustomer = resolvePostLoginRoute('customer', 'vendor', 'verified');
  if (vendorRedirectFromCustomer !== 'vendor') {
    throw new Error(`Vendor logging in must always be routed to vendor portal, got ${vendorRedirectFromCustomer}`);
  }
  const vendorRedirectFromNull = resolvePostLoginRoute(null, 'vendor', 'verified');
  if (vendorRedirectFromNull !== 'vendor') {
    throw new Error(`Vendor logging in with null destination must route to vendor portal, got ${vendorRedirectFromNull}`);
  }
  console.log('  ✓ Case 10: Vendor logging in unconditionally routes to their vendor shop portal');

  console.log('[TEST] All Access Control & Route Guard Unit Tests Passed.\n');
}

runAccessControlTests();
