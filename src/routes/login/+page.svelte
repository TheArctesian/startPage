<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	
	let { form } = $props();
	let loading = $state(false);
	let lurkLoading = $state(false);
	let showPassword = $state(false);
</script>

<svelte:head>
	<title>Sign In - Startpage</title>
</svelte:head>

<div class="login-container">
	<div class="login-card">
		<div class="login-header">
			<h1 class="login-title">Welcome Back</h1>
			<p class="login-subtitle">
				Sign in to your account or browse as a guest
			</p>
		</div>

		{#if form?.error}
			<div class="error-message">
				{form.error}
			</div>
		{/if}

		<form 
			method="post" 
			action="?/login"
			use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					loading = false;
					if (result.type === 'redirect') {
						// Refresh all data after successful login
						await invalidateAll();
						// For redirect responses, we don't need to call update()
						// The redirect will handle navigation
						return;
					}
					// For non-redirect responses (errors), update the form state
					await update();
				};
			}}
			class="login-form"
		>
			<div class="form-group">
				<label for="username" class="form-label">Username</label>
				<input
					type="text"
					id="username"
					name="username"
					required
					disabled={loading || lurkLoading}
					class="form-input"
					placeholder="Enter your username"
				/>
			</div>

			<div class="form-group">
				<label for="password" class="form-label">Password</label>
				<div class="password-input-container">
					<input
						type={showPassword ? 'text' : 'password'}
						id="password"
						name="password"
						required
						disabled={loading || lurkLoading}
						class="form-input"
						placeholder="Enter your password"
					/>
					<button
						type="button"
						class="password-toggle"
						onclick={() => showPassword = !showPassword}
						aria-label={showPassword ? 'Hide password' : 'Show password'}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							{#if showPassword}
								<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94L17.94 17.94z"/>
								<line x1="1" y1="1" x2="23" y2="23"/>
								<path d="M10.68 6.32A4 4 0 0 1 16 12a4 4 0 0 1-.32 1.68L10.68 6.32z"/>
							{:else}
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
								<circle cx="12" cy="12" r="3"/>
							{/if}
						</svg>
					</button>
				</div>
			</div>

			<button 
				type="submit" 
				disabled={loading || lurkLoading}
				class="submit-button primary"
			>
				{loading ? 'Signing In...' : 'Sign In'}
			</button>
		</form>

		<div class="auth-divider">
			<span class="divider-text">or</span>
		</div>

		<form 
			method="post" 
			action="?/lurk"
			use:enhance={() => {
				lurkLoading = true;
				return async ({ result, update }) => {
					lurkLoading = false;
					if (result.type === 'redirect') {
						// Refresh all data after successful lurk session
						await invalidateAll();
						// For redirect responses, we don't need to call update()
						// The redirect will handle navigation
						return;
					}
					// For non-redirect responses (errors), update the form state
					await update();
				};
			}}
		>
			<button 
				type="submit" 
				disabled={loading || lurkLoading}
				class="submit-button secondary"
			>
				{lurkLoading ? 'Loading...' : 'Just Lurking'}
			</button>
		</form>

		<div class="auth-footer">
			<p>New to startpage? <a href="/signup" class="signup-link">Create Account</a></p>
		</div>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--nord0);
		padding: 1rem;
	}

	.login-card {
		background: var(--nord1);
		border: 1px solid var(--nord3);
		border-radius: 0.75rem;
		padding: 2rem;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.login-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.login-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0 0 0.5rem 0;
	}

	.login-subtitle {
		color: var(--nord4);
		margin: 0;
		font-size: 0.875rem;
	}

	.error-message {
		background: rgba(191, 97, 106, 0.1);
		border: 1px solid var(--nord11);
		color: var(--nord11);
		padding: 0.75rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--nord6);
	}

	.password-input-container {
		position: relative;
		display: flex;
		align-items: center;
	}

	.form-input {
		width: 100%;
		padding: 0.75rem;
		padding-right: 3rem;
		border: 1px solid var(--nord3);
		border-radius: 0.5rem;
		background: var(--nord0);
		color: var(--nord6);
		font-size: 0.875rem;
		transition: border-color 0.2s ease;
	}

	.form-input:focus {
		outline: none;
		border-color: var(--nord8);
		box-shadow: 0 0 0 3px rgba(136, 192, 208, 0.1);
	}

	.form-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.password-toggle {
		position: absolute;
		right: 0.75rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 0.25rem;
		font-size: 1rem;
		transition: background-color 0.2s ease;
	}

	.password-toggle:hover {
		background: var(--nord2);
	}

	.submit-button {
		padding: 0.875rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
		width: 100%;
	}

	.submit-button.primary {
		background: var(--nord8);
		color: var(--nord0);
	}

	.submit-button.primary:hover:not(:disabled) {
		background: var(--nord9);
		transform: translateY(-1px);
	}

	.submit-button.secondary {
		background: transparent;
		color: var(--nord4);
		border: 1px solid var(--nord3);
	}

	.submit-button.secondary:hover:not(:disabled) {
		color: var(--nord6);
		border-color: var(--nord8);
		background: var(--nord1);
	}

	.submit-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.auth-divider {
		margin: 1.5rem 0;
		position: relative;
		text-align: center;
	}

	.auth-divider::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--nord3);
	}

	.divider-text {
		background: var(--nord1);
		color: var(--nord4);
		padding: 0 1rem;
		font-size: 0.875rem;
	}

	.auth-footer {
		margin-top: 2rem;
		text-align: center;
	}

	.auth-footer p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--nord4);
	}

	.signup-link {
		color: var(--nord8);
		text-decoration: none;
		font-weight: 500;
	}

	.signup-link:hover {
		color: var(--nord9);
		text-decoration: underline;
	}

	@media (max-width: 480px) {
		.login-card {
			padding: 1.5rem;
		}
		
		.login-title {
			font-size: 1.25rem;
		}
	}
</style>