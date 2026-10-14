/**
 * AasPass Prototype Local Storage Engine
 *
 * Provides a self-contained, crash-resilient storage abstraction for:
 * - User accounts with salted SHA-256 hashes (never plaintext)
 * - Session restoration
 * - Shops, inventory, and crowd reports
 * - Order placement with inventory reservation
 * - Vendor operational & payment settings
 *
 * DISCLAIMER:
 * Local browser storage is NOT shared across devices or other users.
 * Data persists only in this browser profile and can be cleared at any time.
 * Authentication is labeled as prototype-only; client-side authorization is
 * not a substitute for an authoritative server in production.
 */

import {
  UserRole,
  UserProfile,
  Shop,
  Product,
  Order,
  Cart,
  CrowdReportSummary,
  AuditLogEntry,
  PaymentMethod,
} from '../../types/index.ts';
import { DEMO_SHOPS, DEMO_PRODUCTS, DEMO_CATEGORIES } from '../api/index.ts';
import { hashPassword, generateId } from './cryptoUtils.ts';

export const PROTOTYPE_STORAGE_DISCLAIMER =
  'AasPass is currently running in self-contained prototype mode. All accounts, catalogue edits, and orders are stored locally in your browser storage. This data is not shared between devices or other users, and will be reset if browser storage is cleared.';

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  displayName: string;
  roles: UserRole[];
  preferredLanguage: 'en' | 'hi';
  createdAt: string;
  updatedAt: string;
}

export interface StoredSession {
  userId: string;
  token: string;
  expiresAt: string;
}

export interface VendorSettings {
  acceptedPaymentMethods: PaymentMethod[];
  autoAcceptPickup: boolean;
  preparationLeadMinutes: number;
}

