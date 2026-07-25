export type AppBindings = {
  ENVIRONMENT?: string;
  SERVICE_NAME?: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  CORS_ORIGINS?: string;
  TRUSTED_ORIGINS?: string;
  RATE_LIMIT_TTL?: string | number;
  RATE_LIMIT_MAX?: string | number;
  AUTH_RATE_LIMIT_TTL?: string | number;
  AUTH_RATE_LIMIT_MAX?: string | number;
  EMAIL_PROVIDER?: string;
  EMAIL_FROM?: string;
  RESEND_API_KEY?: string;
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

export type RuntimeConfig = {
  environment: "development" | "production";
  isProduction: boolean;
  serviceName: string;
  corsOrigins: string[];
  trustedOrigins: string[];
  rateLimitTtlMs: number;
  rateLimitMax: number;
  authRateLimitTtlMs: number;
  authRateLimitMax: number;
};

export function getRuntimeConfig(env: AppBindings): RuntimeConfig {
  const environment = env.ENVIRONMENT === "production" ? "production" : "development";
  const isProduction = environment === "production";
  const corsOrigins = parseList(env.CORS_ORIGINS);

  if (isProduction && corsOrigins.length === 0) {
    throw new Error("CORS_ORIGINS must be set in production");
  }

  if (isProduction && env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters in production");
  }

  const resolvedCors = corsOrigins.length > 0 ? corsOrigins : DEFAULT_DEV_CORS_ORIGINS;
  const trustedOrigins = [
    ...new Set([...resolvedCors, ...parseList(env.TRUSTED_ORIGINS), ...NATIVE_TRUSTED_ORIGINS]),
  ];

  return {
    environment,
    isProduction,
    serviceName: env.SERVICE_NAME ?? "rn-cf-api",
    corsOrigins: resolvedCors,
    trustedOrigins,
    rateLimitTtlMs: parsePositiveInt(env.RATE_LIMIT_TTL, 60_000),
    rateLimitMax: parsePositiveInt(env.RATE_LIMIT_MAX, 120),
    authRateLimitTtlMs: parsePositiveInt(env.AUTH_RATE_LIMIT_TTL, 900_000),
    authRateLimitMax: parsePositiveInt(env.AUTH_RATE_LIMIT_MAX, 30),
  };
}
