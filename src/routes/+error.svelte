<!--
  Artellico - Error Page
  
  Custom error page with consistent styling.
-->

<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="error-page">
	<div class="error-content">
		<span class="error-code">{$page.status}</span>
		
		<h1 class="error-title">
			{#if $page.status === 404}
				Seite nicht gefunden
			{:else if $page.status === 403}
				Zugriff verweigert
			{:else if $page.status === 500}
				Serverfehler
			{:else}
				Ein Fehler ist aufgetreten
			{/if}
		</h1>
		
		<p class="error-message">
			{$page.error?.message || 'Etwas ist schiefgelaufen.'}
		</p>
		
		<div class="error-actions">
			<a href="/" class="btn btn-primary">Zur Startseite</a>
			<button type="button" class="btn btn-secondary" onclick={() => history.back()}>
				Zurück
			</button>
		</div>
	</div>
</div>

<style>
	.error-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - var(--header-height) - var(--status-bar-height));
		padding: var(--space-8);
	}
	
	.error-content {
		text-align: center;
		max-width: 480px;
	}
	
	.error-code {
		display: block;
		font-family: var(--font-machine);
		font-size: 6rem;
		font-weight: 700;
		color: var(--color-text-muted);
		opacity: 0.3;
		line-height: 1;
		margin-bottom: var(--space-4);
	}
	
	.error-title {
		font-family: var(--font-human);
		font-size: var(--font-size-2xl);
		font-weight: 500;
		color: var(--color-text);
		margin-bottom: var(--space-3);
	}
	
	.error-message {
		font-family: var(--font-human);
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		margin-bottom: var(--space-8);
		line-height: var(--line-height-relaxed);
	}
	
	.error-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: center;
	}
</style>
