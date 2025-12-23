import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import {
  PaymentMethod,
  WalletBalance,
  Transaction,
  STRIPE_API,
  STRIPE_PUBLISHABLE_KEY,
} from "@/lib/stripe";

interface PaymentState {
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId: string | null;
  walletBalance: WalletBalance | null;
  transactions: Transaction[];
  isLoading: boolean;
}

interface PaymentContextType extends PaymentState {
  fetchPaymentMethods: () => Promise<void>;
  addPaymentMethod: (paymentMethodId: string) => Promise<{ error?: string }>;
  removePaymentMethod: (paymentMethodId: string) => Promise<{ error?: string }>;
  setDefaultPaymentMethod: (
    paymentMethodId: string,
  ) => Promise<{ error?: string }>;
  fetchWalletBalance: () => Promise<void>;
  topUpWallet: (
    amount: number,
  ) => Promise<{ clientSecret?: string; error?: string }>;
  fetchTransactions: () => Promise<void>;
  createPaymentIntent: (
    amount: number,
    metadata?: Record<string, string>,
  ) => Promise<{ clientSecret?: string; error?: string }>;
  refreshAll: () => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

// Mock API base URL - replace with actual server URL
const API_BASE = process.env.EXPO_PUBLIC_API_URL || "";

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, session } = useAuth();

  const [state, setState] = useState<PaymentState>({
    paymentMethods: [],
    defaultPaymentMethodId: null,
    walletBalance: null,
    transactions: [],
    isLoading: false,
  });

  const getAuthHeaders = useCallback(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    };
  }, [session?.access_token]);

  const fetchPaymentMethods = useCallback(async () => {
    if (!isAuthenticated) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(
        `${API_BASE}${STRIPE_API.getPaymentMethods}`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setState((prev) => ({
          ...prev,
          paymentMethods: data.paymentMethods || [],
          defaultPaymentMethodId: data.defaultPaymentMethodId || null,
          isLoading: false,
        }));
      } else {
        throw new Error("Failed to fetch payment methods");
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [isAuthenticated, getAuthHeaders]);

  const addPaymentMethod = useCallback(
    async (paymentMethodId: string) => {
      try {
        const response = await fetch(
          `${API_BASE}${STRIPE_API.addPaymentMethod}`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ paymentMethodId }),
          },
        );

        if (response.ok) {
          await fetchPaymentMethods();
          return {};
        } else {
          const data = await response.json();
          return { error: data.error || "Failed to add payment method" };
        }
      } catch (error) {
        console.error("Error adding payment method:", error);
        return { error: "Network error. Please try again." };
      }
    },
    [getAuthHeaders, fetchPaymentMethods],
  );

  const removePaymentMethod = useCallback(
    async (paymentMethodId: string) => {
      try {
        const response = await fetch(
          `${API_BASE}${STRIPE_API.removePaymentMethod}`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ paymentMethodId }),
          },
        );

        if (response.ok) {
          await fetchPaymentMethods();
          return {};
        } else {
          const data = await response.json();
          return { error: data.error || "Failed to remove payment method" };
        }
      } catch (error) {
        console.error("Error removing payment method:", error);
        return { error: "Network error. Please try again." };
      }
    },
    [getAuthHeaders, fetchPaymentMethods],
  );

  const setDefaultPaymentMethod = useCallback(
    async (paymentMethodId: string) => {
      try {
        const response = await fetch(
          `${API_BASE}${STRIPE_API.setDefaultPaymentMethod}`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ paymentMethodId }),
          },
        );

        if (response.ok) {
          setState((prev) => ({
            ...prev,
            defaultPaymentMethodId: paymentMethodId,
          }));
          return {};
        } else {
          const data = await response.json();
          return {
            error: data.error || "Failed to set default payment method",
          };
        }
      } catch (error) {
        console.error("Error setting default payment method:", error);
        return { error: "Network error. Please try again." };
      }
    },
    [getAuthHeaders],
  );

  const fetchWalletBalance = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch(
        `${API_BASE}${STRIPE_API.getWalletBalance}`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setState((prev) => ({
          ...prev,
          walletBalance: data.balance || {
            amount: 0,
            currency: "GEL",
            lastUpdated: new Date().toISOString(),
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
  }, [isAuthenticated, getAuthHeaders]);

  const topUpWallet = useCallback(
    async (amount: number) => {
      try {
        const response = await fetch(`${API_BASE}${STRIPE_API.topUpWallet}`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ amount }),
        });

        if (response.ok) {
          const data = await response.json();
          return { clientSecret: data.clientSecret };
        } else {
          const data = await response.json();
          return { error: data.error || "Failed to create top-up" };
        }
      } catch (error) {
        console.error("Error topping up wallet:", error);
        return { error: "Network error. Please try again." };
      }
    },
    [getAuthHeaders],
  );

  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch(`${API_BASE}${STRIPE_API.getTransactions}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setState((prev) => ({
          ...prev,
          transactions: data.transactions || [],
        }));
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [isAuthenticated, getAuthHeaders]);

  const createPaymentIntent = useCallback(
    async (amount: number, metadata?: Record<string, string>) => {
      try {
        const response = await fetch(
          `${API_BASE}${STRIPE_API.createPaymentIntent}`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ amount, metadata }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          return { clientSecret: data.clientSecret };
        } else {
          const data = await response.json();
          return { error: data.error || "Failed to create payment" };
        }
      } catch (error) {
        console.error("Error creating payment intent:", error);
        return { error: "Network error. Please try again." };
      }
    },
    [getAuthHeaders],
  );

  const refreshAll = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    await Promise.all([
      fetchPaymentMethods(),
      fetchWalletBalance(),
      fetchTransactions(),
    ]);
    setState((prev) => ({ ...prev, isLoading: false }));
  }, [fetchPaymentMethods, fetchWalletBalance, fetchTransactions]);

  // Fetch data when authenticated (only if Stripe is configured)
  useEffect(() => {
    if (isAuthenticated && STRIPE_PUBLISHABLE_KEY) {
      refreshAll();
    } else {
      setState({
        paymentMethods: [],
        defaultPaymentMethodId: null,
        walletBalance: null,
        transactions: [],
        isLoading: false,
      });
    }
  }, [isAuthenticated, refreshAll]);

  const value: PaymentContextType = {
    ...state,
    fetchPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    fetchWalletBalance,
    topUpWallet,
    fetchTransactions,
    createPaymentIntent,
    refreshAll,
  };

  return (
    <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);

  if (context === undefined) {
    throw new Error("usePayment must be used within a PaymentProvider");
  }

  return context;
}
