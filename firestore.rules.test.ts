/**
 * REFILL+ Firestore Security Rules Specification & Verification Matrix
 * Maps the "Dirty Dozen" adversarial payloads from security_spec.md
 * against DRAFT_firestore.rules / firestore.rules gates.
 */

export interface SecurityTestPayload {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
  enforcingGate: string;
}

export const dirtyDozenPayloads: SecurityTestPayload[] = [
  {
    id: 1,
    name: 'Self-Admin Registration',
    collection: '/users/user_abc',
    operation: 'create',
    payload: {
      uid: 'user_abc',
      displayName: 'Mallory',
      email: 'mallory@dgu.ac.in',
      role: 'admin',
      totalOrders: 0,
      totalMoneySaved: 0,
      totalBottlesAvoided: 0,
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: "incoming().role == 'customer' || (incoming().role == 'admin' && isBootstrappedAdmin())",
  },
  {
    id: 2,
    name: 'Role Escalation Update',
    collection: '/users/user_abc',
    operation: 'update',
    payload: { role: 'admin' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'incoming().role == existing().role && affectedKeys().hasOnly(...)',
  },
  {
    id: 3,
    name: 'Cross-User Order Read/List',
    collection: '/orders',
    operation: 'list',
    payload: { queryUserId: 'other_user_uid' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'allow list: if isAdmin() || (isVerifiedUser() && resource.data.userId == request.auth.uid)',
  },
  {
    id: 4,
    name: 'Shadow Field Injection on Cart Item',
    collection: '/cart_items/item_1',
    operation: 'create',
    payload: {
      userId: 'user_abc',
      productId: 'handwash',
      discountOverride: 999,
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'data.keys().hasOnly([...]) inside isValidCartItem()',
  },
  {
    id: 5,
    name: 'Client-Spoofed Payment Confirmation',
    collection: '/orders/order_1',
    operation: 'create',
    payload: {
      userId: 'user_abc',
      paymentStatus: 'paid_verified',
      status: 'Order Placed',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: "incoming().paymentStatus in ['pending_cod', 'verification_pending', 'demo_confirmed', 'failed']",
  },
  {
    id: 6,
    name: 'Unauthorized Product Price Tampering',
    collection: '/products/handwash',
    operation: 'update',
    payload: { price500ml: 1 },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'allow update: if isValidId(productId) && isAdmin()',
  },
  {
    id: 7,
    name: 'Unverified Email Spoof',
    collection: '/products/handwash',
    operation: 'create',
    payload: { authTokenEmailVerified: false, email: 'aprajita.0251mba469@dgu.ac.in' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'isVerifiedUser() requires request.auth.token.email_verified == true',
  },
  {
    id: 8,
    name: 'Path ID Poisoning',
    collection: '/cart_items/' + 'x'.repeat(200),
    operation: 'create',
    payload: { userId: 'user_abc' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: "isValidId(id) enforces size() <= 128 && matches('^[a-zA-Z0-9_\\\\-]+$')",
  },
  {
    id: 9,
    name: 'Terminal Order Mutation',
    collection: '/orders/delivered_order_1',
    operation: 'update',
    payload: { status: 'Cancelled' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: "existing().status in ['Order Placed', 'Order Confirmed']",
  },
  {
    id: 10,
    name: 'Immortal Timestamp Tampering',
    collection: '/orders/order_2',
    operation: 'create',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'incoming().createdAt == request.time && incoming().updatedAt == request.time',
  },
  {
    id: 11,
    name: 'Orphaned Order Item Write',
    collection: '/orders/nonexistent_order/order_items/item1',
    operation: 'create',
    payload: { orderId: 'nonexistent_order', userId: 'user_abc' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'exists(/orders/$(orderId)) || existsAfter(/orders/$(orderId))',
  },
  {
    id: 12,
    name: 'Blanket User List Scraping',
    collection: '/users',
    operation: 'list',
    payload: {},
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'allow list: if isAdmin()',
  },
];
