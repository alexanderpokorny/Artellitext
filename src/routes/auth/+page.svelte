<!--
  Artellico - Auth Page (Login/Register)
  
  Combined login and registration page with elegant typography.
-->

<script lang="ts">
	import { createI18n } from '$stores/i18n';
	import type { ActionData } from './$types';
	
	let { form }: { form: ActionData } = $props();
	
	const i18n = createI18n();
	
	// Toggle between login and register modes
	let mode = $state<'login' | 'register'>('login');
	
	// Form state
	let isSubmitting = $state(false);
</script>

<div class="auth-page">
	<div class="auth-container">
		<!-- Left column: Login -->
		<div class="auth-column">
			<div class="auth-header">
				<h1 class="auth-title">
					{mode === 'login' ? i18n.t('auth.login') : i18n.t('auth.register')}
				</h1>
				<p class="auth-subtitle">
					{mode === 'login' 
						? 'Willkommen zurück. Melden Sie sich an, um fortzufahren.'
						: 'Erstellen Sie ein Konto, um Artellico zu nutzen.'
					}
				</p>
			</div>
			
			{#if form?.error}
				<div class="error-message" role="alert">
					{i18n.t(form.error === 'invalid_credentials' ? 'auth.loginError' : 'auth.registerError')}
				</div>
			{/if}
			
			{#if form?.success}
				<div class="success-message" role="status">
					{i18n.t('auth.registerSuccess')}
				</div>
			{/if}
			
			<form 
				method="POST" 
				action={mode === 'login' ? '?/login' : '?/register'}
				class="auth-form"
			>
				{#if mode === 'register'}
					<div class="form-group">
						<label for="username" class="form-label">
							{i18n.t('auth.username')}
						</label>
						<input
							type="text"
							id="username"
							name="username"
							class="form-input"
							required
							minlength="3"
							maxlength="50"
							pattern="[a-zA-Z0-9_]+"
							autocomplete="username"
						/>
						<span class="form-hint">Nur Buchstaben, Zahlen und Unterstriche</span>
					</div>
				{/if}
				
				<div class="form-group">
					<label for="email" class="form-label">
						{i18n.t('auth.email')}
					</label>
					<input
						type="email"
						id="email"
						name="email"
						class="form-input"
						required
						autocomplete="email"
					/>
				</div>
				
				<div class="form-group">
					<label for="password" class="form-label">
						{i18n.t('auth.password')}
					</label>
					<input
						type="password"
						id="password"
						name="password"
						class="form-input"
						required
						minlength="8"
						autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
					/>
					{#if mode === 'register'}
						<span class="form-hint">Mindestens 8 Zeichen</span>
					{/if}
				</div>
				
				{#if mode === 'register'}
					<div class="form-group">
						<label for="confirmPassword" class="form-label">
							{i18n.t('auth.confirmPassword')}
						</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							class="form-input"
							required
							minlength="8"
							autocomplete="new-password"
						/>
					</div>
				{/if}
				
				<button 
					type="submit" 
					class="btn btn-primary btn-full"
					disabled={isSubmitting}
				>
					{mode === 'login' ? i18n.t('auth.login') : i18n.t('auth.register')}
				</button>
				
				{#if mode === 'login'}
					<a href="/auth/forgot-password" class="forgot-link">
						{i18n.t('auth.forgotPassword')}
					</a>
				{/if}
			</form>
			
			<div class="auth-switch">
				{#if mode === 'login'}
					<span class="switch-text">{i18n.t('auth.noAccount')}</span>
					<button 
						type="button" 
						class="switch-btn"
						onclick={() => mode = 'register'}
					>
						{i18n.t('auth.register')}
					</button>
				{:else}
					<span class="switch-text">{i18n.t('auth.hasAccount')}</span>
					<button 
						type="button" 
						class="switch-btn"
						onclick={() => mode = 'login'}
					>
						{i18n.t('auth.login')}
					</button>
				{/if}
			</div>
		</div>
		
		<!-- Right column: Branding/Quote -->
		<div class="brand-column">
			<blockquote class="brand-quote">
				<p>„Die Grenzen meiner Sprache bedeuten die Grenzen meiner Welt."</p>
				<cite>— Ludwig Wittgenstein</cite>
			</blockquote>
			
			<div class="brand-features">
				<div class="feature">
					<span class="feature-icon">📝</span>
					<span class="feature-text">Block-basierter Editor mit LaTeX-Support</span>
				</div>
				<div class="feature">
					<span class="feature-icon">📚</span>
					<span class="feature-text">Dokumenten-Bibliothek mit PDF-Viewer</span>
				</div>
				<div class="feature">
					<span class="feature-icon">🔍</span>
					<span class="feature-text">Semantische Suche mit KI</span>
				</div>
				<div class="feature">
					<span class="feature-icon">☁️</span>
					<span class="feature-text">Offline-First mit automatischer Synchronisation</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.auth-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - var(--header-height) - var(--status-bar-height) - var(--space-8));
		padding: var(--space-8) var(--space-4);
	}
	
	.auth-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-12);
		max-width: 900px;
		width: 100%;
	}
	
	.auth-column {
		max-width: 400px;
	}
	
	.auth-header {
		margin-bottom: var(--space-6);
	}
	
	.auth-title {
		font-family: var(--font-human);
		font-size: var(--font-size-2xl);
		font-weight: 500;
		color: var(--color-text);
		margin-bottom: var(--space-2);
	}
	
	.auth-subtitle {
		font-family: var(--font-human);
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		line-height: var(--line-height-relaxed);
	}
	
	.auth-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.btn-full {
		width: 100%;
		margin-top: var(--space-2);
	}
	
	.forgot-link {
		text-align: center;
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-decoration: none;
		transition: color var(--transition-fast);
	}
	
	.forgot-link:hover {
		color: var(--color-text);
	}
	
	.auth-switch {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		margin-top: var(--space-6);
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-border);
	}
	
	.switch-text {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	
	.switch-btn {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		font-weight: 600;
		color: var(--color-accent);
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	
	.switch-btn:hover {
		color: var(--color-accent-hover);
	}
	
	.error-message,
	.success-message {
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-sm);
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-4);
	}
	
	.error-message {
		background: rgba(220, 38, 38, 0.1);
		border: 1px solid var(--color-error);
		color: var(--color-error);
	}
	
	.success-message {
		background: rgba(22, 163, 74, 0.1);
		border: 1px solid var(--color-success);
		color: var(--color-success);
	}
	
	/* Brand column */
	.brand-column {
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: var(--space-8);
		background: var(--color-bg-sunken);
		border-radius: var(--radius-lg);
	}
	
	.brand-quote {
		font-family: var(--font-human);
		margin-bottom: var(--space-8);
	}
	
	.brand-quote p {
		font-size: var(--font-size-xl);
		font-style: italic;
		line-height: var(--line-height-relaxed);
		color: var(--color-text);
		margin-bottom: var(--space-3);
	}
	
	.brand-quote cite {
		font-family: var(--font-machine);
		font-size: var(--font-size-xs);
		font-style: normal;
		color: var(--color-text-muted);
		letter-spacing: var(--tracking-wider);
	}
	
	.brand-features {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	
	.feature {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	
	.feature-icon {
		font-size: var(--font-size-lg);
	}
	
	.feature-text {
		font-family: var(--font-machine);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
	
	@media (max-width: 767px) {
		.auth-container {
			grid-template-columns: 1fr;
			gap: var(--space-8);
		}
		
		.brand-column {
			display: none;
		}
		
		.auth-column {
			max-width: 100%;
		}
	}
</style>
