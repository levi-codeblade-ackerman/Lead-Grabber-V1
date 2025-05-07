/// <reference types="vite/client" />

// Extend the NodeJS namespace with our environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    TELNYX_API_KEY: string;
    TELNYX_PHONE_NUMBER: string;
    TELNYX_MESSAGING_PROFILE_ID: string;
    PUBLIC_BASE_URL: string;
  }
} 