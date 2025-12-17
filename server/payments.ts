import Stripe from "stripe";
import type { Express, Request, Response } from "express";

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

if (!stripeSecretKey) {
  console.warn(
    "Stripe secret key not found. Payment features will not work. Please set STRIPE_SECRET_KEY in your environment variables.",
  );
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// In-memory storage for demo purposes
// In production, use your database
const userWallets: Map<string, { balance: number; currency: string }> =
  new Map();
const userPaymentMethods: Map<
  string,
  {
    id: string;
    type: string;
    card: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    };
    isDefault: boolean;
    createdAt: string;
  }[]
> = new Map();
const transactions: Map<
  string,
  {
    id: string;
    type: string;
    amount: number;
    currency: string;
    description: string;
    status: string;
    createdAt: string;
  }[]
> = new Map();

// Helper to get user ID from request (would come from auth middleware)
function getUserId(req: Request): string | null {
  // In production, extract from JWT token
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  // For demo, use a placeholder user ID
  // In production, decode JWT and extract user ID
  return "demo-user-id";
}

export function registerPaymentRoutes(app: Express) {
  // Create Setup Intent for adding new payment method
  app.post(
    "/api/payments/create-setup-intent",
    async (req: Request, res: Response) => {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!stripe) {
        return res
          .status(500)
          .json({ error: "Payment service not configured" });
      }

      try {
        const setupIntent = await stripe.setupIntents.create({
          payment_method_types: ["card"],
          metadata: { userId },
        });

        res.json({ clientSecret: setupIntent.client_secret });
      } catch (error) {
        console.error("Error creating setup intent:", error);
        res.status(500).json({ error: "Failed to create setup intent" });
      }
    },
  );

  // Create Payment Intent
  app.post(
    "/api/payments/create-intent",
    async (req: Request, res: Response) => {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!stripe) {
        return res
          .status(500)
          .json({ error: "Payment service not configured" });
      }

      const { amount, metadata } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      try {
        // Amount should be in smallest currency unit (e.g., tetri for GEL)
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: "gel",
          metadata: { userId, ...metadata },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ error: "Failed to create payment" });
      }
    },
  );

  // Get payment methods
  app.get("/api/payments/methods", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const methods = userPaymentMethods.get(userId) || [];
    const defaultMethod = methods.find((m) => m.isDefault);

    res.json({
      paymentMethods: methods,
      defaultPaymentMethodId: defaultMethod?.id || null,
    });
  });

  // Add payment method
  app.post("/api/payments/methods/add", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!stripe) {
      return res.status(500).json({ error: "Payment service not configured" });
    }

    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({ error: "Payment method ID required" });
    }

    try {
      // Retrieve payment method from Stripe
      const paymentMethod =
        await stripe.paymentMethods.retrieve(paymentMethodId);

      if (paymentMethod.type !== "card" || !paymentMethod.card) {
        return res.status(400).json({ error: "Invalid payment method type" });
      }

      const methods = userPaymentMethods.get(userId) || [];
      const isFirst = methods.length === 0;

      const newMethod = {
        id: paymentMethod.id,
        type: "card",
        card: {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4 || "",
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
        },
        isDefault: isFirst,
        createdAt: new Date().toISOString(),
      };

      methods.push(newMethod);
      userPaymentMethods.set(userId, methods);

      res.json({ success: true, paymentMethod: newMethod });
    } catch (error) {
      console.error("Error adding payment method:", error);
      res.status(500).json({ error: "Failed to add payment method" });
    }
  });

  // Remove payment method
  app.post(
    "/api/payments/methods/remove",
    async (req: Request, res: Response) => {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { paymentMethodId } = req.body;

      if (!paymentMethodId) {
        return res.status(400).json({ error: "Payment method ID required" });
      }

      const methods = userPaymentMethods.get(userId) || [];
      const filteredMethods = methods.filter((m) => m.id !== paymentMethodId);

      // If we removed the default, set a new default
      if (
        filteredMethods.length > 0 &&
        !filteredMethods.some((m) => m.isDefault)
      ) {
        filteredMethods[0].isDefault = true;
      }

      userPaymentMethods.set(userId, filteredMethods);

      res.json({ success: true });
    },
  );

  // Set default payment method
  app.post(
    "/api/payments/methods/default",
    async (req: Request, res: Response) => {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { paymentMethodId } = req.body;

      if (!paymentMethodId) {
        return res.status(400).json({ error: "Payment method ID required" });
      }

      const methods = userPaymentMethods.get(userId) || [];
      const updatedMethods = methods.map((m) => ({
        ...m,
        isDefault: m.id === paymentMethodId,
      }));

      userPaymentMethods.set(userId, updatedMethods);

      res.json({ success: true });
    },
  );

  // Get wallet balance
  app.get(
    "/api/payments/wallet/balance",
    async (req: Request, res: Response) => {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const wallet = userWallets.get(userId) || {
        balance: 0,
        currency: "GEL",
      };

      res.json({
        balance: {
          amount: wallet.balance,
          currency: wallet.currency,
          lastUpdated: new Date().toISOString(),
        },
      });
    },
  );

  // Top up wallet
  app.post(
    "/api/payments/wallet/top-up",
    async (req: Request, res: Response) => {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!stripe) {
        return res
          .status(500)
          .json({ error: "Payment service not configured" });
      }

      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: "gel",
          metadata: {
            userId,
            type: "wallet_top_up",
          },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error("Error creating top-up intent:", error);
        res.status(500).json({ error: "Failed to create top-up" });
      }
    },
  );

  // Get transactions
  app.get("/api/payments/transactions", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userTransactions = transactions.get(userId) || [];

    res.json({ transactions: userTransactions });
  });

  // Stripe webhook handler
  app.post("/api/webhooks/stripe", async (req: Request, res: Response) => {
    if (!stripe) {
      return res.status(500).json({ error: "Payment service not configured" });
    }

    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
      return res.status(400).json({ error: "Missing signature or secret" });
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret,
      );

      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object;
          const userId = paymentIntent.metadata.userId;

          if (paymentIntent.metadata.type === "wallet_top_up" && userId) {
            // Update wallet balance
            const wallet = userWallets.get(userId) || {
              balance: 0,
              currency: "GEL",
            };
            wallet.balance += paymentIntent.amount / 100;
            userWallets.set(userId, wallet);

            // Record transaction
            const userTxns = transactions.get(userId) || [];
            userTxns.unshift({
              id: paymentIntent.id,
              type: "top_up",
              amount: paymentIntent.amount / 100,
              currency: "GEL",
              description: "Wallet top-up",
              status: "completed",
              createdAt: new Date().toISOString(),
            });
            transactions.set(userId, userTxns);
          }
          break;
        }

        case "payment_intent.payment_failed": {
          console.log("Payment failed:", event.data.object.id);
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: "Webhook error" });
    }
  });
}
