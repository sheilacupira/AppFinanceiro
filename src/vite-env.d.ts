/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_APP_MODE?: 'local' | 'saas';
	readonly VITE_APP_ENV?: 'development' | 'staging' | 'production';
	readonly VITE_API_BASE_URL?: string;
	readonly VITE_AUTH_PROVIDER?: string;
	readonly VITE_BILLING_PROVIDER?: string;
	readonly VITE_SAAS_DEFAULT_PLAN?: 'free' | 'pro' | 'enterprise';
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
