export type UserRole = 'customer' | 'vendor' | 'admin';

export type Language = 'en' | 'hi';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  preferredLanguage: Language;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
}

export type ShopVerificationStatus = 'draft' | 'pending' | 'verified' | 'rejected' | 'suspended';
export type ShopAvailabilityStatus = 'open' | 'closed' | 'temporarily_unavailable';

export interface ShopHours {
  id: string;
  shopId: string;
  weekday: number; // 0 = Sunday, 6 = Saturday
  opensAt: string; // '09:00'
  closesAt: string; // '21:00'
  isClosed: boolean;
}

export interface Shop {
  id: string;
  ownerUserId: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  addressText: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  verificationStatus: ShopVerificationStatus;
  availabilityStatus: ShopAvailabilityStatus;
  distanceMeters?: number;
  latestCrowd?: CrowdReportSummary;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  iconName?: string;
  isActive: boolean;
}

export type ProductStatus = 'draft' | 'active' | 'archived';

export interface ProductVariant {
  id: string;
  productId: string;
  variantLabel: string;
  unit: string; // e.g., 'packet', 'kg', 'litre', 'piece'
  priceMinor: number; // in paise (e.g. 2500 = ₹25.00)
  currency: 'INR';
  quantityAvailable: number;
  quantityReserved: number;
  availabilityStatus: 'available' | 'unavailable';
  lastVerifiedAt: string;
}

export interface Product {
  id: string;
  shopId: string;
  shopName?: string;
  categoryId: string;
  name: string;
  description: string;
  status: ProductStatus;
  imageUrl?: string;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export type CrowdLevel = 'low' | 'moderate' | 'high' | 'unknown';
export type CrowdSource = 'vendor' | 'customer';

export interface CrowdReportSummary {
  level: CrowdLevel;
  source: CrowdSource;
  observedAt: string;
  expiresAt: string;
  isStale: boolean;
  note?: string;
}

export type OrderStatus =
  | 'pending_vendor'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'disputed';

export type PaymentMethod = 'online' | 'pay_at_shop';

export type PaymentStatus =
  | 'not_required_yet'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'pay_at_shop_due'
  | 'pay_at_shop_paid';

export type HandoverStatus =
  | 'not_ready'
  | 'ready'
  | 'customer_confirmed'
  | 'vendor_confirmed'
  | 'completed'
  | 'disputed';

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  productNameSnapshot: string;
  variantSnapshot: string;
  unitSnapshot: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerUserId: string;
  customerName?: string;
  shopId: string;
  shopName?: string;
  shopAddress?: string;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  handoverStatus: HandoverStatus;
  currency: 'INR';
  subtotalMinor: number;
  feesMinor: number;
  totalMinor: number;
  items: OrderItem[];
  customerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  unit: string;
  unitPriceMinor: number;
  quantity: number;
}

export interface Cart {
  shopId: string | null;
  shopName: string | null;
  items: CartItem[];
  subtotalMinor: number;
}

export interface AuditLogEntry {
  id: string;
  actorUserId?: string;
  actorEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  shopId: string;
  shopName: string;
  ownerName: string;
  submittedAt: string;
  documentType: string;
  documentReference: string;
  status: ShopVerificationStatus;
  decisionReason?: string;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}