export interface VendorApplication {
  id: string;
  userId: string;
  email: string;
  shopName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const STORAGE_KEYS = {
  USERS: 'aaspass_proto_users_v2',
  SESSION: 'aaspass_proto_session_v2',
  SHOPS: 'aaspass_proto_shops_v2',
  PRODUCTS: 'aaspass_proto_products_v2',
  ORDERS: 'aaspass_proto_orders_v2',
  AUDIT: 'aaspass_proto_audit_v2',
  VENDOR_SETTINGS: 'aaspass_proto_vendor_settings_v2',
  VENDOR_APPLICATIONS: 'aaspass_proto_vendor_applications_v1',
} as const;

// Safe wrapper for localStorage access
export function safeGetItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[PrototypeStorage] Failed to parse item "${key}", using fallback:`, err);
    return fallback;
  }
}

function safeSetItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('aaspass_storage_update', { detail: { key } }));
    }
    return true;
  } catch (err) {
    console.error(`[PrototypeStorage] Failed to save key "${key}":`, err);
    return false;
  }
}

/**
 * Ensures clean prototype store initialization.
 * Zero pre-seeded accounts or hardcoded credentials are created.
 * Users must explicitly register via the public registration interface.
 */
export async function initializePrototypeStore(): Promise<void> {
  if (typeof window === 'undefined' || !window.localStorage) return;

  // 1. Initialize Users: strictly no hardcoded credentials or automatic accounts.
  // Purge any legacy pre-seeded accounts from previous test runs if present in browser storage.
  const existingUsers = safeGetItem<StoredUser[]>(STORAGE_KEYS.USERS, []);
  if (!Array.isArray(existingUsers) || existingUsers.length === 0) {
    safeSetItem(STORAGE_KEYS.USERS, []);
  } else {
    const cleanedUsers = existingUsers.filter(
      (u) =>
        u.id !== 'user-admin-seed' &&
        u.id !== 'vendor-user-1' &&
        u.id !== 'user-customer-seed' &&
        u.email !== 'admin@aaspass.local' &&
        u.email !== 'vendor@aaspass.local' &&
        u.email !== 'customer@aaspass.local'
    );
    if (cleanedUsers.length !== existingUsers.length) {
      safeSetItem(STORAGE_KEYS.USERS, cleanedUsers);
    }
  }

  // 2. Initialize Shops if empty
  const existingShops = safeGetItem<Shop[]>(STORAGE_KEYS.SHOPS, []);
  if (existingShops.length === 0) {
    safeSetItem(STORAGE_KEYS.SHOPS, DEMO_SHOPS);
  }

  // 3. Initialize Products if empty
  const existingProducts = safeGetItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  if (existingProducts.length === 0) {
    safeSetItem(STORAGE_KEYS.PRODUCTS, DEMO_PRODUCTS);
  }

  // 4. Initialize Orders if empty
  const existingOrders = safeGetItem<Order[]>(STORAGE_KEYS.ORDERS, []);
  if (existingOrders.length === 0) {
    safeSetItem(STORAGE_KEYS.ORDERS, []);
  }

  // 5. Initialize Vendor Settings if empty
  const existingSettings = safeGetItem<Record<string, VendorSettings>>(STORAGE_KEYS.VENDOR_SETTINGS, {});
  if (Object.keys(existingSettings).length === 0) {
    safeSetItem(STORAGE_KEYS.VENDOR_SETTINGS, {
      'shop-jaipur-1': {
        acceptedPaymentMethods: ['pay_at_shop', 'online'],
        autoAcceptPickup: false,
        preparationLeadMinutes: 15,
      },
      'shop-jaipur-2': {
        acceptedPaymentMethods: ['pay_at_shop'],
        autoAcceptPickup: true,
        preparationLeadMinutes: 10,
      },
    });
  }
  // 6. Initialize Vendor Applications if empty
  const existingApps = safeGetItem<VendorApplication[]>(STORAGE_KEYS.VENDOR_APPLICATIONS, []);
  if (!Array.isArray(existingApps)) {
    safeSetItem(STORAGE_KEYS.VENDOR_APPLICATIONS, []);
  }
}

// ============================================================================
// Authentication & Registration Operations (Self-Contained)
// ============================================================================

export async function prototypeRegisterUser(
  email: string,
  password: string,
  accountType: 'customer' | 'vendor',
  fullName?: string,
  shopName?: string,
  shopDetails?: {
    description?: string;
    categoryId?: string;
    addressText?: string;
    landmark?: string;
    initialProducts?: Array<{
      name: string;
      description?: string;
      categoryId?: string;
      price: number;
      unit?: string;
      quantity?: number;
    }>;
  }
): Promise<{ success: boolean; user?: StoredUser; error?: string; isPendingVendor?: boolean }> {
  const normalizedEmail = email.trim().toLowerCase();
  const users = safeGetItem<StoredUser[]>(STORAGE_KEYS.USERS, []);

  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: 'An account with this email address already exists.' };
  }

  if (accountType !== 'customer' && accountType !== 'vendor') {
    return { success: false, error: 'Please select a valid account type.' };
  }

  if (accountType === 'vendor' && (!shopName || shopName.trim() === '')) {
    return { success: false, error: 'Shop name is required for vendor registration.' };
  }

  const salt = generateId('salt');
  const passwordHash = await hashPassword(password, salt);
  const now = new Date().toISOString();

  // Create user
  const newUser: StoredUser = {
    id: generateId('usr'),
    email: normalizedEmail,
    passwordHash,
    salt,
    displayName: (fullName || normalizedEmail.split('@')[0]).trim(),
    roles: accountType === 'vendor' ? ['customer', 'vendor'] : ['customer'],
    preferredLanguage: 'en',
    createdAt: now,
    updatedAt: now,
  };

  users.push(newUser);
  safeSetItem(STORAGE_KEYS.USERS, users);

  if (accountType === 'vendor') {
    // Create shop with vendor provided details
    const shops = safeGetItem<Shop[]>(STORAGE_KEYS.SHOPS, DEMO_SHOPS);
    const selectedCategory =
      DEMO_CATEGORIES.find((c) => c.id === shopDetails?.categoryId) || DEMO_CATEGORIES[0];

    const newShopId = generateId('shop');
    const newShop: Shop = {
      id: newShopId,
      ownerUserId: newUser.id,
      name: shopName!.trim(),
      description:
        shopDetails?.description?.trim() ||
        'Neighborhood store offering quick pickup of fresh groceries and local essentials.',
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.nameEn,
      addressText: shopDetails?.addressText?.trim() || 'Shop No. 12, Local Jaipur Market',
      landmark: shopDetails?.landmark?.trim() || 'Main Market Street',
      latitude: 26.9124,
      longitude: 75.7873,
      verificationStatus: 'verified',
      availabilityStatus: 'open',
      distanceMeters: 450,
      latestCrowd: {
        level: 'low',
        source: 'vendor',
        observedAt: now,
        expiresAt: new Date(Date.now() + 60 * 60000).toISOString(),
        isStale: false,
        note: 'Store opened with quick counter service.',
      },
      createdAt: now,
      updatedAt: now,
    };
    shops.push(newShop);
    safeSetItem(STORAGE_KEYS.SHOPS, shops);

    // Create custom products of the vendor's own choice if provided
    if (shopDetails?.initialProducts && shopDetails.initialProducts.length > 0) {
      const allProducts = safeGetItem<Product[]>(STORAGE_KEYS.PRODUCTS, DEMO_PRODUCTS);
      for (const prod of shopDetails.initialProducts) {
        if (!prod.name.trim()) continue;
        const newPrdId = generateId('prd');
        const prodCategory = prod.categoryId || selectedCategory.id;
        const unit = prod.unit || 'piece';
        const price = prod.price > 0 ? prod.price : 25;
        const qty = prod.quantity !== undefined && prod.quantity >= 0 ? prod.quantity : 20;

        const newProduct: Product = {
          id: newPrdId,
          shopId: newShopId,
          shopName: newShop.name,
          categoryId: prodCategory,
          name: prod.name.trim(),
          description: prod.description?.trim() || '',
          status: 'active',
          variants: [
            {
              id: generateId('var'),
              productId: newPrdId,
              variantLabel: 'Standard',
              unit,
              priceMinor: Math.round(price * 100),
              currency: 'INR',
              quantityAvailable: qty,
              quantityReserved: 0,
              availabilityStatus: 'available',
              lastVerifiedAt: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
        };
        allProducts.push(newProduct);
      }
      safeSetItem(STORAGE_KEYS.PRODUCTS, allProducts);
    }
  }

  // Set active session
  setPrototypeSession(newUser.id);

  return { success: true, user: newUser };
}

export async function prototypeRegisterCustomer(
  email: string,
  password: string,
  fullName?: string
): Promise<{ success: boolean; user?: StoredUser; error?: string }> {
  const res = await prototypeRegisterUser(email, password, 'customer', fullName);
  return { success: res.success, user: res.user, error: res.error };
}

export function getVendorApplications(): VendorApplication[] {
  return safeGetItem<VendorApplication[]>(STORAGE_KEYS.VENDOR_APPLICATIONS, []);
}

export async function prototypeSignIn(
  email: string,
  password: string
): Promise<{ success: boolean; user?: StoredUser; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const users = safeGetItem<StoredUser[]>(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return { success: false, error: 'Invalid email or password.' };
  }

  const hashAttempt = await hashPassword(password, user.salt);
  if (hashAttempt !== user.passwordHash) {
    return { success: false, error: 'Invalid email or password.' };
  }

  setPrototypeSession(user.id);
  return { success: true, user };
}

export function prototypeSignOut(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch (err) {
      console.warn('[PrototypeStorage] Failed to clear session from localStorage:', err);
    }
  }
}

export function getPrototypeSessionUser(): StoredUser | null {
  const session = safeGetItem<StoredSession | null>(STORAGE_KEYS.SESSION, null);
  if (!session || typeof session !== 'object' || !session.userId || !session.expiresAt) {
    return null;
  }

  // Defensively validate expiration (24 hours)
  const expiresAtMs = new Date(session.expiresAt).getTime();
  if (isNaN(expiresAtMs) || expiresAtMs < Date.now()) {
    prototypeSignOut();
    return null;
  }

  const users = safeGetItem<StoredUser[]>(STORAGE_KEYS.USERS, []);
  if (!Array.isArray(users)) return null;

  const user = users.find((u) => u && typeof u === 'object' && u.id === session.userId);
  if (!user) return null;

  // Defensive validation of user record integrity
  if (!user.email || !Array.isArray(user.roles) || !user.passwordHash || !user.salt) {
    console.warn('[PrototypeStorage] User record in local storage is malformed.');
    return null;
  }

  return user;
}

function setPrototypeSession(userId: string): void {
  const session: StoredSession = {
    userId,
    token: generateId('sess'),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  safeSetItem(STORAGE_KEYS.SESSION, session);
}

/**
 * Privileged Role Management (Only authorized Admins can assign Vendor/Admin roles in app)
 */
export function prototypeAssignRole(
  adminUserId: string,
  targetUserId: string,
  roleToGrant: UserRole
): { success: boolean; error?: string } {
  const users = safeGetItem<StoredUser[]>(STORAGE_KEYS.USERS, []);
  if (!Array.isArray(users)) return { success: false, error: 'User database not available.' };

  const admin = users.find((u) => u.id === adminUserId);
  if (!admin || !admin.roles.includes('admin')) {
    return { success: false, error: 'Unauthorized: Only platform administrators can grant roles.' };
  }

  const target = users.find((u) => u.id === targetUserId);
  if (!target) {
    return { success: false, error: 'Target user not found.' };
  }

  if (!target.roles.includes(roleToGrant)) {
    target.roles.push(roleToGrant);
    target.updatedAt = new Date().toISOString();
    safeSetItem(STORAGE_KEYS.USERS, users);
  }

  return { success: true };
}



// ============================================================================
// Shop, Product & Inventory Storage Operations
// ============================================================================

export function getPrototypeShops(): Shop[] {
  return safeGetItem<Shop[]>(STORAGE_KEYS.SHOPS, DEMO_SHOPS);
}

export function getPrototypeProducts(): Product[] {
  return safeGetItem<Product[]>(STORAGE_KEYS.PRODUCTS, DEMO_PRODUCTS);
}

export function addPrototypeProduct(
  shopId: string,
  productData: {
    name: string;
    description: string;
    categoryId: string;
    price: number;
    unit: string;
    quantity: number;
  },
  actorUserId: string
): { success: boolean; product?: Product; error?: string } {
  const shops = safeGetItem<Shop[]>(STORAGE_KEYS.SHOPS, DEMO_SHOPS);
  const shop = shops.find((s) => s.id === shopId);
  if (!shop || shop.ownerUserId !== actorUserId) {
    return { success: false, error: 'Unauthorized or shop not found.' };
  }

  const products = safeGetItem<Product[]>(STORAGE_KEYS.PRODUCTS, DEMO_PRODUCTS);
  const newProduct: Product = {
    id: generateId('prd'),
    shopId,
    shopName: shop.name,
    categoryId: productData.categoryId,
    name: productData.name,
    description: productData.description,
    status: 'active',
    variants: [
      {
        id: generateId('var'),
        productId: '', // will be set
        variantLabel: 'Standard',
        unit: productData.unit,
        priceMinor: productData.price * 100,
        currency: 'INR',
        quantityAvailable: productData.quantity,
        quantityReserved: 0,
        availabilityStatus: 'available',
        lastVerifiedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  newProduct.variants[0].productId = newProduct.id;

  products.push(newProduct);
  safeSetItem(STORAGE_KEYS.PRODUCTS, products);
  return { success: true, product: newProduct };
}

export function getOrCreateVendorShop(userId: string, vendorDisplayName?: string): Shop {
  const shops = safeGetItem<Shop[]>(STORAGE_KEYS.SHOPS, DEMO_SHOPS);
  let shop = shops.find((s) => s.ownerUserId === userId);
  if (!shop) {
    const now = new Date().toISOString();
    const cleanName = (vendorDisplayName || 'Local Merchant').trim();
    const category = DEMO_CATEGORIES[0];
    shop = {
      id: generateId('shop'),
      ownerUserId: userId,
      name: cleanName.toLowerCase().includes('store') || cleanName.toLowerCase().includes('shop')
        ? cleanName
        : `${cleanName}'s Store`,
      description: 'Neighborhood store offering quick pickup of fresh groceries and local essentials.',
      categoryId: category.id,
      categoryName: category.nameEn,
      addressText: 'Shop No. 12, Local Market, Jaipur',
      landmark: 'Near Market Gate',
      latitude: 26.9124,
      longitude: 75.7873,
      verificationStatus: 'verified',
      availabilityStatus: 'open',
      distanceMeters: 400,
      latestCrowd: {
        level: 'low',
        source: 'vendor',
        observedAt: now,
        expiresAt: new Date(Date.now() + 60 * 60000).toISOString(),
        isStale: false,
        note: 'Counter is clear and open for quick pickup.',
      },
      createdAt: now,
      updatedAt: now,
    };
    shops.push(shop);
    safeSetItem(STORAGE_KEYS.SHOPS, shops);
  }
  return shop;
}

