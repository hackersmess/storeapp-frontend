/**
 * 🔄 CONFIGURAZIONE CON SSR (Backup per il futuro)
 * 
 * Se in futuro vorrai attivare SSR, usa questa configurazione.
 * 
 * Per attivarla:
 * 1. Copia questo contenuto in `app.config.ts`
 * 2. Assicurati di avere i componenti pronti per SSR (isPlatformBrowser, etc.)
 * 
 * Vantaggi SSR:
 * -  SEO ottimizzato
 * -  First Paint veloce
 * -  Performance migliori
 * 
 * Requisiti:
 * - Tutti i componenti devono usare isPlatformBrowser per localStorage/DOM
 * - Nessuna richiesta HTTP nel costruttore
 * - Build con: ng build --configuration production
 */

import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfigWithSSR: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideRouter(routes),
		// ✅ Hydration con configurazione corretta
		provideClientHydration(
			withHttpTransferCacheOptions({
				includePostRequests: false // ❌ Non cachare POST
			})
		),
		provideHttpClient(
			withInterceptors([authInterceptor])
		)
	]
};
