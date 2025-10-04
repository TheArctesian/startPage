<script lang="ts">
</script>

<svelte:head>
	<title>Pending Approval - Startpage</title>
</svelte:head>

<div class="pending-container">
	<div class="pending-card">
		<div class="pending-icon">
			<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10"/>
				<path d="M12 6v6l4 2"/>
			</svg>
		</div>
		
		<h1 class="pending-title">Account Created Successfully!</h1>
		
		<div class="pending-content">
			<p class="pending-message">
				Your account has been created and is pending approval from an administrator.
			</p>
			
			<div class="pending-steps">
				<h3>What happens next?</h3>
				<ol>
					<li>An administrator will review your account request</li>
					<li>You'll be approved for specific projects based on your needs</li>
					<li>You can then sign in and start using the startpage</li>
				</ol>
			</div>
			
			<div class="pending-note">
				<p><strong>Note:</strong> You can still browse public projects by visiting the homepage and clicking "Just Lurking".</p>
			</div>
		</div>
		
		<div class="pending-actions">
			<a href="/login" class="primary-button">
				Back to Sign In
			</a>
			<a href="/" class="secondary-button">
				Browse as Guest
			</a>
		</div>
	</div>
</div>

<style>
	.pending-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--nord0);
		padding: 1rem;
	}

	.pending-card {
		background: var(--nord1);
		border: 1px solid var(--nord3);
		border-radius: 0.75rem;
		padding: 3rem 2rem;
		width: 100%;
		max-width: 500px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.pending-icon {
		color: var(--nord13);
		margin-bottom: 1.5rem;
		display: flex;
		justify-content: center;
	}

	.pending-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0 0 2rem 0;
	}

	.pending-content {
		text-align: left;
		margin-bottom: 2rem;
	}

	.pending-message {
		font-size: 1rem;
		color: var(--nord5);
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.pending-steps h3 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--nord6);
		margin: 0 0 1rem 0;
	}

	.pending-steps ol {
		color: var(--nord4);
		padding-left: 1.5rem;
		margin: 0;
	}

	.pending-steps li {
		margin-bottom: 0.5rem;
		line-height: 1.5;
	}

	.pending-note {
		background: var(--nord2);
		border: 1px solid var(--nord3);
		border-radius: 0.5rem;
		padding: 1rem;
		margin-top: 1.5rem;
	}

	.pending-note p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--nord4);
	}

	.pending-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.primary-button,
	.secondary-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		text-decoration: none;
		font-weight: 500;
		font-size: 0.875rem;
		transition: all 0.2s ease;
		border: 1px solid transparent;
	}

	.primary-button {
		background: var(--nord8);
		color: var(--nord0);
	}

	.primary-button:hover {
		background: var(--nord9);
		transform: translateY(-1px);
	}

	.secondary-button {
		background: transparent;
		color: var(--nord4);
		border-color: var(--nord3);
	}

	.secondary-button:hover {
		color: var(--nord6);
		border-color: var(--nord8);
		background: var(--nord1);
	}

	@media (max-width: 480px) {
		.pending-card {
			padding: 2rem 1.5rem;
		}
		
		.pending-title {
			font-size: 1.25rem;
		}

		.pending-actions {
			flex-direction: column;
		}

		.primary-button,
		.secondary-button {
			width: 100%;
			justify-content: center;
		}
	}
</style>