export function deletePrototypeProduct(
  productId: string,
  actorUserId: string
): { success: boolean; error?: string } {
  const products = safeGetItem<Product[]>(STORAGE_KEYS.PRODUCTS, DEMO_PRODUCTS);
  const product = products.find((p) => p.id === productId);
  if (!product) return { success: false, error: 'Product not found.' };

  const shops = getPrototypeShops();
  const shop = shops.find((s) => s.id === product.shopId);
  if (!shop || shop.ownerUserId !== actorUserId) {
    return { success: false, error: 'Unauthorized: You do not have permission to delete this product.' };
  }

  const remaining = products.filter((p) => p.id !== productId);
  safeSetItem(STORAGE_KEYS.PRODUCTS, remaining);
  return { success: true };
}

export function updatePrototypeProduct(
  productId: string,
  updates: Partial<Product> & { price?: number; unit?: string; quantity?: number },
  actorUserId: string
): { success: boolean; product?: Product; error?: string } {
  const products = safeGetItem<Product[]>(STORAGE_KEYS.PRODUCTS, DEMO_PRODUCTS);
  const index = products.findIndex((p) => p.id === productId);
  if (index === -1) return { success: false, error: 'Product not found.' };

  const currentProduct = products[index];

  // Authorization check
  const shops = getPrototypeShops();
  const shop = shops.find((s) => s.id === currentProduct.shopId);
  if (!shop || shop.ownerUserId !== actorUserId) {
    return { success: false, error: 'Unauthorized: You do not have permission to modify this product.' };
  }

  // Update variants if price, unit, or quantity are provided
  const updatedVariants = currentProduct.variants.map((v, i) => {
    if (i === 0) {
      const newQty = updates.quantity !== undefined ? updates.quantity : v.quantityAvailable;
      return {
        ...v,
        unit: updates.unit !== undefined ? updates.unit : v.unit,
        priceMinor: updates.price !== undefined ? Math.round(updates.price * 100) : v.priceMinor,
        quantityAvailable: newQty,
        availabilityStatus: (newQty > 0 ? 'available' : 'unavailable') as 'available' | 'unavailable',
        lastVerifiedAt: new Date().toISOString(),
      };
    }
    return v;
  });

  const { price, unit, quantity, ...directUpdates } = updates;

  const updated: Product = {
    ...currentProduct,
    ...directUpdates,
    variants: updatedVariants,
    updatedAt: new Date().toISOString(),
  };

  products[index] = updated;
  safeSetItem(STORAGE_KEYS.PRODUCTS, products);
  return { success: true, product: updated };
}

