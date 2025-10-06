<script lang="ts">
  import { onMount } from 'svelte';

  let deferredPrompt: any = null;
  let showInstallPrompt = $state(false);
  let isInstalled = $state(false);

  onMount(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled = true;
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallPrompt = true;
    });

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
      showInstallPrompt = false;
      isInstalled = true;
      deferredPrompt = null;
    });
  });

  async function installApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        showInstallPrompt = false;
      }
      
      deferredPrompt = null;
    }
  }

  function dismissPrompt() {
    showInstallPrompt = false;
  }
</script>

{#if showInstallPrompt && !isInstalled}
  <div class="fixed bottom-4 right-4 bg-nord-0 border border-nord-3 rounded-lg p-4 shadow-lg max-w-sm z-50">
    <div class="flex items-start gap-3">
      <div class="flex-1">
        <h3 class="text-nord-6 font-medium mb-1">Install App</h3>
        <p class="text-nord-4 text-sm mb-3">
          Install this app for quick access and offline use.
        </p>
        <div class="flex gap-2">
          <button
            onclick={installApp}
            class="px-3 py-1.5 bg-nord-8 text-nord-6 rounded text-sm font-medium hover:bg-nord-9 transition-colors"
          >
            Install
          </button>
          <button
            onclick={dismissPrompt}
            class="px-3 py-1.5 text-nord-4 rounded text-sm hover:text-nord-6 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
      <button
        onclick={dismissPrompt}
        class="text-nord-4 hover:text-nord-6 transition-colors"
      >
        ×
      </button>
    </div>
  </div>
{/if}