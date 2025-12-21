// Stripe configuration for React Native
// Note: The actual Stripe initialization happens in the StripeProvider component

// Stripe publishable key - should be set in environment variables
export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn(
    "Stripe publishable key not found. Please set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables.",
  );
}

// API endpoints for Stripe operations
export const STRIPE_API = {
  createPaymentIntent: "/api/payments/create-intent",
  createSetupIntent: "/api/payments/create-setup-intent",
  getPaymentMethods: "/api/payments/methods",
  addPaymentMethod: "/api/payments/methods/add",
  removePaymentMethod: "/api/payments/methods/remove",
  setDefaultPaymentMethod: "/api/payments/methods/default",
  getWalletBalance: "/api/payments/wallet/balance",
  topUpWallet: "/api/payments/wallet/top-up",
  getTransactions: "/api/payments/transactions",
};

// Payment method types
export interface PaymentMethod {
  id: string;
  type: "card";
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
  createdAt: string;
}

export interface WalletBalance {
  amount: number;
  currency: string;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  type: "top_up" | "call_charge" | "refund";
  amount: number;
  currency: string;
  description: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
  metadata?: {
    callId?: string;
    translatorName?: string;
    duration?: number;
  };
}

// Helper functions
export const formatCardBrand = (brand: string): string => {
  const brands: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
  };
  return brands[brand.toLowerCase()] || brand;
};

export const formatCurrency = (
  amount: number,
  currency: string = "GEL",
): string => {
  if (currency === "GEL") {
    return `${amount.toFixed(2)}₾`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

export const getCardIcon = (brand: string): string => {
  const icons: Record<string, string> = {
    visa: "credit-card",
    mastercard: "credit-card",
    amex: "credit-card",
    default: "credit-card",
  };
  return icons[brand.toLowerCase()] || icons.default;
};
