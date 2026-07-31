export type CategoryName = 
  | 'Banarasi'
  | 'Kanjivaram'
  | 'Cotton'
  | 'Silk'
  | 'Designer'
  | 'Daily Wear'
  | 'Chanderi'
  | 'Bandhani'
  | 'Organza'
  | 'Paithani';

export interface Product {
  id: string;
  name: string;
  category: CategoryName;
  mrp: number;
  salePrice: number;
  rewardPoints: number;
  rating: number;
  reviewCount: number;
  images: string[];
  videoUrl?: string;
  arModelUrl?: string;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  isFlashSale?: boolean;
  fabric: string;
  work: string;
  blouseIncluded: boolean;
  length: string;
  washCare: string;
  description: string;
  inStock: boolean;
  stockCount: number;
  tags: string[];
  isBulkSale?: boolean;
  saleTag?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  videoUrl?: string;
  tag: string;
  targetCategory?: string;
  discountBadge?: string;
  active: boolean;
}

export interface AdBanner {
  id: string;
  title: string;
  highlightText: string;
  imageUrl: string;
  videoUrl?: string;
  buttonText: string;
  categoryLink: string;
  active: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  date: string;
  comment: string;
  verifiedPurchase: boolean;
  photos?: string[];
  helpfulCount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  blouseStitching: boolean;
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  walletCoins: number;
  isLoggedIn: boolean;
  savedAddresses: Address[];
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  houseNo: string;
  street: string;
  pincode: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export type OrderStatus = 'Placed' | 'Weaving' | 'Quality Check' | 'Packed' | 'Out for Delivery' | 'Delivered' | 'CANCELLED';

export interface OrderTrackingStep {
  stage: OrderStatus;
  timestamp: string;
  location?: string;
  note?: string;
  completed: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  coinsUsed: number;
  deliveryFee: number;
  totalAmount: number;
  earnedCoins: number;
  paymentMethod: 'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'RAZORPAY_NETBANKING' | 'COD';
  paymentId?: string;
  status: OrderStatus;
  stageHistory?: OrderTrackingStep[];
  currentLocation?: string;
  masterWeaver?: string;
  courierPartner?: string;
  trackingNumber?: string;
  address: Address;
  orderDate: string;
  estimatedDelivery: string;
  createdAt?: string;
}

export interface WalletTransaction {
  id: string;
  type: 'EARNED' | 'REDEEMED' | 'REFUND' | 'ADMIN_CREDIT';
  coins: number;
  description: string;
  date: string;
}

export interface CustomerQuery {
  id: string;
  userName: string;
  phone: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'RESOLVED';
  date: string;
}

export interface PincodeInfo {
  pincode: string;
  city: string;
  state: string;
  deliveryDays: number;
  codAvailable: boolean;
  deliveryFee: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number;
  expiryDate: string;
  active: boolean;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: 'REGISTERED' | 'GUEST';
  address: string;
  totalOrders: number;
  walletBalance: number;
  totalSpend: number;
  loyaltyTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  joinDate: string;
}

export interface CategoryGalleryItem {
  id: string;
  categoryName: CategoryName;
  title: string;
  imageUrl: string;
  tag?: string;
  active: boolean;
}

export interface CustomerGift {
  id: string;
  name: string;
  requiredTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  description: string;
  imageUrl: string;
  active: boolean;
}

export interface EditablePage {
  id: string;
  slug: 'terms' | 'privacy' | 'return-policy';
  title: string;
  content: string;
  lastUpdated: string;
}

export interface RewardSettings {
  pointToRupeeRate: number; // 1 Point = X Rupees
  welcomeBonusCoins: number;
  referralCoins: number;
}
