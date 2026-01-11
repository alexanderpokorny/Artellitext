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
	<!-- Statistics -->
	<section class="stats-section">
		<h2 class="section-title">{i18n.t('dashboard.statistics')}</h2>
		<div class="stats-grid">
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

<!-- Alle Styles sind zentral in app.css definiert -->
