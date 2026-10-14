/**
 * Unit Test Suite: Payment State Transition Legality
 */

import { canTransitionPaymentStatus } from '../../src/services/payments/index.ts';

function runPaymentTests() {
  console.log('[TEST] Running Payment State Machine Unit Tests...');

  // Pay-at-shop legal transition: pay_at_shop_due -> pay_at_shop_paid
  if (!canTransitionPaymentStatus('pay_at_shop_due', 'pay_at_shop_paid', 'pay_at_shop')) {
    throw new Error('Expected legal transition for pay-at-shop payment');
  }
  console.log('  ✓ canTransitionPaymentStatus: pay_at_shop_due -> pay_at_shop_paid is LEGAL');

  // Customer cannot transition pay-at-shop from pending to paid directly
  if (canTransitionPaymentStatus('not_required_yet', 'pay_at_shop_paid', 'pay_at_shop')) {
    throw new Error('Illegal transition permitted');
  }
  console.log('  ✓ canTransitionPaymentStatus: not_required_yet -> pay_at_shop_paid is REJECTED');

  // Online payments: pending -> paid is legal
  if (!canTransitionPaymentStatus('pending', 'paid', 'online')) {
    throw new Error('Expected legal transition for online payment');
  }
  console.log('  ✓ canTransitionPaymentStatus: pending -> paid is LEGAL for online');

  // Online payments: not_required_yet -> paid directly is illegal without provider session
  if (canTransitionPaymentStatus('not_required_yet', 'paid', 'online')) {
    throw new Error('Illegal direct transition without pending state');
  }
  console.log('  ✓ canTransitionPaymentStatus: not_required_yet -> paid is REJECTED for online');

  console.log('[TEST] All Payment State Unit Tests Passed.\n');
}

runPaymentTests();
