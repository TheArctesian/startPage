<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import BaseModal from './BaseModal.svelte';

  export let isOpen: boolean = false;
  export let title: string = '';
  export let size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  export let submitText: string = 'Save';
  export let cancelText: string = 'Cancel';
  export let submitDisabled: boolean = false;
  export let loading: boolean = false;
  export let closable: boolean = true;

  const dispatch = createEventDispatcher<{
    submit: void;
    cancel: void;
    close: void;
  }>();

  function handleSubmit(event: Event) {
    event.preventDefault();
    if (!submitDisabled && !loading) {
      dispatch('submit');
    }
  }

  function handleCancel() {
    dispatch('cancel');
    close();
  }

  function close() {
    isOpen = false;
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSubmit();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<BaseModal
  {isOpen}
  {title}
  {size}
  {closable}
  on:close={close}
>
  <form onsubmit={handleSubmit}>
    <div class="form-content">
      <slot />
    </div>
  </form>

  <div slot="footer" class="form-actions">
    <button
      type="button"
      class="btn btn-secondary"
      onclick={handleCancel}
      disabled={loading}
    >
      {cancelText}
    </button>
    
    <button
      type="submit"
      class="btn btn-primary"
      disabled={submitDisabled || loading}
      onclick={handleSubmit}
    >
      {#if loading}
        <div class="loading-spinner"></div>
      {/if}
      {submitText}
    </button>
  </div>
</BaseModal>

<style>
  .form-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    width: 100%;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--nord8);
    border-color: var(--nord8);
    color: var(--nord6);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--nord7);
    border-color: var(--nord7);
  }

  .btn-primary:active:not(:disabled) {
    background: var(--nord9);
    border-color: var(--nord9);
  }

  .btn-secondary {
    background: transparent;
    border-color: var(--nord4);
    color: var(--nord1);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--nord4);
    color: var(--nord0);
  }

  .loading-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 640px) {
    .form-actions {
      flex-direction: column-reverse;
    }

    .btn {
      width: 100%;
      justify-content: center;
    }
  }
</style>