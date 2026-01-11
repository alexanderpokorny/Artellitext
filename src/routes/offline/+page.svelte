<!--
  Artellico - Offline Page
  
  Displayed when user is offline and page is not cached.
-->

<script lang="ts">
	function retry() {
		window.location.reload();
	}
</script>

<div class="offline-page">
	<div class="offline-content">
		<div class="offline-icon">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
				<line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" stroke-width="2" />
			</svg>
		</div>
		
		<h1 class="offline-title">Keine Verbindung</h1>
		
		<p class="offline-text">
			Sie sind derzeit offline. Bitte prüfen Sie Ihre Internetverbindung.
		</p>
		
		<p class="offline-hint">
			Bereits gecachte Inhalte sind weiterhin verfügbar.
		</p>
		
		<button type="button" class="btn btn-primary" onclick={retry}>
			Erneut versuchen
		</button>
	</div>
</div>

<style>
	.offline-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: var(--space-8);
		background: var(--color-bg);
	}
	
	.offline-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 400px;
	}
	
	.offline-icon {
		width: 80px;
		height: 80px;
		margin-bottom: var(--space-6);
		color: var(--color-text-muted);
	}
	
	.offline-icon svg {
		width: 100%;
		height: 100%;
	}
	
	.offline-title {
		font-family: var(--font-human);
		font-size: var(--font-size-2xl);
		font-weight: 500;
		color: var(--color-text);
		margin-bottom: var(--space-4);
	}
	
	.offline-text {
		font-family: var(--font-human);
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		margin-bottom: var(--space-2);
		line-height: var(--line-height-relaxed);
	}
	
	.offline-hint {
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin-bottom: var(--space-8);
	}
</style>
