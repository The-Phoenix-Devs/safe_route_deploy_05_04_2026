"use client";

/**
 * Re-exports providers synchronously so the first paint hydrates with the same tree as SSR.
 * Heavy work stays inside dynamic imports in `AppProviders` (ClientBoot, GuardianForegroundMessages).
 */
export { AppProviders as AppProvidersLazy } from "./AppProviders";
