export type VolumeMl = 250 | 500 | 1000;
export type ContainerMode = 'own' | 'reusable';
export type ContainerOption = 'own_container' | 'reusable_container';
export type ProductCategory = 'Personal Care' | 'Kitchen' | 'Home Care' | 'Laundry';

export type OrderStatus =
  | 'Order Placed'
  | 'Order Confirmed'
  | 'Preparing Refill'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'upi' | 'razorpay' | 'cod' | 'demo';

export type PaymentStatus =
  | 'pending_cod'
  | 'verification_pending'
  | 'paid_verified'
  | 'demo_confirmed'
  | 'failed';

export type AppView =
  | 'home'
  | 'catalog'
  | 'checkout'
  | 'orders'
  | 'dashboard'
  | 'admin'
  | 'auth';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  hostelOrAddress?: string;
  roomNumber?: string;
  role: 'customer' | 'admin';
  adminRequested?: boolean;
  totalOrders: number;
  totalMoneySaved: number;
  totalBottlesAvoided: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  ingredients?: string;
  scent?: string;
  imageUrl: string;
  price250ml: number;
  price500ml: number;
  price1000ml: number;
  mrpPlastic250ml: number;
  mrpPlastic500ml: number;
  mrpPlastic1000ml: number;
  stockLitres: number;
  active: boolean;
  featured: boolean;
  updatedAt?: unknown;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  imageUrl?: string;
  volumeMl: VolumeMl;
  unitPrice: number;
  plasticMrp: number;
  quantity: number;
  containerMode: ContainerMode;
  updatedAt?: unknown;
}

export interface GuestCartItem {
  id: string;
  productId: string;
  productName: string;
  imageUrl?: string;
  volumeMl: VolumeMl;
  unitPrice: number;
  plasticMrp: number;
  quantity: number;
  containerMode: ContainerMode;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  phone: string;
  hostelOrAddress: string;
  roomNumber?: string;
  createdAt?: unknown;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  phone: string;
  hostelOrAddress: string;
  roomNumber?: string;
  deliveryInstructions?: string;
  preferredDeliveryTime: string;
  containerOption: ContainerOption;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  subtotal: number;
  containerDeposit: number;
  deliveryFee: number;
  totalAmount: number;
  moneySaved: number;
  bottlesAvoided: number;
  totalLitres: number;
  itemCount: number;
  itemsSummary: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OrderItem {
  id: string;
  orderId: string;
  userId: string;
  productId: string;
  productName: string;
  imageUrl?: string;
  volumeMl: VolumeMl;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  containerMode: ContainerMode;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  userId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: 'INR';
  transactionRef?: string;
  providerNote?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SustainabilityConfig {
  plasticGramsPer500mlBottle: number;
  co2GramsPerBottle: number;
  demoBaselineRefills: number;
  demoBaselineBottlesAvoided: number;
  demoBaselineMoneySaved: number;
  updatedAt?: unknown;
}
