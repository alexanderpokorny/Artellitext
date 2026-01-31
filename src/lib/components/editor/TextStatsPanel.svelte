<!--
  Artellico - Text Statistics Panel
  
  Displays comprehensive text analysis metrics including:
  - Word count, character count, sentence count
  - Reading time and speaking time
  - Readability scores (Flesch Reading Ease, Flesch-Kincaid Grade, etc.)
  - Writing quality metrics (Hemingway-style)
-->

<script lang="ts">
	import { createI18n } from '$stores/i18n.svelte';
	
	interface TextStats {
		characters: number;
		charactersNoSpaces: number;
		words: number;
		sentences: number;
		paragraphs: number;
		readingTime: number;
		speakingTime: number;
		avgWordsPerSentence: number;
		avgSyllablesPerWord: number;
		fleschReadingEase: number;
		fleschKincaidGrade: number;
		gunningFog: number;
		hardSentences: number;
		veryHardSentences: number;
		adverbs: number;
		passiveVoice: number;
	}
	
	interface Props {
		stats: TextStats;
	}
	
	let { stats }: Props = $props();
	
	const i18n = createI18n();
	
	// Reading ease color coding
	function getReadabilityColor(score: number): string {
		if (score >= 80) return 'var(--color-success)';
		if (score >= 60) return 'var(--color-accent)';
		if (score >= 40) return 'var(--color-warning)';
		return 'var(--color-error)';
	}
	
	// Reading ease label
	function getReadabilityLabel(score: number): string {
		if (score >= 90) return i18n.t('stats.readability.veryEasy');
		if (score >= 80) return i18n.t('stats.readability.easy');
		if (score >= 70) return i18n.t('stats.readability.fairlyEasy');
		if (score >= 60) return i18n.t('stats.readability.standard');
		if (score >= 50) return i18n.t('stats.readability.fairlyDifficult');
		if (score >= 30) return i18n.t('stats.readability.difficult');
		return i18n.t('stats.readability.veryDifficult');
	}
	
	// Grade level description
	function getGradeLabel(grade: number): string {
		if (grade <= 5) return i18n.t('stats.grade.elementary');
		if (grade <= 8) return i18n.t('stats.grade.middleSchool');
		if (grade <= 12) return i18n.t('stats.grade.highSchool');
		return i18n.t('stats.grade.college');
	}
</script>

<div class="stats-panel">
	<!-- Basic Counts -->
	<section class="stats-section">
		<h4 class="stats-section-title">{i18n.t('stats.counts')}</h4>
		<div class="stats-grid">
			<div class="stat-item">
				<span class="stat-value">{stats.words.toLocaleString()}</span>
				<span class="stat-label">{i18n.t('stats.words')}</span>
			</div>
			<div class="stat-item">
				<span class="stat-value">{stats.characters.toLocaleString()}</span>
				<span class="stat-label">{i18n.t('stats.characters')}</span>
			</div>
			<div class="stat-item">
				<span class="stat-value">{stats.sentences}</span>
				<span class="stat-label">{i18n.t('stats.sentences')}</span>
			</div>
			<div class="stat-item">
				<span class="stat-value">{stats.paragraphs}</span>
				<span class="stat-label">{i18n.t('stats.paragraphs')}</span>
			</div>
		</div>
	</section>
	
	<!-- Time Estimates -->
	<section class="stats-section">
		<h4 class="stats-section-title">{i18n.t('stats.time')}</h4>
		<div class="stats-grid">
			<div class="stat-item">
				<span class="stat-value">{stats.readingTime}</span>
				<span class="stat-label">{i18n.t('stats.readingTimeMin')}</span>
			</div>
			<div class="stat-item">
				<span class="stat-value">{stats.speakingTime}</span>
				<span class="stat-label">{i18n.t('stats.speakingTimeMin')}</span>
			</div>
		</div>
	</section>
	
	<!-- Readability Scores -->
	<section class="stats-section">
		<h4 class="stats-section-title">{i18n.t('stats.readability')}</h4>
		
		<!-- Flesch Reading Ease (main indicator) -->
		<div class="readability-main">
			<div class="readability-score" style="color: {getReadabilityColor(stats.fleschReadingEase)}">
				{stats.fleschReadingEase}
			</div>
			<div class="readability-label">
				{getReadabilityLabel(stats.fleschReadingEase)}
			</div>
			<div class="readability-bar">
				<div 
					class="readability-fill" 
					style="width: {Math.min(100, stats.fleschReadingEase)}%; background: {getReadabilityColor(stats.fleschReadingEase)}"
				></div>
			</div>
			<span class="readability-name">Flesch Reading Ease</span>
		</div>
		
		<!-- Other scores -->
		<div class="stats-list">
			<div class="stat-row">
				<span class="stat-row-label">Flesch-Kincaid</span>
				<span class="stat-row-value">{stats.fleschKincaidGrade.toFixed(1)}</span>
				<span class="stat-row-desc">{getGradeLabel(stats.fleschKincaidGrade)}</span>
			</div>
			<div class="stat-row">
				<span class="stat-row-label">Gunning Fog</span>
				<span class="stat-row-value">{stats.gunningFog.toFixed(1)}</span>
			</div>
			<div class="stat-row">
				<span class="stat-row-label">{i18n.t('stats.avgWordsPerSentence')}</span>
				<span class="stat-row-value">{stats.avgWordsPerSentence.toFixed(1)}</span>
			</div>
		</div>
	</section>
	
	<!-- Writing Quality (Hemingway-style) -->
	<section class="stats-section">
		<h4 class="stats-section-title">{i18n.t('stats.quality')}</h4>
		<div class="quality-metrics">
			<div class="quality-item" class:warning={stats.hardSentences > 2}>
				<span class="quality-count">{stats.hardSentences}</span>
				<span class="quality-label">{i18n.t('stats.hardSentences')}</span>
				<span class="quality-indicator hard"></span>
			</div>
			<div class="quality-item" class:warning={stats.veryHardSentences > 0}>
				<span class="quality-count">{stats.veryHardSentences}</span>
				<span class="quality-label">{i18n.t('stats.veryHardSentences')}</span>
				<span class="quality-indicator very-hard"></span>
			</div>
			<div class="quality-item" class:warning={stats.adverbs > 3}>
				<span class="quality-count">{stats.adverbs}</span>
				<span class="quality-label">{i18n.t('stats.adverbs')}</span>
				<span class="quality-indicator adverb"></span>
			</div>
			<div class="quality-item" class:warning={stats.passiveVoice > 2}>
				<span class="quality-count">{stats.passiveVoice}</span>
				<span class="quality-label">{i18n.t('stats.passiveVoice')}</span>
				<span class="quality-indicator passive"></span>
			</div>
		</div>
	</section>
