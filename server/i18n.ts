export const messages = {
  errors: {
    languagesNotFound: {
      ka: "ენები ვერ მოიძებნა",
      en: "Failed to fetch languages",
    },
    categoriesNotFound: {
      ka: "კატეგორიები ვერ მოიძებნა",
      en: "Failed to fetch categories",
    },
    categoryNotFound: {
      ka: "კატეგორია ვერ მოიძებნა",
      en: "Category not found",
    },
    translatorsNotFound: {
      ka: "თარჯიმნები ვერ მოიძებნა",
      en: "Failed to fetch translators",
    },
    translatorNotFound: {
      ka: "თარჯიმანი ვერ მოიძებნა",
      en: "Translator not found",
    },
    translatorStatusUpdateFailed: {
      ka: "თარჯიმნის სტატუსის განახლება ვერ მოხერხდა",
      en: "Failed to update translator status",
    },
    userNotFound: {
      ka: "მომხმარებელი ვერ მოიძებნა",
      en: "User not found",
    },
    userCreateFailed: {
      ka: "მომხმარებლის შექმნა ვერ მოხერხდა",
      en: "Failed to create user",
    },
    callsNotFound: {
      ka: "ზარები ვერ მოიძებნა",
      en: "Failed to fetch calls",
    },
    callNotFound: {
      ka: "ზარი ვერ მოიძებნა",
      en: "Call not found",
    },
    callCreateFailed: {
      ka: "ზარის შექმნა ვერ მოხერხდა",
      en: "Failed to create call",
    },
    callUpdateFailed: {
      ka: "ზარის განახლება ვერ მოხერხდა",
      en: "Failed to update call",
    },
    callRateFailed: {
      ka: "ზარის შეფასება ვერ მოხერხდა",
      en: "Failed to rate call",
    },
    onlineCountFailed: {
      ka: "ონლაინ თარჯიმნების რაოდენობა ვერ მოიძებნა",
      en: "Failed to fetch online count",
    },
    invalidRequest: {
      ka: "არასწორი მოთხოვნა",
      en: "Invalid request",
    },
    serverError: {
      ka: "სერვერის შეცდომა",
      en: "Server error",
    },
  },
  success: {
    statusUpdated: {
      ka: "სტატუსი წარმატებით განახლდა",
      en: "Status updated successfully",
    },
    callCreated: {
      ka: "ზარი წარმატებით შეიქმნა",
      en: "Call created successfully",
    },
    callRated: {
      ka: "ზარი წარმატებით შეფასდა",
      en: "Call rated successfully",
    },
  },
  callStatus: {
    pending: {
      ka: "მოლოდინში",
      en: "Pending",
    },
    matching: {
      ka: "თარჯიმნის ძიება",
      en: "Matching",
    },
    active: {
      ka: "მიმდინარე",
      en: "Active",
    },
    completed: {
      ka: "დასრულებული",
      en: "Completed",
    },
    cancelled: {
      ka: "გაუქმებული",
      en: "Cancelled",
    },
    missed: {
      ka: "გამოტოვებული",
      en: "Missed",
    },
  },
};

export type SupportedLanguage = "ka" | "en";

export function getLocale(acceptLanguage?: string): SupportedLanguage {
  if (!acceptLanguage) return "en";
  if (acceptLanguage.includes("ka")) return "ka";
  return "en";
}

export function t(
  key: keyof typeof messages.errors | keyof typeof messages.success,
  type: "errors" | "success",
  locale: SupportedLanguage
): string {
  const group = messages[type] as Record<string, { ka: string; en: string }>;
  return group[key]?.[locale] || group[key]?.en || key;
}

export function formatBilingualResponse<T>(
  data: T,
  locale: SupportedLanguage
): { data: T; locale: SupportedLanguage } {
  return { data, locale };
}