export function updatePrototypeShop(
  shopId: string,
  updates: Partial<Shop>,
  actorUserId?: string
): { success: boolean; shop?: Shop; error?: string } {
  const shops = safeGetItem<Shop[]>(STORAGE_KEYS.SHOPS, DEMO_SHOPS);
  const index = shops.findIndex((s) => s.id === shopId);
  if (index === -1) return { success: false, error: 'Shop not found.' };

  const currentShop = shops[index];

  // Authorization check: Actor must be owner or admin
  if (actorUserId) {
    const users = safeGetItem<StoredUser[]>(STORAGE_KEYS.USERS, []);
    const actor = users.find((u) => u.id === actorUserId);
    const isOwner = currentShop.ownerUserId === actorUserId;
    const isAdmin = actor?.roles.includes('admin');
    if (!isOwner && !isAdmin) {
      return { success: false, error: 'Unauthorized: You do not have permission to modify this shop.' };
    }
  }

  // Auto-sync categoryName if categoryId changed
  let resolvedCategoryName = updates.categoryName || currentShop.categoryName;
  if (updates.categoryId && updates.categoryId !== currentShop.categoryId) {
    const matchedCategory = DEMO_CATEGORIES.find((c) => c.id === updates.categoryId);
    if (matchedCategory) {
      resolvedCategoryName = matchedCategory.nameEn;
    }
  }

  const updated: Shop = {
    ...currentShop,
    ...updates,
    categoryName: resolvedCategoryName,
    updatedAt: new Date().toISOString(),
  };

  shops[index] = updated;
  safeSetItem(STORAGE_KEYS.SHOPS, shops);

  // Sync shopName in products if name changed
  if (updates.name && updates.name !== currentShop.name) {
    const products = safeGetItem<Product[]>(STORAGE_KEYS.PRODUCTS, DEMO_PRODUCTS);
    let changed = false;
    for (const p of products) {
      if (p.shopId === shopId) {
        p.shopName = updates.name;
        changed = true;
      }
    }
    if (changed) {
      safeSetItem(STORAGE_KEYS.PRODUCTS, products);
    }
  }

  return { success: true, shop: updated };
}

