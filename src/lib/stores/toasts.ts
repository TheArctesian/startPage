import { writable } from 'svelte/store';

export interface Toast {
	id: string;
	type: 'error' | 'success' | 'info' | 'warning';
	title: string;
	message?: string;
	duration?: number;
	dismissible?: boolean;
}

interface ToastStore {
	toasts: Toast[];
}

function createToastStore() {
	const { subscribe, update } = writable<ToastStore>({ toasts: [] });

	function addToast(toast: Omit<Toast, 'id'>) {
		const id = Math.random().toString(36).substr(2, 9);
		const newToast: Toast = {
			id,
			duration: 5000,
			dismissible: true,
			...toast
		};

		update(store => ({
			toasts: [...store.toasts, newToast]
		}));

		// Auto-dismiss after duration
		if (newToast.duration && newToast.duration > 0) {
			setTimeout(() => {
				removeToast(id);
			}, newToast.duration);
		}

		return id;
	}

	function removeToast(id: string) {
		update(store => ({
			toasts: store.toasts.filter(toast => toast.id !== id)
		}));
	}

	function clearToasts() {
		update(() => ({ toasts: [] }));
	}

	// Convenience methods for different toast types
	function error(title: string, message?: string, options?: Partial<Toast>) {
		return addToast({ type: 'error', title, message, ...options });
	}

	function success(title: string, message?: string, options?: Partial<Toast>) {
		return addToast({ type: 'success', title, message, ...options });
	}

	function info(title: string, message?: string, options?: Partial<Toast>) {
		return addToast({ type: 'info', title, message, ...options });
	}

	function warning(title: string, message?: string, options?: Partial<Toast>) {
		return addToast({ type: 'warning', title, message, ...options });
	}

	return {
		subscribe,
		addToast,
		removeToast,
		clearToasts,
		error,
		success,
		info,
		warning
	};
}

export const toasts = createToastStore();