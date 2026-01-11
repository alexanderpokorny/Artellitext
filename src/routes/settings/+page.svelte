<!--
  Artellico - Settings Page
  
  User profile, preferences, and API key management.
-->

<script lang="ts">
	import { createI18n } from '$stores/i18n';
	import { createTheme } from '$stores/theme';
	import type { PageData, ActionData } from './$types';
	import type { Theme, SupportedLanguage, CitationFormat } from '$types';
	
	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	const i18n = createI18n();
	const themeStore = createTheme();
	
	// Form state
	let displayName = $state(data.user?.displayName || '');
	let language = $state<SupportedLanguage>(i18n.language);
	let theme = $state<Theme>(themeStore.theme);
	let cacheLimit = $state(100);
	let enableGeolocation = $state(false);
	let citationFormat = $state<CitationFormat>('apa');
	
	// API Keys (masked)
	let openrouterKey = $state('');
	let openaiKey = $state('');
	
	// Active tab
	let activeTab = $state<'profile' | 'appearance' | 'cache' | 'api'>('profile');
	
	const citationFormats: { value: CitationFormat; label: string }[] = [
		{ value: 'apa', label: 'APA (7th Edition)' },
		{ value: 'mla', label: 'MLA (9th Edition)' },
		{ value: 'chicago', label: 'Chicago' },
		{ value: 'harvard', label: 'Harvard' },
		{ value: 'ieee', label: 'IEEE' },
		{ value: 'generic', label: 'Generic' },
	];
</script>