export function updatePrototypeCrowdReport(
  shopId: string,
  level: CrowdReportSummary['level'],
  source: CrowdReportSummary['source'],
  note?: string
): boolean {
  const shops = getPrototypeShops();
  const shop = shops.find((s) => s.id === shopId);
  if (!shop) return false;

  const now = new Date();
  const newCrowd: CrowdReportSummary = {
    level,
    source,
    observedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 60 * 60000).toISOString(),
    isStale: false,
    note: note || undefined,
  };

  shop.latestCrowd = newCrowd;
  shop.updatedAt = now.toISOString();

  safeSetItem(STORAGE_KEYS.SHOPS, shops);
  return true;
}

// ============================================================================
// Order Placement & Inventory Management (Safe Concurrency)
// ============================================================================

export function getPrototypeOrders(filterUserId?: string, filterRole?: UserRole): Order[] {
  const allOrders = safeGetItem<Order[]>(STORAGE_KEYS.ORDERS, []);
  if (!filterUserId) return allOrders;

  if (filterRole === 'admin') {
    return allOrders;
  }

  if (filterRole === 'vendor') {
    // Find shops owned by this vendor
    const shops = getPrototypeShops();
    const ownedShopIds = shops.filter((s) => s.ownerUserId === filterUserId).map((s) => s.id);
    return allOrders.filter((o) => ownedShopIds.includes(o.shopId));
  }

  // Customer: only their own orders
  return allOrders.filter((o) => o.customerUserId === filterUserId);
}

