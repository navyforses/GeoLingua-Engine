import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";

export async function registerRoutes(app: Express): Promise<Server> {
  await seedDatabase();

  app.get("/api/languages", async (req, res) => {
    try {
      const languages = await storage.getLanguages();
      res.json(languages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch languages" });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.get("/api/translators", async (req, res) => {
    try {
      const translators = await storage.getTranslators();
      res.json(translators);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch translators" });
    }
  });

  app.get("/api/translators/online", async (req, res) => {
    try {
      const translators = await storage.getOnlineTranslators();
      res.json(translators);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch online translators" });
    }
  });

  app.get("/api/translators/:id", async (req, res) => {
    try {
      const translator = await storage.getTranslator(req.params.id);
      if (!translator) {
        return res.status(404).json({ error: "Translator not found" });
      }
      res.json(translator);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch translator" });
    }
  });

  app.patch("/api/translators/:id/status", async (req, res) => {
    try {
      const { isOnline } = req.body;
      await storage.updateTranslatorOnline(req.params.id, isOnline);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update translator status" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.get("/api/calls", async (req, res) => {
    try {
      const calls = await storage.getCalls();
      res.json(calls);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch calls" });
    }
  });

  app.get("/api/calls/:id", async (req, res) => {
    try {
      const call = await storage.getCall(req.params.id);
      if (!call) {
        return res.status(404).json({ error: "Call not found" });
      }
      res.json(call);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch call" });
    }
  });

  app.get("/api/users/:userId/calls", async (req, res) => {
    try {
      const calls = await storage.getUserCalls(req.params.userId);
      res.json(calls);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user calls" });
    }
  });

  app.post("/api/calls", async (req, res) => {
    try {
      const call = await storage.createCall(req.body);
      res.status(201).json(call);
    } catch (error) {
      res.status(500).json({ error: "Failed to create call" });
    }
  });

  app.patch("/api/calls/:id", async (req, res) => {
    try {
      const call = await storage.updateCall(req.params.id, req.body);
      if (!call) {
        return res.status(404).json({ error: "Call not found" });
      }
      res.json(call);
    } catch (error) {
      res.status(500).json({ error: "Failed to update call" });
    }
  });

  app.post("/api/calls/:id/rate", async (req, res) => {
    try {
      const { rating, comment } = req.body;
      const call = await storage.rateCall(req.params.id, rating, comment);
      if (!call) {
        return res.status(404).json({ error: "Call not found" });
      }
      res.json(call);
    } catch (error) {
      res.status(500).json({ error: "Failed to rate call" });
    }
  });

  app.get("/api/stats/online-count", async (req, res) => {
    try {
      const translators = await storage.getOnlineTranslators();
      res.json({ count: translators.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch online count" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
