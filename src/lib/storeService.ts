import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  SEED_PRODUCTS,
  SEED_SUSTAINABILITY_CONFIG,
} from '../data/seedCatalog.ts';
import type {
  Address,
  CartItem,
  ContainerMode,
  ContainerOption,
  GuestCartItem,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
  Product,
  SustainabilityConfig,
  UserProfile,
  VolumeMl,
} from '../types.ts';
import { db, handleFirestoreError, OperationType } from './firebase.ts';

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120);
  return cleaned || `id_${Date.now()}`;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      result[k] = v;
    }
  }
  return result as T;
}

export function isBootstrappedAdminEmail(email?: string | null): boolean {
  return Boolean(email && email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase());
}

export async function syncUserProfile(
  fbUser: FirebaseUser,
  options?: { displayName?: string; phone?: string; adminRequested?: boolean }
): Promise<UserProfile> {
  const path = `users/${fbUser.uid}`;
  const ref = doc(db, 'users', fbUser.uid);
  const isBootstrap = isBootstrappedAdminEmail(fbUser.email) && fbUser.emailVerified;

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const profilePayload = stripUndefined({
        uid: fbUser.uid,
        displayName: (
          options?.displayName ||
          fbUser.displayName ||
          fbUser.email?.split('@')[0] ||
          'Campus Member'
        ).slice(0, 100),
        email: (fbUser.email || 'unknown@dgu.ac.in').slice(0, 150),
        phone: options?.phone ? options.phone.slice(0, 20) : undefined,
        role: isBootstrap ? ('admin' as const) : ('customer' as const),
        adminRequested: options?.adminRequested ? true : undefined,
        totalOrders: 0,
        totalMoneySaved: 0,
        totalBottlesAvoided: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(ref, profilePayload);
      const fresh = await getDoc(ref);
      return fresh.data() as UserProfile;
    }

    const existing = snap.data() as UserProfile;
    if (options?.adminRequested && !existing.adminRequested) {
      await updateDoc(ref, {
        adminRequested: true,
        updatedAt: serverTimestamp(),
      });
    }
    return existing;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateUserProfile(
  uid: string,
  updates: {
    displayName?: string;
    phone?: string;
    hostelOrAddress?: string;
    roomNumber?: string;
    adminRequested?: boolean;
  }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    const ref = doc(db, 'users', uid);
    const payload = stripUndefined({
      displayName: updates.displayName?.trim().slice(0, 100),
      phone: updates.phone?.trim().slice(0, 20),
      hostelOrAddress: updates.hostelOrAddress?.trim().slice(0, 250),
      roomNumber: updates.roomNumber?.trim().slice(0, 40),
      adminRequested: updates.adminRequested,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(ref, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void
): Unsubscribe {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      onData(snap.exists() ? (snap.data() as UserProfile) : null);
    },
    (err) => handleFirestoreError(err, OperationType.GET, path)
  );
}

export function subscribeAdminStatus(
  uid: string,
  email: string | null | undefined,
  emailVerified: boolean,
  onStatus: (isAdmin: boolean) => void
): Unsubscribe {
  if (isBootstrappedAdminEmail(email) && emailVerified) {
    onStatus(true);
    return () => {};
  }
  const path = `admins/${uid}`;
  return onSnapshot(
    doc(db, 'admins', uid),
    (snap) => {
      onStatus(snap.exists() && emailVerified);
    },
    () => {
      onStatus(false);
    }
  );
}

export function subscribeProducts(
  onData: (products: Product[], fromDatabase: boolean) => void
): Unsubscribe {
  const path = 'products';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      if (snap.empty) {
        onData(SEED_PRODUCTS, false);
        return;
      }
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
      onData(list, true);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function seedDefaultCatalog(): Promise<void> {
  const batch = writeBatch(db);
  for (const prod of SEED_PRODUCTS) {
    const ref = doc(db, 'products', prod.id);
    const { id: _id, ...rest } = prod;
    batch.set(ref, {
      ...rest,
      updatedAt: serverTimestamp(),
    });
  }
  batch.set(doc(db, 'settings', 'sustainability'), {
    ...SEED_SUSTAINABILITY_CONFIG,
    updatedAt: serverTimestamp(),
  });
  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'products');
  }
}

export async function saveProduct(product: Product): Promise<void> {
  const id = sanitizeId(product.id || `prod_${Date.now()}`);
  const path = `products/${id}`;
  try {
    const payload = stripUndefined({
      name: product.name.trim().slice(0, 100),
      category: product.category,
      description: product.description.trim().slice(0, 600),
      ingredients: product.ingredients?.trim().slice(0, 300) || undefined,
      scent: product.scent?.trim().slice(0, 80) || undefined,
      imageUrl: product.imageUrl.trim().slice(0, 500),
      price250ml: Number(product.price250ml),
      price500ml: Number(product.price500ml),
      price1000ml: Number(product.price1000ml),
      mrpPlastic250ml: Number(product.mrpPlastic250ml),
      mrpPlastic500ml: Number(product.mrpPlastic500ml),
      mrpPlastic1000ml: Number(product.mrpPlastic1000ml),
      stockLitres: Number(product.stockLitres),
      active: Boolean(product.active),
      featured: Boolean(product.featured),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'products', id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeCart(
  uid: string,
  onData: (items: CartItem[]) => void
): Unsubscribe {
  const path = 'cart_items';
  const q = query(collection(db, path), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CartItem, 'id'>),
      }));
      onData(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function upsertCartItem(
  uid: string,
  item: {
    productId: string;
    productName: string;
    imageUrl?: string;
    volumeMl: VolumeMl;
    unitPrice: number;
    plasticMrp: number;
    quantity: number;
    containerMode: ContainerMode;
  }
): Promise<void> {
  const cartDocId = sanitizeId(`${uid}_${item.productId}_${item.volumeMl}_${item.containerMode}`);
  const path = `cart_items/${cartDocId}`;
  try {
    const ref = doc(db, 'cart_items', cartDocId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const prev = snap.data() as CartItem;
      const nextQty = Math.min(50, prev.quantity + item.quantity);
      await updateDoc(ref, {
        volumeMl: item.volumeMl,
        unitPrice: item.unitPrice,
        plasticMrp: item.plasticMrp,
        quantity: nextQty,
        containerMode: item.containerMode,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        ref,
        stripUndefined({
          userId: uid,
          productId: sanitizeId(item.productId),
          productName: item.productName.slice(0, 100),
          imageUrl: item.imageUrl?.slice(0, 500),
          volumeMl: item.volumeMl,
          unitPrice: item.unitPrice,
          plasticMrp: item.plasticMrp,
          quantity: Math.min(50, Math.max(1, item.quantity)),
          containerMode: item.containerMode,
          updatedAt: serverTimestamp(),
        })
      );
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateCartItem(
  cartItemId: string,
  updates: {
    volumeMl: VolumeMl;
    unitPrice: number;
    plasticMrp: number;
    quantity: number;
    containerMode: ContainerMode;
  }
): Promise<void> {
  const path = `cart_items/${cartItemId}`;
  try {
    await updateDoc(doc(db, 'cart_items', cartItemId), {
      volumeMl: updates.volumeMl,
      unitPrice: updates.unitPrice,
      plasticMrp: updates.plasticMrp,
      quantity: Math.min(50, Math.max(1, updates.quantity)),
      containerMode: updates.containerMode,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function removeCartItem(cartItemId: string): Promise<void> {
  const path = `cart_items/${cartItemId}`;
  try {
    await deleteDoc(doc(db, 'cart_items', cartItemId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function syncGuestCartToFirestore(
  uid: string,
  guestItems: GuestCartItem[]
): Promise<void> {
  for (const g of guestItems) {
    await upsertCartItem(uid, {
      productId: g.productId,
      productName: g.productName,
      imageUrl: g.imageUrl,
      volumeMl: g.volumeMl,
      unitPrice: g.unitPrice,
      plasticMrp: g.plasticMrp,
      quantity: g.quantity,
      containerMode: g.containerMode,
    });
  }
}

export function subscribeAddresses(
  uid: string,
  onData: (addresses: Address[]) => void
): Unsubscribe {
  const path = 'addresses';
  const q = query(collection(db, path), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Address, 'id'>) })));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function createAddress(
  uid: string,
  input: {
    label: string;
    recipientName: string;
    phone: string;
    hostelOrAddress: string;
    roomNumber?: string;
  }
): Promise<void> {
  const id = sanitizeId(`addr_${uid.slice(0, 12)}_${Date.now()}`);
  const path = `addresses/${id}`;
  try {
    await setDoc(
      doc(db, 'addresses', id),
      stripUndefined({
        userId: uid,
        label: input.label.trim().slice(0, 60),
        recipientName: input.recipientName.trim().slice(0, 100),
        phone: input.phone.trim().slice(0, 20),
        hostelOrAddress: input.hostelOrAddress.trim().slice(0, 250),
        roomNumber: input.roomNumber?.trim().slice(0, 40) || undefined,
        createdAt: serverTimestamp(),
      })
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function deleteAddress(addressId: string): Promise<void> {
  const path = `addresses/${addressId}`;
  try {
    await deleteDoc(doc(db, 'addresses', addressId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function placeRefillOrder(params: {
  user: UserProfile;
  items: CartItem[];
  customerName: string;
  phone: string;
  hostelOrAddress: string;
  roomNumber?: string;
  deliveryInstructions?: string;
  preferredDeliveryTime: string;
  containerOption: ContainerOption;
  paymentMethod: PaymentMethod;
  paymentStatus: Exclude<PaymentStatus, 'paid_verified'>;
  transactionRef?: string;
  providerNote?: string;
  subtotal: number;
  containerDeposit: number;
  deliveryFee: number;
  totalAmount: number;
  moneySaved: number;
  bottlesAvoided: number;
  totalLitres: number;
}): Promise<{ orderId: string; orderNumber: string }> {
  const orderId = sanitizeId(`ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const orderNumber = `RFL-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
  const paymentId = sanitizeId(`pay_${orderId}`);
  const itemCount = params.items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsSummary = params.items
    .map((item) => `${item.productName} (${item.volumeMl}ml × ${item.quantity})`)
    .join(', ')
    .slice(0, 400);

  const batch = writeBatch(db);

  // 1. Create Order document
  const orderRef = doc(db, 'orders', orderId);
  batch.set(
    orderRef,
    stripUndefined({
      userId: params.user.uid,
      orderNumber,
      customerName: params.customerName.trim().slice(0, 100),
      customerEmail: params.user.email.slice(0, 150),
      phone: params.phone.trim().slice(0, 20),
      hostelOrAddress: params.hostelOrAddress.trim().slice(0, 250),
      roomNumber: params.roomNumber?.trim().slice(0, 40) || undefined,
      deliveryInstructions: params.deliveryInstructions?.trim().slice(0, 300) || undefined,
      preferredDeliveryTime: params.preferredDeliveryTime.slice(0, 80),
      containerOption: params.containerOption,
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentStatus,
      status: 'Order Placed' as OrderStatus,
      subtotal: params.subtotal,
      containerDeposit: params.containerDeposit,
      deliveryFee: params.deliveryFee,
      totalAmount: params.totalAmount,
      moneySaved: params.moneySaved,
      bottlesAvoided: params.bottlesAvoided,
      totalLitres: Number(params.totalLitres.toFixed(2)),
      itemCount,
      itemsSummary: itemsSummary || 'Refill items',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );

  // 2. Create Order Items subcollection documents
  params.items.forEach((item, index) => {
    const itemId = sanitizeId(`item_${index + 1}_${item.productId}`);
    const itemRef = doc(db, 'orders', orderId, 'order_items', itemId);
    batch.set(
      itemRef,
      stripUndefined({
        orderId,
        userId: params.user.uid,
        productId: sanitizeId(item.productId),
        productName: item.productName.slice(0, 100),
        imageUrl: item.imageUrl?.slice(0, 500),
        volumeMl: item.volumeMl,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.unitPrice * item.quantity,
        containerMode: item.containerMode,
      })
    );
  });

  // 3. Create Payment record
  batch.set(
    doc(db, 'payments', paymentId),
    stripUndefined({
      orderId,
      userId: params.user.uid,
      method: params.paymentMethod,
      status: params.paymentStatus,
      amount: params.totalAmount,
      currency: 'INR' as const,
      transactionRef: params.transactionRef?.trim().slice(0, 120) || undefined,
      providerNote: params.providerNote?.trim().slice(0, 200) || undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );

  // 4. Delete cart items for this order
  for (const item of params.items) {
    if (item.id && !item.id.startsWith('guest_')) {
      batch.delete(doc(db, 'cart_items', item.id));
    }
  }

  // 5. Update user cumulative sustainability counters (only if payment did not immediately fail)
  if (params.paymentStatus !== 'failed') {
    batch.update(doc(db, 'users', params.user.uid), {
      totalOrders: (params.user.totalOrders || 0) + 1,
      totalMoneySaved: Math.round((params.user.totalMoneySaved || 0) + params.moneySaved),
      totalBottlesAvoided: Number(((params.user.totalBottlesAvoided || 0) + params.bottlesAvoided).toFixed(1)),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
    return { orderId, orderNumber };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
  }
}

export function subscribeUserOrders(
  uid: string,
  onData: (orders: Order[]) => void
): Unsubscribe {
  const path = 'orders';
  const q = query(collection(db, path), where('userId', '==', uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) })));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeAllOrders(onData: (orders: Order[]) => void): Unsubscribe {
  const path = 'orders';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) })));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const path = `orders/${orderId}/order_items`;
  try {
    const snap = await getDocs(collection(db, 'orders', orderId, 'order_items'));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<OrderItem, 'id'>) }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function cancelOrderByCustomer(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'Cancelled' as OrderStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function updateOrderByAdmin(
  orderId: string,
  updates: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    preferredDeliveryTime?: string;
    deliveryInstructions?: string;
  }
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(
      doc(db, 'orders', orderId),
      stripUndefined({
        status: updates.status,
        paymentStatus: updates.paymentStatus,
        preferredDeliveryTime: updates.preferredDeliveryTime?.slice(0, 80),
        deliveryInstructions: updates.deliveryInstructions?.slice(0, 300),
        updatedAt: serverTimestamp(),
      })
    );
    if (updates.paymentStatus) {
      const paymentId = sanitizeId(`pay_${orderId}`);
      const paySnap = await getDoc(doc(db, 'payments', paymentId));
      if (paySnap.exists()) {
        await updateDoc(doc(db, 'payments', paymentId), {
          status: updates.paymentStatus,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeAllPayments(onData: (payments: PaymentRecord[]) => void): Unsubscribe {
  const path = 'payments';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PaymentRecord, 'id'>) })));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function fetchAllUsers(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => d.data() as UserProfile);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function grantAdminAccess(
  targetUser: UserProfile,
  grantedByEmail: string
): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, 'admins', targetUser.uid), {
    uid: targetUser.uid,
    email: targetUser.email,
    grantedBy: grantedByEmail.slice(0, 150),
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, 'users', targetUser.uid), {
    role: 'admin',
    adminRequested: false,
    updatedAt: serverTimestamp(),
  });
  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `admins/${targetUser.uid}`);
  }
}

export async function revokeAdminAccess(targetUid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'admins', targetUid));
  batch.update(doc(db, 'users', targetUid), {
    role: 'customer',
    updatedAt: serverTimestamp(),
  });
  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `admins/${targetUid}`);
  }
}

export function subscribeSustainabilityConfig(
  onData: (config: SustainabilityConfig, fromDatabase: boolean) => void
): Unsubscribe {
  const path = 'settings/sustainability';
  return onSnapshot(
    doc(db, 'settings', 'sustainability'),
    (snap) => {
      if (!snap.exists()) {
        onData(SEED_SUSTAINABILITY_CONFIG, false);
        return;
      }
      onData(snap.data() as SustainabilityConfig, true);
    },
    () => {
      onData(SEED_SUSTAINABILITY_CONFIG, false);
    }
  );
}

export async function updateSustainabilityConfig(config: SustainabilityConfig): Promise<void> {
  const path = 'settings/sustainability';
  try {
    await setDoc(doc(db, 'settings', 'sustainability'), {
      plasticGramsPer500mlBottle: Number(config.plasticGramsPer500mlBottle),
      co2GramsPerBottle: Number(config.co2GramsPerBottle),
      demoBaselineRefills: Number(config.demoBaselineRefills),
      demoBaselineBottlesAvoided: Number(config.demoBaselineBottlesAvoided),
      demoBaselineMoneySaved: Number(config.demoBaselineMoneySaved),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
