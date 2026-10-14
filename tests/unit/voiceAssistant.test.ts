/**
 * Comprehensive Unit Test Suite: NUKKAD Voice Assistant
 *
 * Verifies:
 * 1. Command parsing for all supported vendor commands in English & Hindi:
 *    - Add products (with name, price, unit, initial stock)
 *    - Update inventory (stock change, residual 'only X left')
 *    - Update prices
 *    - Queries (show products, check low stock, show orders, order lookup, shop status)
 *    - Shop status toggle (pause/resume)
 *    - Order status update (mark ready for pickup)
 * 2. Intelligent product matching:
 *    - Exact and case-insensitive matching
 *    - Stemming (tomatoes -> tomato, apples -> apple)
 *    - Multilingual matching with Hindi names in parentheses
 *    - Ambiguity detection (never guessing when multiple products match)
 *    - Not found handling
 * 3. Safe command execution and data integrity against prototypeStorage:
 *    - Adding products via existing storage service
 *    - Updating stock and availability status
 *    - Updating product prices
 *    - Pausing and resuming shop
 *    - Order status transitions with workflow validation
 *    - Role / ownership authorization checks
 */

import {
  parseCommand,
  matchVendorProduct,
  cleanText,
  normalizeUnit,
} from '../../src/services/voice/voiceAssistantService.ts';
import {
  initializePrototypeStore,
  getPrototypeProducts,
  getPrototypeShops,
  getPrototypeOrders,
  addPrototypeProduct,
  updatePrototypeProduct,
  updatePrototypeShop,
  updatePrototypeOrderStatus,
  safeGetItem,
} from '../../src/services/storage/prototypeStorage.ts';
import { Product, Shop, Order } from '../../src/types/index.ts';

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

