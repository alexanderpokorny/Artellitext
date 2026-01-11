<!--
  Artellico - Dashboard (Home Page)
  
  Landing page showing recent notes, quick actions, and statistics.
-->

<script lang="ts">
	import type { PageData } from './$types';
	import { createI18n } from '$stores/i18n.svelte';
	
	let { data }: { data: PageData } = $props();
	
	const i18n = createI18n();
	
	// Demo data for initial display
	const stats = {
		notes: 42,
		documents: 18,
		storage: '2.4 GB',
	};
	
	const recentNotes = [
		{ id: '1', title: 'Einführung in die Epistemologie', excerpt: 'Die Erkenntnistheorie befasst sich mit den grundlegenden Fragen...', updatedAt: new Date(Date.now() - 3600000) },
		{ id: '2', title: 'Kant und die synthetischen Urteile a priori', excerpt: 'Kants kritische Philosophie unterscheidet zwischen analytischen...', updatedAt: new Date(Date.now() - 86400000) },
		{ id: '3', title: 'Notizen zur Phänomenologie', excerpt: 'Husserls phänomenologische Methode der Epoché...', updatedAt: new Date(Date.now() - 172800000) },
	];
	
	function formatTimeAgo(date: Date): string {
		const diff = Date.now() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);
		
		if (minutes < 60) return i18n.t('time.minutesAgo', { minutes });
		if (hours < 24) return i18n.t('time.hoursAgo', { hours });
		return i18n.t('time.daysAgo', { days });
	}
</script>

<div class="dashboard">
	<!-- Welcome Section -->
	<header class="dashboard-header">
		<h1 class="welcome-title">
			{#if data.user}
				{i18n.t('dashboard.welcome', { name: data.user.displayName || data.user.username })}
			{:else}
				{i18n.t('app.name')}
			{/if}
		</h1>
		<p class="welcome-subtitle">{i18n.t('app.tagline')}</p>
	</header>
	
	<!-- Statistics -->
	<section class="stats-section">
		<div class="stat-card">
			<span class="stat-value">{stats.notes}</span>
			<span class="stat-label">{i18n.t('dashboard.stats.notes')}</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{stats.documents}</span>
			<span class="stat-label">{i18n.t('dashboard.stats.documents')}</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{stats.storage}</span>
			<span class="stat-label">{i18n.t('dashboard.stats.storage')}</span>
		</div>
	</section>
	
	<!-- Quick Actions -->
	<section class="quick-actions">
		<h2 class="section-title">{i18n.t('dashboard.quickActions')}</h2>
		<div class="actions-grid">
			<a href="/editor/new" class="action-card">
				<span class="action-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 20h9" />
						<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
					</svg>
				</span>
				<span class="action-label">{i18n.t('dashboard.newNote')}</span>
			</a>
			<a href="/literatur/upload" class="action-card">
				<span class="action-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="17 8 12 3 7 8" />
						<line x1="12" y1="3" x2="12" y2="15" />
					</svg>
				</span>
				<span class="action-label">{i18n.t('dashboard.uploadDoc')}</span>
			</a>
		</div>
	</section>
	
	<!-- Recent Notes -->
	<section class="recent-section">
		<h2 class="section-title">{i18n.t('dashboard.recentNotes')}</h2>
		<div class="notes-list">
			{#each recentNotes as note}
				<a href="/editor/{note.id}" class="note-card">
					<h3 class="note-title">{note.title}</h3>
					<p class="note-excerpt">{note.excerpt}</p>
					<span class="note-time">{formatTimeAgo(note.updatedAt)}</span>
				</a>
			{/each}
		</div>
	</section>
</div>

<style>
	.dashboard {
		max-width: var(--content-wide-max-width);
		margin: 0 auto;
	}
	
	.dashboard-header {
		margin-bottom: var(--space-8);
	}
	
	.welcome-title {
		font-family: var(--font-human);
		font-size: var(--font-size-3xl);
		font-weight: 500;
		line-height: var(--line-height-tight);
		color: var(--color-text);
		margin-bottom: var(--space-2);
	}
	
	.welcome-subtitle {
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-muted);
	}
	
	/* Statistics */
	.stats-section {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: var(--space-4);
		margin-bottom: var(--space-8);
	}
	
	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-6);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}
	
	.stat-value {
		font-family: var(--font-machine);
		font-size: var(--font-size-2xl);
		font-weight: 600;
		color: var(--color-text);
	}
	
	.stat-label {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin-top: var(--space-1);
	}
	
	/* Section titles */
	.section-title {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		font-weight: 600;
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-secondary);
		margin-bottom: var(--space-4);
	}
	
	/* Quick Actions */
	.quick-actions {
		margin-bottom: var(--space-8);
	}
	
	.actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-4);
	}
	
	.action-card {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-5);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: all var(--transition-fast);
	}
	
	.action-card:hover {
		border-color: var(--color-accent);
		transform: translateY(-2px);
	}
	
	.action-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		background: var(--color-bg-sunken);
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
	}
	
	.action-icon svg {
		width: 24px;
		height: 24px;
	}
	
	.action-label {
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text);
	}
	
	/* Recent Notes */
	.recent-section {
		margin-bottom: var(--space-8);
	}
	
	.notes-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	
	.note-card {
		display: block;
		padding: var(--space-5);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: all var(--transition-fast);
	}
	
	.note-card:hover {
		border-color: var(--color-border-strong);
	}
	
	.note-title {
		font-family: var(--font-human);
		font-size: var(--font-size-lg);
		font-weight: 500;
		color: var(--color-text);
		margin-bottom: var(--space-2);
		line-height: var(--line-height-tight);
	}
	
	.note-excerpt {
		font-family: var(--font-human);
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		line-height: var(--line-height-relaxed);
		margin-bottom: var(--space-3);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.note-time {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		letter-spacing: var(--tracking-wide);
	}
	
	@media (max-width: 767px) {
		.welcome-title {
			font-size: var(--font-size-2xl);
		}
		
		.stat-card {
			padding: var(--space-4);
		}
	}
</style>
