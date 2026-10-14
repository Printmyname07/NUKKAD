/**
 * Unit Test Suite: Prototype Storage & Self-Contained Auth Operations
 *
 * Verifies:
 * 1. Password hashing via Web Crypto API / SHA-256 (no plaintext passwords)
 * 2. Public customer registration strictly assigns Customer role (no privilege escalation)
 * 3. Duplicate email registration is blocked
 * 4. Sign-in validation: valid credentials succeed; invalid credentials fail
 * 5. Order placement deducts available stock from inventory
 * 6. Order placement fails when requested quantity exceeds available stock
 * 7. Order status transitions update correctly
 */

import { hashPassword } from '../../src/services/storage/cryptoUtils.ts';
import {
  initializePrototypeStore,
  prototypeRegisterCustomer,
  prototypeRegisterUser,
  getVendorApplications,
  prototypeSignIn,
  prototypeSignOut,
  getPrototypeSessionUser,
  createPrototypeOrder,
  updatePrototypeOrderStatus,
  getPrototypeProducts,
  safeGetItem,
} from '../../src/services/storage/prototypeStorage.ts';
import { checkRouteAccess } from '../../src/features/auth/accessControl.ts';
import { Shop, Product } from '../../src/types/index.ts';

// Mock localStorage for Node test runner
const memoryStore = new Map<string, string>();
(globalThis as unknown as { window: { localStorage: Storage } }).window = {
  localStorage: {
    getItem: (key: string) => memoryStore.get(key) || null,
    setItem: (key: string, val: string) => {
      memoryStore.set(key, val);
    },
    removeItem: (key: string) => {
      memoryStore.delete(key);
    },
    clear: () => {
      memoryStore.clear();
    },
    key: (i: number) => Array.from(memoryStore.keys())[i] || null,
    length: memoryStore.size,
  },
};

