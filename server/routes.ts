import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { getLocale, messages, type SupportedLanguage } from "./i18n";

function getError(key: keyof typeof messages.errors, locale: SupportedLanguage) {
  return messages.errors[key][locale];
}

function getSuccess(key: keyof typeof messages.success, locale: SupportedLanguage) {
  return messages.success[key][locale];
}

export async function registerRoutes(app: Express): Promise<Server> {
  await seedDatabase();

  app.get("/api/languages", async (req: Request, res: Response) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const languages = await storage.getLanguages();
      res.json({ data: languages, locale });
    } catch (error) {
      res.status(500).json({ 
        error: getError("languagesNotFound", locale),
        errorKa: messages.errors.languagesNotFound.ka,
        errorEn: messages.errors.languagesNotFound.en,
      });
    }
  });

  app.get("/api/categories", async (req: Request, res: Response) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const categories = await storage.getCategories();
      res.json({ data: categories, locale });
    } catch (error) {
      res.status(500).json({ 
        error: getError("categoriesNotFound", locale),
        errorKa: messages.errors.categoriesNotFound.ka,
        errorEn: messages.errors.categoriesNotFound.en,
      });
    }
  });

  app.get("/api/categories/:id", async (req: Request, res: Response) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ 
          error: getError("categoryNotFound", locale),
          errorKa: messages.errors.categoryNotFound.ka,
          errorEn: messages.errors.categoryNotFound.en,
        });
      }
      res.json({ data: category, locale });
    } catch (error) {
      res.status(500).json({ 
        error: getError("categoriesNotFound", locale),
        errorKa: messages.errors.categoriesNotFound.ka,
        errorEn: messages.errors.categoriesNotFound.en,
      });
    }
  });

  app.get("/api/translators", async (req: Request, res: Response) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const translators = await storage.getTranslators();
      res.json({ data: translators, locale });
    } catch (error) {
      res.status(500).json({ 
        error: getError("translatorsNotFound", locale),
        errorKa: messages.errors.translatorsNotFound.ka,
        errorEn: messages.errors.translatorsNotFound.en,
      });
    }
  });

  app.get("/api/translators/online", async (req: Request, res: Response) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const translators = await storage.getOnlineTranslators();
      res.json({ data: translators, locale });
    } catch (error) {
      res.status(500).json({ 
        error: getError("translatorsNotFound", locale),
        errorKa: messages.errors.translatorsNotFound.ka,
        errorEn: messages.errors.translatorsNotFound.en,
      });
    }
  });

  app.get("/api/translators/:id", async (req: Request, res: Response) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const translator = await storage.getTranslator(req.params.id);
      if (!translator) {
        return res.status(404).json({ 
          error: getError("translatorNotFound", locale),
          errorKa: messages.errors.translatorNotFound.ka,
          errorEn: messages.errors.translatorNotFound.en,
        });
      }
      res.json({ data: translator, locale });
    } catch (error) {
      res.status(500).json({ 
        error: getError("translatorsNotFound", locale),
        errorKa: messages.errors.translatorsNotFound.ka,
        errorEn: messages.errors.translatorsNotFound.en,
      });
    }
  });

  app.patch("/api/translators/:id/status", async (req: Request, res: Response) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const { isOnline } = req.body;
      await storage.updateTranslatorOnline(req.params.id, isOnline);
      res.json({ 
        success: true, 
        message: getSuccess("statusUpdated", locale),
        messageKa: messages.success.statusUpdated.ka,
        messageEn: messages.success.statusUpdated.en,
      });
    } catch (error) {
      res.status(500).json({ 
        error: getError("translatorStatusUpdateFailed", locale),
        errorKa: messages.errors.translatorStatusUpdateFailed.ka,
        errorEn: messages.errors.translatorStatusUpdateFailed.en,
      });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ 
          error: getError("userNotFound", locale),
          errorKa: messages.errors.userNotFound.ka,
          errorEn: messages.errors.userNotFound.en,
        });
      }
      res.json({ data: user, locale });
    } catch (error) {
      res.status(500).json({ 
        error: getError("userNotFound", locale),
        errorKa: messages.errors.userNotFound.ka,
        errorEn: messages.errors.userNotFound.en,
      });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json({ data: user, locale });
    } catch (error) {
      res.status(500).json({ 
        error: getError("userCreateFailed", locale),
        errorKa: messages.errors.userCreateFailed.ka,
        errorEn: messages.errors.userCreateFailed.en,
      });
    }
  });

  app.get("/api/calls", async (req: Request, res: Response) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const calls = await storage.getCalls();
      const callsWithStatus = calls.map(call => ({
        ...call,
        statusKa: messages.callStatus[call.status as keyof typeof messages.callStatus]?.ka || call.status,
        statusEn: messages.callStatus[call.status as keyof typeof messages.callStatus]?.en || call.status,
      }));
      res.json({ data: callsWithStatus, locale });
    } catch (error) {
      res.status(500).json({ 
        error: getError("callsNotFound", locale),
        errorKa: messages.errors.callsNotFound.ka,
        errorEn: messages.errors.callsNotFound.en,
      });
    }
  });

  app.get("/api/calls/:id", async (req: Request, res: Response) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const call = await storage.getCall(req.params.id);
      if (!call) {
        return res.status(404).json({ 
          error: getError("callNotFound", locale),
          errorKa: messages.errors.callNotFound.ka,
          errorEn: messages.errors.callNotFound.en,
        });
      }
      const callWithStatus = {
        ...call,
        statusKa: messages.callStatus[call.status as keyof typeof messages.callStatus]?.ka || call.status,
        statusEn: messages.callStatus[call.status as keyof typeof messages.callStatus]?.en || call.status,
      };
      res.json({ data: callWithStatus, locale });
    } catch (error) {
      res.status(500).json({ 
        error: getError("callsNotFound", locale),
        errorKa: messages.errors.callsNotFound.ka,
        errorEn: messages.errors.callsNotFound.en,
      });
    }
  });

  app.get("/api/users/:userId/calls", async (req: Request, res: Response) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const calls = await storage.getUserCalls(req.params.userId);
      const callsWithStatus = calls.map(call => ({
        ...call,
        statusKa: messages.callStatus[call.status as keyof typeof messages.callStatus]?.ka || call.status,
        statusEn: messages.callStatus[call.status as keyof typeof messages.callStatus]?.en || call.status,
      }));
      res.json({ data: callsWithStatus, locale });
    } catch (error) {
      res.status(500).json({ 
        error: getError("callsNotFound", locale),
        errorKa: messages.errors.callsNotFound.ka,
        errorEn: messages.errors.callsNotFound.en,
      });
    }
  });

  app.post("/api/calls", async (req: Request, res: Response) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const call = await storage.createCall(req.body);
      res.status(201).json({ 
        data: call, 
        locale,
        message: getSuccess("callCreated", locale),
        messageKa: messages.success.callCreated.ka,
        messageEn: messages.success.callCreated.en,
      });
    } catch (error) {
      res.status(500).json({ 
        error: getError("callCreateFailed", locale),
        errorKa: messages.errors.callCreateFailed.ka,
        errorEn: messages.errors.callCreateFailed.en,
      });
    }
  });

  app.patch("/api/calls/:id", async (req: Request, res: Response) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const call = await storage.updateCall(req.params.id, req.body);
      if (!call) {
        return res.status(404).json({ 
          error: getError("callNotFound", locale),
          errorKa: messages.errors.callNotFound.ka,
          errorEn: messages.errors.callNotFound.en,
        });
      }
      const callWithStatus = {
        ...call,
        statusKa: messages.callStatus[call.status as keyof typeof messages.callStatus]?.ka || call.status,
        statusEn: messages.callStatus[call.status as keyof typeof messages.callStatus]?.en || call.status,
      };
      res.json({ data: callWithStatus, locale });
    } catch (error) {
      res.status(500).json({ 
        error: getError("callUpdateFailed", locale),
        errorKa: messages.errors.callUpdateFailed.ka,
        errorEn: messages.errors.callUpdateFailed.en,
      });
    }
  });

  app.post("/api/calls/:id/rate", async (req: Request, res: Response) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const { rating, comment } = req.body;
      const call = await storage.rateCall(req.params.id, rating, comment);
      if (!call) {
        return res.status(404).json({ 
          error: getError("callNotFound", locale),
          errorKa: messages.errors.callNotFound.ka,
          errorEn: messages.errors.callNotFound.en,
        });
      }
      res.json({ 
        data: call, 
        locale,
        message: getSuccess("callRated", locale),
        messageKa: messages.success.callRated.ka,
        messageEn: messages.success.callRated.en,
      });
    } catch (error) {
      res.status(500).json({ 
        error: getError("callRateFailed", locale),
        errorKa: messages.errors.callRateFailed.ka,
        errorEn: messages.errors.callRateFailed.en,
      });
    }
  });

  app.get("/api/stats/online-count", async (req: Request, res: Response) => {
    const locale = getLocale(req.headers["accept-language"]);
    try {
      const translators = await storage.getOnlineTranslators();
      res.json({ 
        data: { 
          count: translators.length,
          labelKa: `${translators.length} თარჯიმანი ონლაინ`,
          labelEn: `${translators.length} translator${translators.length !== 1 ? 's' : ''} online`,
        },
        locale,
      });
    } catch (error) {
      res.status(500).json({ 
        error: getError("onlineCountFailed", locale),
        errorKa: messages.errors.onlineCountFailed.ka,
        errorEn: messages.errors.onlineCountFailed.en,
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
