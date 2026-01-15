/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly RESEND_API_KEY: string;
  readonly VERCEL_SITE_URL: string;
  readonly NETOPIA_API_KEY?: string;
  readonly NETOPIA_POS_SIGNATURE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