</div>

<style>
	.stats-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.stats-section {
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--color-border-subtle);
	}
	
	.stats-section:last-child {
		border-bottom: none;
	}
	
	.stats-section-title {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--tracking-wider);
		color: var(--color-text-muted);
		margin: 0 0 var(--space-2) 0;
	}
	
	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2);
	}
	
	.stat-item {
		display: flex;
		flex-direction: column;
		padding: var(--space-2);
		background: var(--color-bg-sunken);
		border-radius: var(--radius-sm);
	}
	
	/* Dark mode: darker boxes for stats */
	:global(html.dark) .stat-item {
		background: #1a1a1a;
	}
	
	.stat-value {
		font-family: var(--font-mono);
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text);
	}
	
	.stat-label {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	
	/* Readability main indicator */
	.readability-main {
		text-align: center;
		padding: var(--space-3);
		background: var(--color-bg-sunken);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-3);
	}
	
	/* Dark mode: darker boxes */
	:global(html.dark) .readability-main {
		background: #1a1a1a;
	}
	
	.readability-score {
		font-family: var(--font-mono);
		font-size: var(--font-size-3xl);
		font-weight: 700;
		line-height: 1;
	}
	
	.readability-label {
		font-family: var(--font-human);
		font-size: var(--font-size-sm);
		color: var(--color-text);
		margin: var(--space-1) 0;
	}
	
	.readability-bar {
		height: 4px;
		background: var(--color-bg);
		border-radius: var(--radius-full);
		margin: var(--space-2) 0;
		overflow: hidden;
	}
	
	.readability-fill {
		height: 100%;
		border-radius: var(--radius-full);
		transition: width var(--transition-base);
	}
	
	.readability-name {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	
	/* Stats list */
	.stats-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	
	.stat-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1) 0;
	}
	
	.stat-row-label {
		flex: 1;
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}
	
	.stat-row-value {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-text);
	}
	
	.stat-row-desc {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	
	/* Quality metrics (Hemingway-style) */
	.quality-metrics {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	
	.quality-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2);
		background: var(--color-bg-sunken);
		border-radius: var(--radius-sm);
		transition: background var(--transition-fast);
	}
	
	/* Dark mode: darker boxes */
	:global(html.dark) .quality-item {
		background: #1a1a1a;
	}
	
	.quality-item.warning {
		background: color-mix(in srgb, var(--color-warning) 15%, var(--color-bg-sunken));
	}
	
	.quality-count {
		font-family: var(--font-mono);
		font-size: var(--font-size-lg);
		font-weight: 600;
		min-width: 32px;
		text-align: center;
	}
	
	.quality-label {
		flex: 1;
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}
	
	.quality-indicator {
		width: 12px;
		height: 12px;
		border-radius: var(--radius-sm);
	}
	
	.quality-indicator.hard {
		background: var(--color-warning);
	}
	
	.quality-indicator.very-hard {
		background: var(--color-error);
	}
	
	.quality-indicator.adverb {
		background: #9333ea;
	}
	
	.quality-indicator.passive {
		background: #06b6d4;
	}
</style>