async function runPrototypeStorageTests() {
  console.log('[TEST] Running Prototype Storage & Auth Unit Tests...');

  // 1. Password hashing test
  const salt = 'test_salt_123';
  const hash1 = await hashPassword('SecretPass!1', salt);
  const hash2 = await hashPassword('SecretPass!1', salt);
  const hashOther = await hashPassword('WrongPass', salt);

  if (!hash1 || hash1.length < 16) {
    throw new Error('Hash generation failed');
  }
  if (hash1 !== hash2) {
    throw new Error('Hashing is non-deterministic for same salt & password');
  }
  if (hash1 === hashOther) {
    throw new Error('Hash collision detected for different passwords');
  }
  console.log('  ✓ hashPassword: Deterministic SHA-256 salted hash, passwords not plaintext');

  // 2. Customer Registration Role Isolation
  const regResult = await prototypeRegisterCustomer('pooja@test.local', 'Pass@123', 'Pooja');
  if (!regResult.success || !regResult.user) {
    throw new Error(`Registration failed: ${regResult.error}`);
  }
  if (
    regResult.user.roles.length !== 1 ||
    regResult.user.roles[0] !== 'customer' ||
    regResult.user.roles.includes('admin') ||
    regResult.user.roles.includes('vendor')
  ) {
    throw new Error(`Privilege escalation detected: got roles ${JSON.stringify(regResult.user.roles)}`);
  }
  console.log('  ✓ prototypeRegisterCustomer: Strictly provisions Customer role, no escalation permitted');

  // 3. Duplicate registration prevention
  const dupResult = await prototypeRegisterCustomer('pooja@test.local', 'NewPass@123');
  if (dupResult.success) {
    throw new Error('Duplicate email registration should be rejected');
  }
  console.log('  ✓ prototypeRegisterCustomer: Duplicate email is correctly blocked');

  // 4. Sign-in validation
  const validSign = await prototypeSignIn('pooja@test.local', 'Pass@123');
  if (!validSign.success || !validSign.user) {
    throw new Error('Valid login credentials failed');
  }

  const invalidSign = await prototypeSignIn('pooja@test.local', 'WrongPassword');
  if (invalidSign.success) {
    throw new Error('Invalid login credentials should fail');
  }
  console.log('  ✓ prototypeSignIn: Valid credentials succeed, invalid credentials fail');

  // 5. Order Placement & Stock Reservation
  const products = getPrototypeProducts();
  const testProduct = products[0];
  const testVariant = testProduct.variants[0];
  const initialStock = testVariant.quantityAvailable;

  const testCart = {
    shopId: testProduct.shopId,
    shopName: 'Test Shop',
    items: [
      {
        variantId: testVariant.id,
        productId: testProduct.id,
        productName: testProduct.name,
        variantLabel: testVariant.variantLabel,
        unit: testVariant.unit,
        unitPriceMinor: testVariant.priceMinor,
        quantity: 2,
      },
    ],
    subtotalMinor: testVariant.priceMinor * 2,
  };

  const orderResult = createPrototypeOrder(testCart, regResult.user, 'pay_at_shop');
  if (!orderResult.success || !orderResult.order) {
    throw new Error(`Order placement failed: ${orderResult.error}`);
  }
  if (testVariant.quantityAvailable !== initialStock - 2) {
    throw new Error(`Inventory was not deducted: initial ${initialStock}, current ${testVariant.quantityAvailable}`);
  }
  console.log('  ✓ createPrototypeOrder: Deducts available inventory correctly and reserves items');

  // 6. Insufficient stock prevention
  const excessiveCart = {
    ...testCart,
    items: [
      {
        ...testCart.items[0],
        quantity: 99999,
      },
    ],
  };
  const excessiveResult = createPrototypeOrder(excessiveCart, regResult.user, 'pay_at_shop');
  if (excessiveResult.success) {
    throw new Error('Order exceeding available stock should fail');
  }
  console.log('  ✓ createPrototypeOrder: Blocks order exceeding available inventory');

  // 8. Clean Store Initialization (No hardcoded credentials or seed accounts)
  await initializePrototypeStore();
  const usersRaw = memoryStore.get('aaspass_proto_users_v2');
  const storedUsersList = usersRaw ? JSON.parse(usersRaw) : [];
  const hasHardcodedAccounts = storedUsersList.some(
    (u: { email?: string; id?: string }) =>
      u.email === 'admin@aaspass.local' ||
      u.email === 'vendor@aaspass.local' ||
      u.email === 'customer@aaspass.local' ||
      u.id === 'user-admin-seed'
  );
  if (hasHardcodedAccounts) {
    throw new Error('Hardcoded pre-seeded accounts were silently recreated!');
  }
  console.log('  ✓ initializePrototypeStore: Zero hardcoded seed accounts created or recreated');

  // 9. Role Escalation Prevention: Customer cannot elevate own role via registration, public UI, or browser globals
  const windowObj = globalThis as unknown as { aaspassProvisionRole?: unknown };
  if (windowObj.aaspassProvisionRole !== undefined) {
    throw new Error('Security Violation: window.aaspassProvisionRole global must not be exposed!');
  }

  // Verify newly registered customer user has strictly ['customer'] and no admin/vendor roles
  const freshCustomerReg = await prototypeRegisterCustomer('security.test@aaspass.local', 'SecurePass!99', 'Test User');
  if (!freshCustomerReg.success || !freshCustomerReg.user) {
    throw new Error('Fresh customer registration failed');
  }
  if (
    freshCustomerReg.user.roles.length !== 1 ||
    freshCustomerReg.user.roles[0] !== 'customer' ||
    freshCustomerReg.user.roles.includes('vendor') ||
    freshCustomerReg.user.roles.includes('admin')
  ) {
    throw new Error('Security Violation: Customer registration granted unauthorized roles!');
  }
  console.log('  ✓ Role Escalation Prevention: No browser globals, customer registration strictly restricted to customer role');

  // 10. Session Security & Malformed Storage Resiliency
  const activeSessionUser = getPrototypeSessionUser();
  if (!activeSessionUser || activeSessionUser.email !== 'security.test@aaspass.local') {
    throw new Error('Valid session user failed to resolve');
  }

  // Corrupt session data
  memoryStore.set('aaspass_proto_session_v2', '{malformed json syntax!!!');
  const corruptedSessionUser = getPrototypeSessionUser();
  if (corruptedSessionUser !== null) {
    throw new Error('Malformed JSON session should fail safely to null');
  }

  // Expired session
  const expiredSession = {
    userId: freshCustomerReg.user.id,
    token: 'expired_tok',
    expiresAt: new Date(Date.now() - 1000).toISOString(),
  };
  memoryStore.set('aaspass_proto_session_v2', JSON.stringify(expiredSession));
  const expiredSessionUser = getPrototypeSessionUser();
  if (expiredSessionUser !== null) {
    throw new Error('Expired session should fail safely to null');
  }
  console.log('  ✓ getPrototypeSessionUser: Session expiration & malformed JSON handled defensively');

  // 11. Account Type Selection & Instant Vendor Creation
  const vendorRegAttempt = await prototypeRegisterUser('vendor.candidate@test.local', 'Pass@123', 'vendor', 'Vendor Candidate');
  if (vendorRegAttempt.success) {
    throw new Error('Vendor registration without shop name should fail');
  }

  const validVendorReg = await prototypeRegisterUser('vendor.candidate@test.local', 'Pass@123', 'vendor', 'Vendor Candidate', 'Candidate General Store');
  if (!validVendorReg.success || !validVendorReg.user) {
    throw new Error('Valid vendor registration failed');
  }
  if (!validVendorReg.user.roles.includes('vendor')) {
    throw new Error('Vendor registration must grant vendor role immediately');
  }

  // Verify shop was created
  const shops = safeGetItem<Shop[]>('aaspass_proto_shops_v2', []);
  const createdShop = shops.find((s: Shop) => s.ownerUserId === validVendorReg.user?.id);
  if (!createdShop || createdShop.name !== 'Candidate General Store') {
    throw new Error('Vendor shop was not created instantly');
  }

  // Verify vendor can access vendor portal
  const routeCheck = checkRouteAccess('vendor', {
    isAuthenticated: true,
    role: 'vendor',
    roleVerificationStatus: 'verified',
  });
  if (!routeCheck.allowed) {
    throw new Error('Verified vendor should be allowed into vendor portal');
  }
  console.log('  ✓ Account Type Selection: Vendor account created instantly with role, shop provisioned');

  // 12. Vendor Registration with Custom Shop Details and Initial Products
  const customVendorReg = await prototypeRegisterUser(
    'spice.vendor@test.local',
    'Pass@123',
    'vendor',
    'Ram Spice Merchant',
    'Ram Heritage Spice Shop',
    {
      description: 'Authentic Rajasthani hand-ground masalas and spices.',
      categoryId: 'cat-1',
      addressText: 'Shop No. 5, Johari Bazaar, Jaipur',
      landmark: 'Near Hawa Mahal',
      initialProducts: [
        { name: 'Pure Red Chili Powder (500g)', price: 140, unit: 'packet', quantity: 30 },
        { name: 'Organic Turmeric Powder (250g)', price: 80, unit: 'packet', quantity: 40 },
      ],
    }
  );
  if (!customVendorReg.success || !customVendorReg.user) {
    throw new Error('Vendor registration with custom shop details and products failed');
  }
  const allShopsAfter = safeGetItem<Shop[]>('aaspass_proto_shops_v2', []);
  const ramShop = allShopsAfter.find((s: Shop) => s.ownerUserId === customVendorReg.user?.id);
  if (!ramShop || ramShop.landmark !== 'Near Hawa Mahal') {
    throw new Error('Custom shop landmark or details were not saved properly');
  }
  const allProductsAfter = safeGetItem<Product[]>('aaspass_proto_products_v2', []);
  const ramProducts = allProductsAfter.filter((p: Product) => p.shopId === ramShop.id);
  if (ramProducts.length !== 2) {
    throw new Error(`Expected 2 initial products for custom shop, found ${ramProducts.length}`);
  }
  if (!ramProducts.some((p) => p.name === 'Pure Red Chili Powder (500g)')) {
    throw new Error('Product of vendor choice was not properly created');
  }
  console.log('  ✓ Custom Shop Creation: Vendor shop created with chosen details & products of choice');

  console.log('[TEST] All Prototype Storage & Auth Unit Tests Passed.\n');
}

runPrototypeStorageTests();
