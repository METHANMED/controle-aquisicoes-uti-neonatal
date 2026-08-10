export const ENV = {
  // Falls back to a stable local value when there's no Manus OAuth app
  // configured, so locally-issued session tokens always have a non-empty
  // appId (required by verifySession's payload check).
  appId: process.env.VITE_APP_ID || "local-app",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerName: process.env.OWNER_NAME ?? "Administrador",
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
