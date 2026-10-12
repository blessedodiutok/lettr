// File: apps/api/src/types/environment.d.ts
// Augments process.env with typed keys — no more accessing undefined variables silently

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      PORT: string;
      API_URL: string;
      CORS_ORIGINS: string;
      DATABASE_URL: string;
      REDIS_URL: string;
      JWT_ACCESS_SECRET: string;
      JWT_REFRESH_SECRET: string;
      JWT_ACCESS_EXPIRES_IN: string;
      JWT_REFRESH_EXPIRES_IN: string;
      CLOUDINARY_CLOUD_NAME: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_API_SECRET: string;
      CLOUDINARY_UPLOAD_FOLDER: string;
      FIREBASE_SERVICE_ACCOUNT_JSON: string;
      RESEND_API_KEY: string;
      EMAIL_FROM: string;
      SMTP_HOST: string;
      SMTP_PORT: string;
      SMTP_USER: string;
      SMTP_PASS: string;
      PAYSTACK_SECRET_KEY: string;
      PAYSTACK_PUBLIC_KEY: string;
      PAYSTACK_WEBHOOK_SECRET: string;
      OTP_EXPIRY_SECONDS: string;
      COOKIE_DOMAIN: string;
    }
  }
}

export {};
