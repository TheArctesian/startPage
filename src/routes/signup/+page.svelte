<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	
	let { form } = $props();
	let loading = $state(false);
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
</script>

<svelte:head>
	<title>Sign Up - Startpage</title>
</svelte:head>

<div class="signup-container">
	<div class="signup-card">
		<div class="signup-header">
			<h1 class="signup-title">Create Account</h1>
			<p class="signup-subtitle">
				Join the startpage and request access to projects
			</p>
		</div>

		{#if form?.error}
			<div class="error-message">
				{form.error}
			</div>
		{/if}

		<form 
			method="post" 
			action="?/signup"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
			class="signup-form"
		>
			<div class="form-group">
				<label for="username" class="form-label">Username *</label>
				<input
					type="text"
					id="username"
					name="username"
					required
					disabled={loading}
					class="form-input"
					placeholder="Enter your username"
					minlength="3"
					maxlength="50"
					pattern="[a-zA-Z0-9_]+"
					title="Username can only contain letters, numbers, and underscores"
				/>
				<p class="form-hint">3-50 characters, letters, numbers, and underscores only</p>
			</div>

			<div class="form-group">
				<label for="email" class="form-label">Email (optional)</label>
				<input
					type="email"
					id="email"
					name="email"
					disabled={loading}
					class="form-input"
					placeholder="Enter your email"
				/>
				<p class="form-hint">For notifications and password recovery</p>
			</div>

			<div class="form-group">
				<label for="password" class="form-label">Password *</label>
				<div class="password-input-container">
					<input
						type={showPassword ? 'text' : 'password'}
						id="password"
						name="password"
						required
						disabled={loading}
						class="form-input"
						placeholder="Enter your password"
						minlength="8"
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

			<div class="form-group">
				<label for="confirmPassword" class="form-label">Confirm Password *</label>
				<div class="password-input-container">
					<input
						type={showConfirmPassword ? 'text' : 'password'}
						id="confirmPassword"
						name="confirmPassword"
						required
						disabled={loading}
						class="form-input"
						placeholder="Confirm your password"
						minlength="8"
					/>
					<button
						type="button"
						class="password-toggle"
						onclick={() => showConfirmPassword = !showConfirmPassword}
						aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							{#if showConfirmPassword}
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
				disabled={loading}
				class="submit-button"
			>
				{loading ? 'Creating Account...' : 'Create Account'}
			</button>
		</form>

		<div class="signup-footer">
			<p>Already have an account? <a href="/login" class="login-link">Sign In</a></p>
			<p>Just want to browse? <a href="/login" class="browse-link">Continue as Guest</a></p>
		</div>
	</div>
</div>

<style>
	.signup-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--nord0);
		padding: 1rem;
	}

	.signup-card {
		background: var(--nord1);
		border: 1px solid var(--nord3);
		border-radius: 0.75rem;
		padding: 2rem;
		width: 100%;
		max-width: 450px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.signup-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.signup-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0 0 0.5rem 0;
	}

	.signup-subtitle {
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

	.signup-form {
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

	.form-hint {
		font-size: 0.75rem;
		color: var(--nord4);
		margin: 0;
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
		color: var(--nord4);
		transition: color 0.2s ease;
	}

	.password-toggle:hover {
		color: var(--nord6);
	}

	.submit-button {
		padding: 0.875rem 1.5rem;
		background: var(--nord8);
		color: var(--nord0);
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
	}

	.submit-button:hover:not(:disabled) {
		background: var(--nord9);
		transform: translateY(-1px);
	}

	.submit-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.signup-footer {
		margin-top: 2rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.signup-footer p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--nord4);
	}

	.login-link,
	.browse-link {
		color: var(--nord8);
		text-decoration: none;
		font-weight: 500;
	}

	.login-link:hover,
	.browse-link:hover {
		color: var(--nord9);
		text-decoration: underline;
	}

	@media (max-width: 480px) {
		.signup-card {
			padding: 1.5rem;
		}
		
		.signup-title {
			font-size: 1.25rem;
		}
	}
</style>