export function createPrototypeOrder(
  cart: Cart,
  customerUser: StoredUser,
  paymentMethod: PaymentMethod,
  customerNote?: string
): { success: boolean; order?: Order; error?: string } {
  if (!cart.shopId || cart.items.length === 0) {
    return { success: false, error: 'Cart is empty.' };
  }

  // Concurrency & Stock Check
  const products = getPrototypeProducts();

  for (const item of cart.items) {
    const product = products.find((p) => p.id === item.productId);
    const variant = product?.variants.find((v) => v.id === item.variantId);

    if (!variant) {
      return { success: false, error: `Product variant "${item.productName}" is no longer listed.` };
    }

    if (variant.quantityAvailable < item.quantity) {
      return {
        success: false,
        error: `Insufficient stock for "${item.productName}". Only ${variant.quantityAvailable} available.`,
      };
    }
  }

  // Deduct inventory
  for (const item of cart.items) {
    const product = products.find((p) => p.id === item.productId)!;
    const variant = product.variants.find((v) => v.id === item.variantId)!;
    variant.quantityAvailable -= item.quantity;
    variant.quantityReserved += item.quantity;
    if (variant.quantityAvailable <= 0) {
      variant.availabilityStatus = 'unavailable';
    }
    variant.lastVerifiedAt = new Date().toISOString();
  }
  safeSetItem(STORAGE_KEYS.PRODUCTS, products);

  // Generate Order
  const now = new Date().toISOString();
  const orderNumber = `AAP-${Date.now().toString().slice(-6)}`;

  const order: Order = {
    id: generateId('ord'),
    orderNumber,
    customerUserId: customerUser.id,
    customerName: customerUser.displayName,
    shopId: cart.shopId,
    shopName: cart.shopName || 'Neighborhood Store',
    orderStatus: 'pending_vendor',
    paymentMethod,
    paymentStatus: paymentMethod === 'pay_at_shop' ? 'pay_at_shop_due' : 'pending',
    handoverStatus: 'not_ready',
    currency: 'INR',
    subtotalMinor: cart.subtotalMinor,
    feesMinor: 0,
    totalMinor: cart.subtotalMinor,
    items: cart.items.map((i) => ({
      id: generateId('item'),
      orderId: '',
      variantId: i.variantId,
      productNameSnapshot: i.productName,
      variantSnapshot: i.variantLabel,
      unitSnapshot: i.unit,
      quantity: i.quantity,
      unitPriceMinor: i.unitPriceMinor,
      lineTotalMinor: i.unitPriceMinor * i.quantity,
    })),
    customerNote: customerNote?.trim(),
    createdAt: now,
    updatedAt: now,
  };

  const orders = safeGetItem<Order[]>(STORAGE_KEYS.ORDERS, []);
  orders.unshift(order);
  safeSetItem(STORAGE_KEYS.ORDERS, orders);

  return { success: true, order };
}

