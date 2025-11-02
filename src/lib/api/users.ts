import type { User, UserRole, UserStatus } from '$lib/types/database';

/**
 * User data returned by API (without sensitive fields)
 */
export interface UserData {
	id: number;
	username: string;
	email: string | null;
	role: UserRole;
	status: UserStatus;
	createdAt: Date;
}

/**
 * Fetch all approved users (admin only)
 */
export async function fetchUsers(): Promise<UserData[]> {
	const res = await fetch('/api/users');
	if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
	return res.json();
}

/**
 * Update user parameters for admin operations
 */
export interface UpdateUserParams {
	status?: UserStatus;
	role?: UserRole;
}

/**
 * Update a user's status or role (admin only)
 */
export async function updateUser(id: number, updates: UpdateUserParams): Promise<UserData> {
	const res = await fetch(`/api/admin/users/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(updates)
	});
	if (!res.ok) throw new Error(`Failed to update user: ${res.status}`);
	const data = await res.json();
	return data.user;
}
