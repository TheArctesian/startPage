<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  
  let { data, form } = $props();
  let loading = $state(false);
</script>

<svelte:head>
  <title>Setup - Startpage</title>
</svelte:head>

<div class="setup-container">
  <div class="setup-card">
    <div class="setup-header">
      <h1 class="setup-title">Initial Setup</h1>
      <p class="setup-subtitle">
        {#if data.hasUsers}
          Setup is complete. {data.userCount} user(s) exist in the system.
        {:else}
          No users found. Create an admin user to get started.
        {/if}
      </p>
    </div>

    {#if form?.error}
      <div class="error-message">
        {form.error}
      </div>
    {/if}

    {#if form?.success}
      <div class="success-message">
        Admin user created successfully! You can now <a href="/login">sign in</a>.
      </div>
    {/if}

    {#if data.hasUsers}
      <div class="info-message">
        Setup is already complete. <a href="/login">Go to login</a> or <a href="/">browse as guest</a>.
      </div>
    {:else}
      <form 
        method="post" 
        action="?/createAdmin"
        use:enhance={() => {
          loading = true;
          return async ({ result, update }) => {
            loading = false;
            await update();
            if (result.type === 'success') {
              setTimeout(() => goto('/login'), 2000);
            }
          };
        }}
        class="setup-form"
      >
        <div class="form-group">
          <label for="username">Admin Username</label>
          <input
            type="text"
            id="username"
            name="username"
            required
            placeholder="Enter admin username"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="email">Email (optional)</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="admin@example.com"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            placeholder="Enter admin password"
            class="form-input"
          />
        </div>

        <button type="submit" class="submit-btn" disabled={loading}>
          {loading ? 'Creating...' : 'Create Admin User'}
        </button>
      </form>
    {/if}
  </div>
</div>

<style>
  .setup-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--nord0);
    padding: 1rem;
  }

  .setup-card {
    background: var(--nord1);
    border: 1px solid var(--nord3);
    border-radius: 8px;
    padding: 2rem;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .setup-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .setup-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--nord6);
    margin: 0 0 0.5rem 0;
  }

  .setup-subtitle {
    color: var(--nord4);
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.4;
  }

  .error-message {
    background: rgba(191, 97, 106, 0.1);
    color: var(--nord11);
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    border: 1px solid var(--nord11);
    font-size: 0.875rem;
  }

  .success-message {
    background: rgba(163, 190, 140, 0.1);
    color: var(--nord14);
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    border: 1px solid var(--nord14);
    font-size: 0.875rem;
  }

  .info-message {
    background: rgba(136, 192, 208, 0.1);
    color: var(--nord8);
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    border: 1px solid var(--nord8);
    font-size: 0.875rem;
    text-align: center;
  }

  .setup-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: 500;
    color: var(--nord5);
    font-size: 0.875rem;
  }

  .form-input {
    padding: 0.75rem;
    border: 1px solid var(--nord3);
    border-radius: 4px;
    background: var(--nord0);
    color: var(--nord6);
    font-size: 1rem;
    transition: border-color 0.2s ease;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--nord8);
    box-shadow: 0 0 0 3px rgba(136, 192, 208, 0.1);
  }

  .form-input::placeholder {
    color: var(--nord4);
  }

  .submit-btn {
    padding: 0.75rem;
    background: var(--nord8);
    color: var(--nord0);
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--nord7);
  }

  .submit-btn:disabled {
    background: var(--nord3);
    cursor: not-allowed;
  }

  a {
    color: var(--nord8);
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
</style>