export function updatePrototypeOrderStatus(
  orderId: string,
  newStatus: Order['orderStatus'],
  newHandoverStatus?: Order['handoverStatus'],
  newPaymentStatus?: Order['paymentStatus']
): { success: boolean; order?: Order; error?: string } {
  const orders = safeGetItem<Order[]>(STORAGE_KEYS.ORDERS, []);
  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) return { success: false, error: 'Order not found.' };

  const currentOrder = orders[index];
  const updated: Order = {
    ...currentOrder,
    orderStatus: newStatus,
    handoverStatus: newHandoverStatus || currentOrder.handoverStatus,
    paymentStatus: newPaymentStatus || currentOrder.paymentStatus,
    updatedAt: new Date().toISOString(),
  };

  orders[index] = updated;
  safeSetItem(STORAGE_KEYS.ORDERS, orders);
  return { success: true, order: updated };
}

// ============================================================================
// Vendor Payment & Operational Settings
// ============================================================================

export function getPrototypeVendorSettings(shopId: string): VendorSettings {
  const allSettings = safeGetItem<Record<string, VendorSettings>>(STORAGE_KEYS.VENDOR_SETTINGS, {});
  return (
    allSettings[shopId] || {
      acceptedPaymentMethods: ['pay_at_shop', 'online'],
      autoAcceptPickup: false,
      preparationLeadMinutes: 15,
    }
  );
}

