/**
 * Validacao de variaveis de ambiente no startup.
 * Fonte: docs/backend/02-project-structure.md (config/env.ts)
 *
 * Crash no boot se variavel obrigatoria estiver ausente.
 * Em dev, usa defaults seguros. Em prod, exige todas.
 */

export interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  WEB_CLIENT_URL: string;
  API_BASE_URL: string;
  OAUTH_STATE_SECRET: string;
  GOOGLE_DRIVE_CLIENT_ID?: string;
  GOOGLE_DRIVE_CLIENT_SECRET?: string;
  ONEDRIVE_CLIENT_ID?: string;
  ONEDRIVE_CLIENT_SECRET?: string;
  DROPBOX_CLIENT_ID?: string;
  DROPBOX_CLIENT_SECRET?: string;
  NODE_CONFIG_ENCRYPTION_KEY?: string;
}

export function validateEnv(): EnvConfig {
  const env = process.env;
  const isProd = env.NODE_ENV === 'production';

  const config: EnvConfig = {
    NODE_ENV: env.NODE_ENV || 'development',
    PORT: parseInt(env.PORT || '3333', 10),
    DATABASE_URL: env.DATABASE_URL || '',
    REDIS_HOST: env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(env.REDIS_PORT || '6379', 10),
    JWT_SECRET: env.JWT_SECRET || '',
    RESEND_API_KEY: env.RESEND_API_KEY || '',
    WEB_CLIENT_URL: env.WEB_CLIENT_URL || 'http://localhost:3000',
    API_BASE_URL: env.API_BASE_URL || 'http://localhost:3333/api',
    OAUTH_STATE_SECRET: env.OAUTH_STATE_SECRET || '',
    GOOGLE_DRIVE_CLIENT_ID: env.GOOGLE_DRIVE_CLIENT_ID,
    GOOGLE_DRIVE_CLIENT_SECRET: env.GOOGLE_DRIVE_CLIENT_SECRET,
    ONEDRIVE_CLIENT_ID: env.ONEDRIVE_CLIENT_ID,
    ONEDRIVE_CLIENT_SECRET: env.ONEDRIVE_CLIENT_SECRET,
    DROPBOX_CLIENT_ID: env.DROPBOX_CLIENT_ID,
    DROPBOX_CLIENT_SECRET: env.DROPBOX_CLIENT_SECRET,
    NODE_CONFIG_ENCRYPTION_KEY: env.NODE_CONFIG_ENCRYPTION_KEY,
  };

  if (isProd) {
    const required: (keyof EnvConfig)[] = ['DATABASE_URL', 'JWT_SECRET', 'RESEND_API_KEY'];
    const missing = required.filter((key) => !config[key]);
    if (missing.length > 0) {
      throw new Error(`Variaveis de ambiente obrigatorias ausentes: ${missing.join(', ')}`);
    }
  }

  return config;
}
