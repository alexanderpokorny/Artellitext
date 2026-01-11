<!--
  Artellico - Status Bar Component
  
  Bottom status bar showing context-dependent information and sync status.
-->

<script lang="ts">
	import type { SyncStatus } from '$types';
	
	interface Props {
		syncStatus: SyncStatus;
		itemCount?: number;
		wordCount?: number;
		readingTime?: number;
		documentCount?: number;
		context?: 'knowledge' | 'literature' | 'default';
		t: (key: string, params?: Record<string, string | number>) => string;
	}
	
	let {
		syncStatus = 'synced',
		itemCount,
		wordCount,
		readingTime,
		documentCount,
		context = 'default',
		t,
	}: Props = $props();
	
	const currentYear = new Date().getFullYear();
</script>

<footer class="status-bar">
	<!-- Left: Copyright -->
	<div class="status-left">
		<span class="copyright">©ARTELLICO {currentYear}</span>
	</div>
	
	<!-- Center: Context-dependent info -->
	<div class="status-center">
		{#if context === 'knowledge' && wordCount !== undefined}
			<span class="status-item">
				{t('status.words', { count: wordCount })}
			</span>
			{#if readingTime !== undefined}
				<span class="status-separator">•</span>
				<span class="status-item">
					{readingTime} min
				</span>
			{/if}
		{:else if context === 'knowledge' && itemCount !== undefined}
			<span class="status-item">
				{t('status.items', { count: itemCount })}
			</span>
		{:else if context === 'literature' && documentCount !== undefined}
			<span class="status-item">
				{t('status.documents', { count: documentCount })}
			</span>
		{:else if itemCount !== undefined}
			<span class="status-item">
				{t('status.items', { count: itemCount })}
			</span>
		{/if}
	</div>
	
	<!-- Right: Sync status -->
	<div class="status-right">
		<div class="sync-status" class:synced={syncStatus === 'synced'} class:syncing={syncStatus === 'syncing'} class:offline={syncStatus === 'offline'} class:error={syncStatus === 'error'}>
			<span class="sync-indicator"></span>
			<span class="sync-text">
				{#if syncStatus === 'synced'}
					{t('status.synced')}
				{:else if syncStatus === 'syncing'}
					{t('status.syncing')}
				{:else}
					{t('status.offline')}
				{/if}
			</span>
		</div>
	</div>
</footer>

<style>
	.status-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: var(--status-bar-height);
		padding: 0 var(--site-padding);
		background: var(--color-bg-elevated);
		border-top: 1px solid var(--color-border);
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	
	.status-left,
	.status-center,
	.status-right {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	
	.status-left {
		flex: 1;
	}
	
	.status-center {
		flex: 2;
		justify-content: center;
	}
	
	.status-right {
		flex: 1;
		justify-content: flex-end;
	}
	
	.copyright {
		letter-spacing: var(--tracking-wider);
	}
	
	.status-separator {
		color: var(--color-border-strong);
	}
	
	.sync-status {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	
	.sync-indicator {
		width: 8px;
		height: 8px;
		border-radius: var(--radius-full);
		background: var(--color-text-muted);
	}
	
	.sync-status.synced .sync-indicator {
		background: var(--color-sync-ok);
	}
	
	.sync-status.syncing .sync-indicator {
		background: var(--color-sync-pending);
		animation: pulse 1s ease-in-out infinite;
	}
	
	.sync-status.offline .sync-indicator,
	.sync-status.error .sync-indicator {
		background: var(--color-sync-offline);
	}
	
	.sync-text {
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
	}
	
	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
	
	@media (max-width: 767px) {
		.status-center {
			display: none;
		}
		
		.sync-text {
			display: none;
		}
	}
</style>
