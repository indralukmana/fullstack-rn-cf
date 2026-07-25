export type AppBindings = {
  ENVIRONMENT?: string;
  SERVICE_NAME?: string;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_SECRET?: string;
  APP_URL?: string;
  CORS_ORIGINS?: string;
  TRUSTED_ORIGINS?: string;
  RATE_LIMIT_TTL?: string | number;
  RATE_LIMIT_MAX?: string | number;
  AUTH_RATE_LIMIT_TTL?: string | number;
  AUTH_RATE_LIMIT_MAX?: string | number;
  EMAIL_PROVIDER?: string;
  EMAIL_FROM?: string;
  EMAIL?: {
    send(message: {
      from: string;
      to: string;
      subject: string;
      text: string;
      html?: string;
    }): Promise<{ messageId: string }>;
  };
};

const DEFAULT_DEV_CORS_ORIGINS = [
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:19006",
  "http://127.0.0.1:19006",
];

const NATIVE_TRUSTED_ORIGINS = ["rn-cf://", "exp://"];

function parseList(value: string | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePositiveInt(value: string | number | undefined, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return fallback;
}

function requireNonEmpty(value: string | undefined, name: string): string {
  if (!value?.trim()) {
    throw new Error(`${name} must be set`);
  }

  return value.trim();
}

function parseAbsoluteUrl(value: string | undefined, name: string): URL {
  const input = requireNonEmpty(value, name);

  try {
    return new URL(input);
  } catch {
    throw new Error(`${name} must be an absolute URL`);
  }
}

export type RuntimeConfig = {
  environment: "development" | "production";
  isProduction: boolean;
  serviceName: string;
  authUrl: string;
  authSecret: string;
  appUrl: string;
  corsOrigins: string[];
  trustedOrigins: string[];
  rateLimitTtlMs: number;
  rateLimitMax: number;
  authRateLimitTtlMs: number;
  authRateLimitMax: number;
  emailProvider: "console" | "cloudflare";
  emailFrom: string;
};

export function getRuntimeConfig(env: AppBindings): RuntimeConfig {
  if (env.ENVIRONMENT !== "development" && env.ENVIRONMENT !== "production") {
    throw new Error("ENVIRONMENT must be either development or production");
  }

  const environment = env.ENVIRONMENT;
  const isProduction = environment === "production";
  const corsOrigins = parseList(env.CORS_ORIGINS);
  const authUrl = parseAbsoluteUrl(env.BETTER_AUTH_URL, "BETTER_AUTH_URL");
  const authSecret = requireNonEmpty(env.BETTER_AUTH_SECRET, "BETTER_AUTH_SECRET");
  const appUrl = parseAbsoluteUrl(env.APP_URL, "APP_URL");
  const emailProvider = env.EMAIL_PROVIDER;
  const emailFrom = requireNonEmpty(env.EMAIL_FROM, "EMAIL_FROM");

  if (emailProvider !== "console" && emailProvider !== "cloudflare") {
    throw new Error("EMAIL_PROVIDER must be either console or cloudflare");
  }

  if (isProduction && corsOrigins.length === 0) {
    throw new Error("CORS_ORIGINS must be set in production");
  }

  if (isProduction && authSecret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters in production");
  }

  if (isProduction && authUrl.protocol !== "https:") {
    throw new Error("BETTER_AUTH_URL must use HTTPS in production");
  }

  if (isProduction && appUrl.protocol !== "https:") {
    throw new Error("APP_URL must use HTTPS in production");
  }

  if (isProduction && emailProvider !== "cloudflare") {
    throw new Error("EMAIL_PROVIDER must be cloudflare in production");
  }

  if (isProduction && !env.EMAIL) {
    throw new Error("EMAIL binding must be configured in production");
  }

  if (isProduction && /@localhost(?:[>\s]|$)/i.test(emailFrom)) {
    throw new Error("EMAIL_FROM must use a verified production domain");
  }

  for (const origin of corsOrigins) {
    const url = parseAbsoluteUrl(origin, "CORS_ORIGINS");
    if (url.origin !== origin) {
      throw new Error("CORS_ORIGINS entries must be origins without paths or trailing slashes");
    }
    if (isProduction && url.protocol !== "https:") {
      throw new Error("CORS_ORIGINS entries must use HTTPS in production");
    }
  }

  const resolvedCors = corsOrigins.length > 0 ? corsOrigins : DEFAULT_DEV_CORS_ORIGINS;
  const trustedOrigins = [
    ...new Set([...resolvedCors, ...parseList(env.TRUSTED_ORIGINS), ...NATIVE_TRUSTED_ORIGINS]),
  ];

  return {
    environment,
    isProduction,
    serviceName: env.SERVICE_NAME ?? "rn-cf-api",
    authUrl: authUrl.href.replace(/\/$/, ""),
    authSecret,
    appUrl: appUrl.href.replace(/\/$/, ""),
    corsOrigins: resolvedCors,
    trustedOrigins,
    rateLimitTtlMs: parsePositiveInt(env.RATE_LIMIT_TTL, 60_000),
    rateLimitMax: parsePositiveInt(env.RATE_LIMIT_MAX, 120),
    authRateLimitTtlMs: parsePositiveInt(env.AUTH_RATE_LIMIT_TTL, 900_000),
    authRateLimitMax: parsePositiveInt(env.AUTH_RATE_LIMIT_MAX, 30),
    emailProvider,
    emailFrom,
  };
}