export function updatePrototypeVendorSettings(
  shopId: string,
  updates: Partial<VendorSettings>
): VendorSettings {
  const allSettings = safeGetItem<Record<string, VendorSettings>>(STORAGE_KEYS.VENDOR_SETTINGS, {});
  const current = allSettings[shopId] || {
    acceptedPaymentMethods: ['pay_at_shop', 'online'],
    autoAcceptPickup: false,
    preparationLeadMinutes: 15,
  };

  const updated: VendorSettings = {
    ...current,
    ...updates,
  };

  allSettings[shopId] = updated;
  safeSetItem(STORAGE_KEYS.VENDOR_SETTINGS, allSettings);
  return updated;
}

export function approveVendorApplication(
  applicationId: string,
  adminUserId: string
): { success: boolean; error?: string } {
  const users = safeGetItem<StoredUser[]>(STORAGE_KEYS.USERS, []);
  const admin = users.find((u) => u.id === adminUserId);
  if (!admin || !admin.roles.includes('admin')) {
    return { success: false, error: 'Unauthorized: Only platform administrators can approve vendor applications.' };
  }

  const applications = safeGetItem<VendorApplication[]>(STORAGE_KEYS.VENDOR_APPLICATIONS, []);
  const appIndex = applications.findIndex((a) => a.id === applicationId);
  if (appIndex === -1) {
    return { success: false, error: 'Vendor application not found.' };
  }

  const application = applications[appIndex];
  application.status = 'approved';
  safeSetItem(STORAGE_KEYS.VENDOR_APPLICATIONS, applications);

  // Grant vendor role to user
  const targetUser = users.find((u) => u.id === application.userId);
  if (targetUser) {
    if (!targetUser.roles.includes('vendor')) {
      targetUser.roles.push('vendor');
      targetUser.updatedAt = new Date().toISOString();
      safeSetItem(STORAGE_KEYS.USERS, users);
    }
  }

  // Create shop if not exists
  const shops = safeGetItem<Shop[]>(STORAGE_KEYS.SHOPS, DEMO_SHOPS);
  const existingShop = shops.find((s) => s.ownerUserId === application.userId);
  if (!existingShop) {
    const newShop: Shop = {
      id: generateId('shop'),
      ownerUserId: application.userId,
      name: application.shopName,
      description: 'Newly approved neighborhood shop.',
      categoryId: 'cat-1',
      categoryName: 'Daily Groceries & Kirana',
      addressText: 'Local Jaipur Market',
      landmark: 'Main Street',
      latitude: 26.9124,
      longitude: 75.7873,
      verificationStatus: 'verified',
      availabilityStatus: 'open',
      distanceMeters: 500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    shops.push(newShop);
    safeSetItem(STORAGE_KEYS.SHOPS, shops);
  } else {
    existingShop.verificationStatus = 'verified';
    existingShop.updatedAt = new Date().toISOString();
    safeSetItem(STORAGE_KEYS.SHOPS, shops);
  }

  return { success: true };
}

export function rejectVendorApplication(
  applicationId: string,
  adminUserId: string
): { success: boolean; error?: string } {
  const users = safeGetItem<StoredUser[]>(STORAGE_KEYS.USERS, []);
  const admin = users.find((u) => u.id === adminUserId);
  if (!admin || !admin.roles.includes('admin')) {
    return { success: false, error: 'Unauthorized: Only platform administrators can reject vendor applications.' };
  }

  const applications = safeGetItem<VendorApplication[]>(STORAGE_KEYS.VENDOR_APPLICATIONS, []);
  const appIndex = applications.findIndex((a) => a.id === applicationId);
  if (appIndex === -1) {
    return { success: false, error: 'Vendor application not found.' };
  }

  applications[appIndex].status = 'rejected';
  safeSetItem(STORAGE_KEYS.VENDOR_APPLICATIONS, applications);
  return { success: true };
}
