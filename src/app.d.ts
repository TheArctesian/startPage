// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { PublicUser } from '$lib/server/auth/user-repository';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: PublicUser;
			sessionId?: string;
			isAnonymous: boolean;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
