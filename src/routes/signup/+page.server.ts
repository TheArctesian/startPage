import { redirect, fail } from '@sveltejs/kit';
import { createUser, createSession, logUserActivity } from '$lib/server/auth';
import { authLogger } from '$lib/server/auth/debug';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // If already authenticated, redirect to home
  if (locals.user) {
    throw redirect(302, '/');
  }

  return {};
};

export const actions: Actions = {
  signup: async ({ request, cookies, getClientAddress }) => {
    const data = await request.formData();
    const username = data.get('username') as string;
    const password = data.get('password') as string;
    const confirmPassword = data.get('confirmPassword') as string;
    const email = data.get('email') as string;

    // Validation
    if (!username || username.trim().length === 0) {
      return fail(400, { error: 'Username is required' });
    }

    if (username.length < 3 || username.length > 50) {
      return fail(400, { error: 'Username must be between 3 and 50 characters' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return fail(400, { error: 'Username can only contain letters, numbers, and underscores' });
    }

    if (!password) {
      return fail(400, { error: 'Password is required' });
    }

    if (password.length < 8) {
      return fail(400, { error: 'Password must be at least 8 characters long' });
    }

    if (password !== confirmPassword) {
      return fail(400, { error: 'Passwords do not match' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(400, { error: 'Invalid email format' });
    }

    try {
      authLogger.info('Creating new user account', { username: username.trim(), hasEmail: !!email });

      const newUser = await createUser(username.trim(), password, email?.trim());

      authLogger.info('User account created', {
        userId: newUser.id,
        username: newUser.username,
        status: newUser.status
      });

      // Log the signup activity
      await logUserActivity(
        newUser.id,
        'signup',
        'user',
        newUser.id,
        getClientAddress(),
        { username: newUser.username }
      );

      authLogger.info('Redirecting to pending approval', { userId: newUser.id });

      // Note: No session cookie is set during signup
      // User must wait for admin approval before logging in
      throw redirect(302, '/pending-approval');
    } catch (error: any) {
      // Re-throw redirects (they have status and location properties)
      if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
        throw error;
      }

      authLogger.error('Signup error', { username: username.trim(), error: String(error) });

      if (error instanceof Error && error.message === 'Username already exists') {
        return fail(400, { error: 'Username already taken' });
      }

      return fail(500, { error: 'Failed to create account' });
    }
  }
};