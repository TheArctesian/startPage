import { logger } from '$lib/utils/logger';

export const authLogger = {
	debug: (message: string, ...args: any[]) => logger.debug(message, 'AUTH', ...args),
	info: (message: string, ...args: any[]) => logger.info(message, 'AUTH', ...args),
	warn: (message: string, ...args: any[]) => logger.warn(message, 'AUTH', ...args),
	error: (message: string, ...args: any[]) => logger.error(message, 'AUTH', ...args)
};

export function logCookieOperation(
	operation: 'set' | 'get' | 'verify' | 'delete',
	details: {
		sessionId?: string;
		success?: boolean;
		expected?: string;
		actual?: string;
		error?: string;
	}
) {
	authLogger.info(`Cookie ${operation}`, details);
}

export function logSessionValidation(
	sessionId: string | undefined,
	result: {
		found: boolean;
		expired?: boolean;
		hasUser?: boolean;
		userStatus?: string;
	}
) {
	authLogger.info('Session validation', { sessionId: sessionId?.slice(0, 8) + '...', ...result });
}

export function logAuthStateChange(
	userId: number | undefined,
	from: string,
	to: string,
	reason?: string
) {
	authLogger.info('Auth state change', { userId, from, to, reason });
}