<div class="settings-page">
	<header class="page-header">
		<h1 class="page-title">{i18n.t('settings.title')}</h1>
	</header>
	
	<div class="settings-layout">
		<!-- Tabs navigation -->
		<nav class="settings-nav">
			<button
				type="button"
				class="nav-tab"
				class:active={activeTab === 'profile'}
				onclick={() => activeTab = 'profile'}
			>
				{i18n.t('settings.profile')}
			</button>
			<button
				type="button"
				class="nav-tab"
				class:active={activeTab === 'appearance'}
				onclick={() => activeTab = 'appearance'}
			>
				{i18n.t('settings.appearance')}
			</button>
			<button
				type="button"
				class="nav-tab"
				class:active={activeTab === 'cache'}
				onclick={() => activeTab = 'cache'}
			>
				{i18n.t('settings.cache')}
			</button>
			<button
				type="button"
				class="nav-tab"
				class:active={activeTab === 'api'}
				onclick={() => activeTab = 'api'}
			>
				{i18n.t('settings.apiKeys')}
			</button>
		</nav>
		
		<!-- Settings content -->
		<div class="settings-content">
			{#if form?.success}
				<div class="success-message" role="status">
					{i18n.t('settings.saved')}
				</div>
			{/if}
			
			<!-- Profile tab -->
			{#if activeTab === 'profile'}
				<form method="POST" action="?/updateProfile" class="settings-form">
					<section class="settings-section">
						<h2 class="section-title">{i18n.t('settings.profile')}</h2>
						
						<div class="form-group">
							<label for="displayName" class="form-label">Name</label>
							<input
								type="text"
								id="displayName"
								name="displayName"
								class="form-input"
								bind:value={displayName}
							/>
						</div>
						
						<div class="form-group">
							<label for="email" class="form-label">{i18n.t('auth.email')}</label>
							<input
								type="email"
								id="email"
								class="form-input"
								value={data.user?.email || ''}
								disabled
							/>
							<span class="form-hint">E-Mail kann nicht geändert werden</span>
						</div>
						
						<div class="form-group">
							<label for="username" class="form-label">{i18n.t('auth.username')}</label>
							<input
								type="text"
								id="username"
								class="form-input"
								value={data.user?.username || ''}
								disabled
							/>
						</div>
					</section>
					
					<section class="settings-section">
						<h2 class="section-title">{i18n.t('settings.citations')}</h2>
						
						<div class="form-group">
							<label for="citationFormat" class="form-label">Standard-Format</label>
							<select
								id="citationFormat"
								name="citationFormat"
								class="form-select"
								bind:value={citationFormat}
							>
								{#each citationFormats as format}
									<option value={format.value}>{format.label}</option>
								{/each}
							</select>
						</div>
					</section>
					
					<button type="submit" class="btn btn-primary">
						{i18n.t('action.save')}
					</button>
				</form>
			{/if}
			
			<!-- Appearance tab -->
			{#if activeTab === 'appearance'}
				<form method="POST" action="?/updateAppearance" class="settings-form">
					<section class="settings-section">
						<h2 class="section-title">{i18n.t('settings.theme')}</h2>
						
						<div class="theme-options">
							<label class="theme-option">
								<input
									type="radio"
									name="theme"
									value="light"
									checked={theme === 'light'}
									onchange={() => { theme = 'light'; themeStore.setTheme('light'); }}
								/>
								<span class="theme-preview theme-light">
									<span class="preview-icon">☀️</span>
								</span>
								<span class="theme-label">{i18n.t('settings.theme.light')}</span>
							</label>
							
							<label class="theme-option">
								<input
									type="radio"
									name="theme"
									value="dark"
									checked={theme === 'dark'}
									onchange={() => { theme = 'dark'; themeStore.setTheme('dark'); }}
								/>
								<span class="theme-preview theme-dark">
									<span class="preview-icon">🌙</span>
								</span>
								<span class="theme-label">{i18n.t('settings.theme.dark')}</span>
							</label>
							
							<label class="theme-option">
								<input
									type="radio"
									name="theme"
									value="auto"
									checked={theme === 'auto'}
									onchange={() => { theme = 'auto'; themeStore.setTheme('auto'); }}
								/>
								<span class="theme-preview theme-auto">
									<span class="preview-icon">💻</span>
								</span>
								<span class="theme-label">{i18n.t('settings.theme.auto')}</span>
							</label>
						</div>
					</section>
					
					<section class="settings-section">
						<h2 class="section-title">{i18n.t('settings.language')}</h2>
						
						<div class="form-group">
							<select
								name="language"
								class="form-select"
								bind:value={language}
								onchange={() => i18n.setLanguage(language)}
							>
								<option value="de">Deutsch</option>
								<option value="en">English</option>
								<option value="fr">Français</option>
								<option value="es">Español</option>
								<option value="it">Italiano</option>
							</select>
						</div>
					</section>
					
					<button type="submit" class="btn btn-primary">
						{i18n.t('action.save')}
					</button>
				</form>
			{/if}
			
			<!-- Cache tab -->
			{#if activeTab === 'cache'}
				<form method="POST" action="?/updateCache" class="settings-form">
					<section class="settings-section">
						<h2 class="section-title">{i18n.t('settings.cache')}</h2>
						
						<div class="form-group">
							<label for="cacheLimit" class="form-label">
								{i18n.t('settings.cacheLimit')}
							</label>
							<input
								type="number"
								id="cacheLimit"
								name="cacheLimit"
								class="form-input"
								min="10"
								max="1000"
								step="10"
								bind:value={cacheLimit}
							/>
							<span class="form-hint">Empfohlen: 100-500 Einträge</span>
						</div>
						
						<div class="form-group">
							<label class="checkbox-label">
								<input
									type="checkbox"
									name="enableGeolocation"
									bind:checked={enableGeolocation}
								/>
								<span>{i18n.t('settings.geolocation')}</span>
							</label>
							<span class="form-hint">Speichert den Standort beim Erstellen von Notizen</span>
						</div>
					</section>
					
					<section class="settings-section">
						<h2 class="section-title">Cache verwalten</h2>
						
						<div class="cache-stats">
							<div class="stat">
								<span class="stat-label">Gespeicherte Einträge</span>
								<span class="stat-value">42</span>
							</div>
							<div class="stat">
								<span class="stat-label">Speicherverbrauch</span>
								<span class="stat-value">12.4 MB</span>
							</div>
						</div>
						
						<button type="button" class="btn btn-secondary">
							Cache leeren
						</button>
					</section>
					
					<button type="submit" class="btn btn-primary">
						{i18n.t('action.save')}
					</button>
				</form>
			{/if}
			
			<!-- API Keys tab -->
			{#if activeTab === 'api'}
				<form method="POST" action="?/updateApiKeys" class="settings-form">
					<section class="settings-section">
						<h2 class="section-title">{i18n.t('settings.apiKeys')}</h2>
						<p class="section-description">
							Hinterlegen Sie Ihre eigenen API-Schlüssel für KI-Funktionen.
							Die Schlüssel werden verschlüsselt gespeichert.
						</p>
						
						<div class="form-group">
							<label for="openrouterKey" class="form-label">OpenRouter API Key</label>
							<input
								type="password"
								id="openrouterKey"
								name="openrouterKey"
								class="form-input"
								placeholder="sk-or-..."
								bind:value={openrouterKey}
								autocomplete="off"
							/>
						</div>
						
						<div class="form-group">
							<label for="openaiKey" class="form-label">OpenAI API Key</label>
							<input
								type="password"
								id="openaiKey"
								name="openaiKey"
								class="form-input"
								placeholder="sk-..."
								bind:value={openaiKey}
								autocomplete="off"
							/>
						</div>
					</section>
					
					<button type="submit" class="btn btn-primary">
						{i18n.t('action.save')}
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>

<style>
	.settings-page {
		max-width: 800px;
		margin: 0 auto;
	}
	
	.page-header {
		margin-bottom: var(--space-8);
	}
	
	.page-title {
		font-family: var(--font-human);
		font-size: var(--font-size-2xl);
		font-weight: 500;
		color: var(--color-text);
	}
	
	.settings-layout {
		display: flex;
		gap: var(--space-8);
	}
	
	/* Navigation */
	.settings-nav {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		width: 200px;
		flex-shrink: 0;
	}
	
	.nav-tab {
		padding: var(--space-3) var(--space-4);
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		letter-spacing: var(--tracking-wide);
		text-align: left;
		color: var(--color-text-secondary);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.nav-tab:hover {
		color: var(--color-text);
		background: var(--color-bg-sunken);
	}
	
	.nav-tab.active {
		color: var(--color-text);
		background: var(--color-bg-sunken);
		font-weight: 500;
	}
	
	/* Content */
	.settings-content {
		flex: 1;
		min-width: 0;
	}
	
	.success-message {
		padding: var(--space-3) var(--space-4);
		margin-bottom: var(--space-6);
		background: rgba(22, 163, 74, 0.1);
		border: 1px solid var(--color-success);
		border-radius: var(--radius-sm);
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		color: var(--color-success);
	}
	
	.settings-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}
	
	.settings-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.section-title {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		font-weight: 600;
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-secondary);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--color-border);
	}
	
	.section-description {
		font-family: var(--font-human);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		line-height: var(--line-height-relaxed);
	}
	
	/* Theme options */
	.theme-options {
		display: flex;
		gap: var(--space-4);
	}
	
	.theme-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		cursor: pointer;
	}
	
	.theme-option input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	
	.theme-preview {
		width: 80px;
		height: 60px;
		border-radius: var(--radius-md);
		border: 2px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		transition: border-color var(--transition-fast);
	}
	
	.theme-option input:checked + .theme-preview {
		border-color: var(--color-accent);
	}
	
	.theme-light {
		background: var(--gray-100);
	}
	
	.theme-dark {
		background: var(--gray-800);
	}
	
	.theme-auto {
		background: linear-gradient(135deg, var(--gray-100) 50%, var(--gray-800) 50%);
	}
	
	.theme-label {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}
	
	/* Checkbox */
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		cursor: pointer;
	}
	
	.checkbox-label input {
		width: 18px;
		height: 18px;
		accent-color: var(--color-accent);
	}
	
	.checkbox-label span {
		font-family: var(--font-human);
		font-size: var(--font-size-base);
		color: var(--color-text);
	}
	
	/* Cache stats */
	.cache-stats {
		display: flex;
		gap: var(--space-6);
		padding: var(--space-4);
		background: var(--color-bg-sunken);
		border-radius: var(--radius-md);
	}
	
	.stat {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	
	.stat-label {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	
	.stat-value {
		font-family: var(--font-machine);
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text);
	}
	
	@media (max-width: 767px) {
		.settings-layout {
			flex-direction: column;
		}
		
		.settings-nav {
			width: 100%;
			flex-direction: row;
			overflow-x: auto;
		}
		
		.nav-tab {
			white-space: nowrap;
		}
		
		.theme-options {
			flex-wrap: wrap;
		}
	}
</style>
