// Dynamic Expo configuration
// This allows us to use environment variables in Expo Go

const getApiDomain = () => {
  // Get from EXPO_PUBLIC_DOMAIN (set in npm scripts)
  let domain = process.env.EXPO_PUBLIC_DOMAIN;

  if (domain) {
    // Remove port suffix if present
    return domain.replace(/:5000$/, "");
  }

  // Fallback for local development
  return null;
};

export default {
  expo: {
    name: "GeoLingua",
    slug: "geolingua",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "geolingua",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.geolingua.app",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#2563EB",
        foregroundImage: "./assets/images/icon.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.geolingua.app",
    },
    web: {
      output: "single",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#2563EB",
          dark: {
            backgroundColor: "#1E40AF",
          },
        },
      ],
      "expo-web-browser",
    ],
    experiments: {
      reactCompiler: true,
    },
    // Pass environment variables to the app
    extra: {
      apiDomain: getApiDomain(),
      // Also store the raw env var
      EXPO_PUBLIC_DOMAIN: process.env.EXPO_PUBLIC_DOMAIN,
    },
  },
};