async function runVoiceAssistantTests() {
  console.log('[TEST] Running NUKKAD Voice Assistant Unit Tests...');
  let passed = 0;
  let total = 0;

  const assert = (condition: boolean | undefined | null, testName: string, detail?: string) => {
    total++;
    if (Boolean(condition)) {
      console.log(`  ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    }
  };

  // =========================================================================
  // 1. Command Parsing Tests
  // =========================================================================
  console.log('\n--- 1. Command Parsing: Add Product ---');
  {
    const res1 = parseCommand('Add tomatoes at 40 rupees per kilo with 20 kilos in stock.');
    assert(
      res1.action === 'add_product' &&
        res1.params.productName?.toLowerCase().includes('tomato') &&
        res1.params.price === 40 &&
        res1.params.unit === 'kg' &&
        res1.params.quantity === 20 &&
        res1.requiresConfirmation === true,
      'Add tomatoes with price, unit, and stock'
    );

    const res2 = parseCommand('Add a product called rice, price 60 rupees per packet, stock 15 packets.');
    assert(
      res2.action === 'add_product' &&
        res2.params.productName?.toLowerCase().includes('rice') &&
        res2.params.price === 60 &&
        res2.params.unit === 'packet' &&
        res2.params.quantity === 15,
      'Add a product called rice with comma-separated clauses'
    );

    const res3 = parseCommand('Add a product named tomatoes at ₹40 per kilo.');
    assert(
      res3.action === 'add_product' &&
        res3.params.productName?.toLowerCase().includes('tomato') &&
        res3.params.price === 40 &&
        res3.params.unit === 'kg',
      'Add product named tomatoes with currency symbol ₹'
    );

    const res4 = parseCommand('नया उत्पाद जोड़ो टमाटर भाव 40 रुपये प्रति किलो 20 किलो स्टॉक');
    assert(
      res4.action === 'add_product' &&
        res4.params.price === 40 &&
        res4.params.quantity === 20,
      'Add product in Hindi (नया उत्पाद जोड़ो)'
    );
  }

  console.log('\n--- 2. Command Parsing: Update Inventory & Stock ---');
  {
    const res1 = parseCommand('Change tomato stock to 10 kilos.');
    assert(
      res1.action === 'update_stock' &&
        res1.params.productName?.toLowerCase().includes('tomato') &&
        res1.params.quantity === 10 &&
        res1.params.unit === 'kg' &&
        res1.requiresConfirmation === true,
      'Change tomato stock to 10 kilos'
    );

    const res2 = parseCommand('Set rice stock to 15 packets.');
    assert(
      res2.action === 'update_stock' &&
        res2.params.productName?.toLowerCase().includes('rice') &&
        res2.params.quantity === 15 &&
        res2.params.unit === 'packet',
      'Set rice stock to 15 packets'
    );

    const res3 = parseCommand('I have only 5 milk packets left.');
    assert(
      res3.action === 'update_stock' &&
        res3.params.productName?.toLowerCase().includes('milk') &&
        res3.params.quantity === 5 &&
        res3.params.unit === 'packet',
      'Residual stock: I have only 5 milk packets left'
    );

    const res4 = parseCommand('Update rice to 15');
    assert(
      res4.action === 'update_stock' &&
        res4.params.productName === 'rice' &&
        res4.params.quantity === 15,
      'Shorthand update rice to 15'
    );

    const res5 = parseCommand('टमाटर का स्टॉक 10 किलो करो');
    assert(
      res5.action === 'update_stock' &&
        res5.params.quantity === 10 &&
        res5.params.unit === 'kg',
      'Hindi update stock: टमाटर का स्टॉक 10 किलो करो'
    );
  }

  console.log('\n--- 3. Command Parsing: Update Prices ---');
  {
    const res1 = parseCommand('Change the price of apples to 120 rupees per kilo.');
    assert(
      res1.action === 'change_price' &&
        res1.params.productName?.toLowerCase().includes('apple') &&
        res1.params.price === 120 &&
        res1.params.unit === 'kg' &&
        res1.requiresConfirmation === true,
      'Change the price of apples to 120 rupees per kilo'
    );

    const res2 = parseCommand('Set rice price to 65 rupees per packet.');
    assert(
      res2.action === 'change_price' &&
        res2.params.productName?.toLowerCase().includes('rice') &&
        res2.params.price === 65 &&
        res2.params.unit === 'packet',
      'Set rice price to 65 rupees per packet'
    );

    const res3 = parseCommand('Change apple price to 120');
    assert(
      res3.action === 'change_price' &&
        res3.params.productName?.toLowerCase().includes('apple') &&
        res3.params.price === 120,
      'Change apple price to 120'
    );

    const res4 = parseCommand('सेब का दाम 120 रुपये प्रति किलो करो');
    assert(
      res4.action === 'change_price' &&
        res4.params.price === 120,
      'Hindi price update: सेब का दाम 120 रुपये प्रति किलो करो'
    );
  }

  console.log('\n--- 4. Command Parsing: Queries & Shop Status ---');
  {
    const res1 = parseCommand('Show my products.');
    assert(res1.action === 'show_products' && !res1.requiresConfirmation, 'Show my products');

    const res2 = parseCommand('Check low stock.');
    assert(res2.action === 'check_stock' && !res2.requiresConfirmation, 'Check low stock');

    const res3 = parseCommand('How many products are low in stock?');
    assert(res3.action === 'check_stock', 'How many products are low in stock?');

    const res4 = parseCommand('Show my new orders.');
    assert(res4.action === 'show_orders' && !res4.requiresConfirmation, 'Show my new orders');

    const res5 = parseCommand('Lookup order AAP-123456');
    assert(
      res5.action === 'lookup_order' &&
        res5.params.orderId?.toLowerCase().includes('123456'),
      'Lookup order AAP-123456 preserves order ID'
    );

    const res6 = parseCommand('Pause my shop.');
    assert(res6.action === 'pause_shop' && res6.requiresConfirmation, 'Pause my shop requires confirmation');

    const res7 = parseCommand('Resume my shop.');
    assert(res7.action === 'resume_shop' && res7.requiresConfirmation, 'Resume my shop requires confirmation');

    const res8 = parseCommand('Mark order AAP-123456 as ready for pickup.');
    assert(
      res8.action === 'mark_order_ready' &&
        res8.params.orderId?.toLowerCase().includes('123456') &&
        res8.requiresConfirmation,
      'Mark order ready for pickup parses ID and requires confirmation'
    );

    const res9 = parseCommand('दुकान बंद करो');
    assert(res9.action === 'pause_shop', 'Hindi shop pause: दुकान बंद करो');

    const res10 = parseCommand('दुकान खोलो');
    assert(res10.action === 'resume_shop', 'Hindi shop resume: दुकान खोलो');
  }

  // =========================================================================
  // 5. Intelligent Product Matching Tests
  // =========================================================================
  console.log('\n--- 5. Product Matching Intelligence ---');
  {
    const mockCatalog: Product[] = [
      {
        id: 'p1',
        shopId: 's1',
        shopName: 'Test Shop',
        categoryId: 'cat-1',
        name: 'Fresh Red Tomatoes (ताज़ा टमाटर)',
        description: 'Farm fresh red tomatoes',
        status: 'active',
        variants: [
          {
            id: 'v1',
            productId: 'p1',
            variantLabel: 'Standard',
            unit: 'kg',
            priceMinor: 4000,
            currency: 'INR',
            quantityAvailable: 25,
            quantityReserved: 0,
            availabilityStatus: 'available',
            lastVerifiedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'p2',
        shopId: 's1',
        shopName: 'Test Shop',
        categoryId: 'cat-1',
        name: 'Organic Basmati Rice (बासमती चावल)',
        description: 'Aged aromatic basmati rice',
        status: 'active',
        variants: [
          {
            id: 'v2',
            productId: 'p2',
            variantLabel: 'Standard',
            unit: 'packet',
            priceMinor: 11000,
            currency: 'INR',
            quantityAvailable: 15,
            quantityReserved: 0,
            availabilityStatus: 'available',
            lastVerifiedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'p3',
        shopId: 's1',
        shopName: 'Test Shop',
        categoryId: 'cat-1',
        name: 'Brown Rice',
        description: 'Healthy whole grain brown rice',
        status: 'active',
        variants: [
          {
            id: 'v3',
            productId: 'p3',
            variantLabel: 'Standard',
            unit: 'packet',
            priceMinor: 12000,
            currency: 'INR',
            quantityAvailable: 8,
            quantityReserved: 0,
            availabilityStatus: 'available',
            lastVerifiedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'p4',
        shopId: 's1',
        shopName: 'Test Shop',
        categoryId: 'cat-1',
        name: 'Fresh Cow Milk (ताज़ा गाय का दूध)',
        description: 'Pure pasteurized cow milk',
        status: 'active',
        variants: [
          {
            id: 'v4',
            productId: 'p4',
            variantLabel: 'Standard',
            unit: 'packet',
            priceMinor: 3000,
            currency: 'INR',
            quantityAvailable: 5,
            quantityReserved: 0,
            availabilityStatus: 'available',
            lastVerifiedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Single product matches (stemmed & singular/plural)
    const match1 = matchVendorProduct('tomato', mockCatalog);
    assert(match1.status === 'exact' && match1.product?.id === 'p1', 'Matches singular "tomato" to "Fresh Red Tomatoes"');

    const match2 = matchVendorProduct('tomatoes', mockCatalog);
    assert(match2.status === 'exact' && match2.product?.id === 'p1', 'Matches plural "tomatoes" to "Fresh Red Tomatoes"');

    // Multilingual parenthetical matching
    const matchHindi = matchVendorProduct('दूध', mockCatalog);
    assert(matchHindi.status === 'exact' && matchHindi.product?.id === 'p4', 'Matches Hindi "दूध" to "Fresh Cow Milk (ताज़ा गाय का दूध)"');

    // Ambiguous matching (two rice products in catalog)
    const matchAmbiguous = matchVendorProduct('rice', mockCatalog);
    assert(
      matchAmbiguous.status === 'ambiguous' &&
        matchAmbiguous.matches?.length === 2,
      'Never guesses when ambiguous: "rice" matches both Basmati and Brown Rice'
    );

    // Specific match resolving ambiguity
    const matchSpecific = matchVendorProduct('basmati rice', mockCatalog);
    assert(matchSpecific.status === 'exact' && matchSpecific.product?.id === 'p2', 'Resolves to Basmati Rice when specified');

    // Non-existent product
    const matchNone = matchVendorProduct('pineapple', mockCatalog);
    assert(matchNone.status === 'not_found', 'Correctly returns not_found for unlisted item');
  }

  // =========================================================================
  // 6. End-to-End Application Storage Operations
  // =========================================================================
  console.log('\n--- 6. End-to-End Storage Operations ---');
  {
    await initializePrototypeStore();
    const vendorUserId = 'vendor-user-test-1';
    const shopId = 'shop-voice-test';

    // Seed test shop
    const shops = getPrototypeShops();
    const testShop: Shop = {
      id: shopId,
      ownerUserId: vendorUserId,
      name: 'Sharma Kirana Store',
      description: 'Local neighborhood grocery',
      categoryId: 'cat-1',
      categoryName: 'Daily Groceries',
      addressText: 'Jaipur Bazaar',
      landmark: 'Near City Clock',
      latitude: 26.9124,
      longitude: 75.7873,
      verificationStatus: 'verified',
      availabilityStatus: 'open',
      distanceMeters: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    shops.push(testShop);
    window.localStorage.setItem('aaspass_proto_shops_v2', JSON.stringify(shops));

    // Test 1: Add product via voice service
    const addRes = addPrototypeProduct(
      shopId,
      {
        name: 'Fresh Farm Tomatoes',
        description: 'Locally grown tomatoes',
        categoryId: 'cat-1',
        price: 40,
        unit: 'kg',
        quantity: 20,
      },
      vendorUserId
    );
    assert(addRes.success && addRes.product !== undefined, 'addPrototypeProduct persists new item');

    const addedPrdId = addRes.product!.id;
    const allProducts = getPrototypeProducts();
    const savedPrd = allProducts.find((p) => p.id === addedPrdId);
    assert(
      savedPrd?.variants[0]?.priceMinor === 4000 &&
        savedPrd?.variants[0]?.quantityAvailable === 20 &&
        savedPrd?.variants[0]?.unit === 'kg',
      'Saved product has correct price ₹40, stock 20 kg'
    );

    // Test 2: Update stock quantity
    const stockRes = updatePrototypeProduct(
      addedPrdId,
      { quantity: 12, unit: 'kg' },
      vendorUserId
    );
    assert(stockRes.success, 'updatePrototypeProduct updates stock');
    const updatedPrd = getPrototypeProducts().find((p) => p.id === addedPrdId);
    assert(
      updatedPrd?.variants[0]?.quantityAvailable === 12 &&
        updatedPrd?.variants[0]?.availabilityStatus === 'available',
      'Stock updated to 12 kg and marked available'
    );

    // Test 3: Deplete stock to 0 -> marked unavailable
    const zeroStockRes = updatePrototypeProduct(
      addedPrdId,
      { quantity: 0 },
      vendorUserId
    );
    assert(zeroStockRes.success, 'updatePrototypeProduct allows setting 0 stock');
    const zeroPrd = getPrototypeProducts().find((p) => p.id === addedPrdId);
    assert(
      zeroPrd?.variants[0]?.quantityAvailable === 0 &&
        zeroPrd?.variants[0]?.availabilityStatus === 'unavailable',
      'Zero stock automatically sets availabilityStatus to unavailable'
    );

    // Test 4: Update price
    const priceRes = updatePrototypeProduct(
      addedPrdId,
      { price: 45 },
      vendorUserId
    );
    assert(priceRes.success, 'updatePrototypeProduct updates price');
    const priceUpdatedPrd = getPrototypeProducts().find((p) => p.id === addedPrdId);
    assert(
      priceUpdatedPrd?.variants[0]?.priceMinor === 4500,
      'Price updated to ₹45.00 (4500 minor)'
    );

    // Test 5: Pause and Resume shop
    const pauseRes = updatePrototypeShop(shopId, { availabilityStatus: 'closed' }, vendorUserId);
    assert(pauseRes.success, 'updatePrototypeShop pauses shop');
    const pausedShop = getPrototypeShops().find((s) => s.id === shopId);
    assert(pausedShop?.availabilityStatus === 'closed', 'Shop status is closed');

    const resumeRes = updatePrototypeShop(shopId, { availabilityStatus: 'open' }, vendorUserId);
    assert(resumeRes.success, 'updatePrototypeShop resumes shop');
    const openShop = getPrototypeShops().find((s) => s.id === shopId);
    assert(openShop?.availabilityStatus === 'open', 'Shop status is open');

    // Test 6: Order status update (pending_vendor -> ready_for_pickup)
    const testOrder: Order = {
      id: 'ord-voice-test-1',
      orderNumber: 'AAP-999888',
      customerUserId: 'cust-1',
      customerName: 'Aditi Yadav',
      shopId,
      shopName: 'Sharma Kirana Store',
      orderStatus: 'pending_vendor',
      paymentMethod: 'pay_at_shop',
      paymentStatus: 'pay_at_shop_due',
      handoverStatus: 'not_ready',
      currency: 'INR',
      subtotalMinor: 4500,
      feesMinor: 0,
      totalMinor: 4500,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const orders = safeGetItem<Order[]>('aaspass_proto_orders_v2', []);
    orders.unshift(testOrder);
    window.localStorage.setItem('aaspass_proto_orders_v2', JSON.stringify(orders));

    const orderReadyRes = updatePrototypeOrderStatus(testOrder.id, 'ready_for_pickup', 'ready');
    assert(orderReadyRes.success, 'updatePrototypeOrderStatus advances status to ready_for_pickup');
    const updatedOrder = getPrototypeOrders().find((o) => o.id === testOrder.id);
    assert(
      updatedOrder?.orderStatus === 'ready_for_pickup' &&
        updatedOrder?.handoverStatus === 'ready',
      'Order status is ready_for_pickup and handover is ready'
    );

    // Test 7: Authorization Protection (unauthorized actor blocked)
    const unauthorizedUserId = 'stranger-user-999';
    const unauthorizedRes = updatePrototypeProduct(
      addedPrdId,
      { quantity: 999 },
      unauthorizedUserId
    );
    assert(
      unauthorizedRes.success === false,
      'Unauthorized user blocked from updating vendor product'
    );
  }

  console.log(`\n========================================`);
  console.log(`Voice Assistant Test Suite: ${passed}/${total} Passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runVoiceAssistantTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
