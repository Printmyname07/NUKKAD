/**
 * Unit Test Suite: Authentication Fallback Safety & Role Resolution
 *
 * Verifies Phase 4.2D requirements:
 * 1. Valid authenticated user with a verified Customer role
 * 2. Valid authenticated user with a verified Vendor role
 * 3. Valid authenticated user with a verified Admin role
 * 4. Authenticated user with no role record (empty database rows)
 * 5. Missing role table (PGRST205 or schema cache miss)
 * 6. Network or permission error during role lookup (42501 or network failure)
 * 7. User metadata claiming Admin without a trusted Admin role
 * 8. Demo session with no genuine authenticated user
 */

import { resolveUserRoles } from '../../src/features/auth/roleResolution.ts';

function runRoleResolutionTests() {
  console.log('[TEST] Running Role Resolution Safety Unit Tests...');

  // Case 1: Valid authenticated user with a verified Customer role
  const case1 = resolveUserRoles({
    dbRoles: [{ role: 'customer' }],
    dbError: null,
  });
  if (case1.status !== 'verified' || case1.activeRole !== 'customer' || case1.error !== null) {
    throw new Error(`Case 1 Failed: Expected verified customer, got ${JSON.stringify(case1)}`);
  }
  console.log('  ✓ Case 1: Valid authenticated user with verified Customer role -> verified customer');

  // Case 2: Valid authenticated user with a verified Vendor role
  const case2 = resolveUserRoles({
    dbRoles: [{ role: 'vendor' }],
    dbError: null,
  });
  if (case2.status !== 'verified' || case2.activeRole !== 'vendor' || case2.error !== null) {
    throw new Error(`Case 2 Failed: Expected verified vendor, got ${JSON.stringify(case2)}`);
  }
  console.log('  ✓ Case 2: Valid authenticated user with verified Vendor role -> verified vendor');

  // Case 3: Valid authenticated user with a verified Admin role
  const case3 = resolveUserRoles({
    dbRoles: [{ role: 'admin' }, { role: 'customer' }],
    dbError: null,
  });
  if (case3.status !== 'verified' || case3.activeRole !== 'admin' || case3.error !== null) {
    throw new Error(`Case 3 Failed: Expected verified admin, got ${JSON.stringify(case3)}`);
  }
  console.log('  ✓ Case 3: Valid authenticated user with verified Admin role -> verified admin');

  // Case 4: Authenticated user with no role record in database
  const case4 = resolveUserRoles({
    dbRoles: [],
    dbError: null,
  });
  if (case4.status !== 'unassigned' || case4.activeRole !== null || case4.roles.length !== 0 || !case4.error) {
    throw new Error(`Case 4 Failed: Expected unassigned null role, got ${JSON.stringify(case4)}`);
  }
  console.log('  ✓ Case 4: Authenticated user with no role record in database -> status: unassigned, activeRole: null');

  // Case 5: Missing role table (PGRST205 table not found in schema cache)
  const case5 = resolveUserRoles({
    dbRoles: null,
    dbError: {
      code: 'PGRST205',
      message: "Could not find the table 'public.user_roles' in the schema cache",
    },
  });
  if (case5.status !== 'error' || case5.activeRole !== null || case5.roles.length !== 0 || !case5.error?.includes('missing')) {
    throw new Error(`Case 5 Failed: Expected error status with missing table explanation, got ${JSON.stringify(case5)}`);
  }
  console.log('  ✓ Case 5: Missing public.user_roles table -> status: error, activeRole: null (no silent fallback)');

  // Case 6: Network or permission error during role lookup (e.g. 42501 permission denied)
  const case6 = resolveUserRoles({
    dbRoles: null,
    dbError: {
      code: '42501',
      message: 'permission denied for table user_roles',
    },
  });
  if (case6.status !== 'error' || case6.activeRole !== null || case6.roles.length !== 0 || !case6.error) {
    throw new Error(`Case 6 Failed: Expected error status for permission denied, got ${JSON.stringify(case6)}`);
  }
  console.log('  ✓ Case 6: Permission denied / network error during role lookup -> status: error, activeRole: null');

  // Case 7: User metadata claiming Admin without a trusted Admin role in database
  // Attack scenario A: user has only Customer in db, but passes role: 'admin' in userMetadata
  const case7a = resolveUserRoles({
    dbRoles: [{ role: 'customer' }],
    dbError: null,
    userMetadata: { role: 'admin', is_admin: true, permissions: ['all'] },
  });
  if (case7a.status !== 'verified' || case7a.activeRole !== 'customer' || case7a.roles.includes('admin')) {
    throw new Error(`Case 7a Failed: Metadata role was trusted over database! Got ${JSON.stringify(case7a)}`);
  }

  // Attack scenario B: missing table or no db role, but userMetadata claims role: 'admin'
  const case7b = resolveUserRoles({
    dbRoles: null,
    dbError: { code: 'PGRST205', message: 'Could not find table public.user_roles' },
    userMetadata: { role: 'admin' },
  });
  if (case7b.status !== 'error' || case7b.activeRole !== null) {
    throw new Error(`Case 7b Failed: User metadata granted privileges during table error! Got ${JSON.stringify(case7b)}`);
  }
  console.log('  ✓ Case 7: User metadata claiming Admin without trusted DB record -> Strictly ignored, never grants Admin');

  // Case 8: Demo session with no genuine authenticated user
  const case8 = resolveUserRoles({
    isDemo: true,
    demoRole: 'vendor',
  });
  if (case8.status !== 'demo' || case8.activeRole !== 'vendor' || case8.error !== null) {
    throw new Error(`Case 8 Failed: Expected demo session status, got ${JSON.stringify(case8)}`);
  }
  console.log('  ✓ Case 8: Demo session with no genuine authenticated user -> status: demo (separated from genuine auth)');

  console.log('[TEST] All 8 Role Resolution Safety Tests Passed.\n');
}

runRoleResolutionTests();
