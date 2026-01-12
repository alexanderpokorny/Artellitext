<!--
  Artellico - Auth Page (Login/Register)
  
  Full-screen auth with library illustration and elegant form.
  Minimalistic: No header, no footer - just illustration (2/3) and form (1/3).
-->

<script lang="ts">
	import { createI18n } from '$stores/i18n.svelte';
	import { createTheme } from '$stores/theme.svelte';
	import ThemeToggle from '$components/ui/ThemeToggle.svelte';
	import LanguageSelector from '$components/ui/LanguageSelector.svelte';
	import type { ActionData } from './$types';
	
	let { form }: { form: ActionData } = $props();
	
	const i18n = createI18n();
	const themeStore = createTheme();
	
	// Toggle between login and register modes
	let mode = $state<'login' | 'register'>('login');
	
	// Form state
	let isSubmitting = $state(false);
</script>

<div class="auth-page-split">
	<!-- Controls: Theme/Language in top-right corner -->
	<div class="auth-controls">
		<LanguageSelector
			language={i18n.language}
			supportedLanguages={i18n.supportedLanguages}
			onSelect={i18n.setLanguage}
			compact
		/>
		<ThemeToggle 
			effectiveTheme={themeStore.effectiveTheme}
			onToggle={themeStore.toggle}
		/>
	</div>
	
	<!-- Left: Illustration (2/3) -->
	<div class="auth-illustration">
		<div class="illustration-container">
			<!-- Library illustration - SVG placeholder for now -->
			<svg viewBox="0 0 400 500" class="library-drawing" fill="none" xmlns="http://www.w3.org/2000/svg">
				<!-- Bookshelf structure -->
				<g stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.7">
					<!-- Shelf boards -->
					<line x1="50" y1="100" x2="350" y2="100" />
					<line x1="50" y1="200" x2="350" y2="200" />
					<line x1="50" y1="300" x2="350" y2="300" />
					<line x1="50" y1="400" x2="350" y2="400" />
					
					<!-- Shelf sides -->
					<line x1="50" y1="50" x2="50" y2="420" />
					<line x1="350" y1="50" x2="350" y2="420" />
					
					<!-- Top decoration -->
					<path d="M50 50 Q200 30 350 50" />
				</g>
				
				<!-- Books - Row 1 -->
				<g stroke="currentColor" stroke-width="1" fill="none" opacity="0.6">
					<rect x="70" y="55" width="25" height="42" rx="1" />
					<rect x="98" y="60" width="20" height="37" rx="1" />
					<rect x="122" y="52" width="30" height="45" rx="1" />
					<rect x="156" y="58" width="18" height="39" rx="1" />
					<rect x="178" y="54" width="35" height="43" rx="1" />
					<rect x="217" y="62" width="22" height="35" rx="1" />
					<rect x="243" y="56" width="28" height="41" rx="1" />
					<rect x="275" y="60" width="24" height="37" rx="1" />
					<rect x="303" y="55" width="30" height="42" rx="1" />
				</g>
				
				<!-- Books - Row 2 -->
				<g stroke="currentColor" stroke-width="1" fill="none" opacity="0.5">
					<rect x="65" y="155" width="28" height="42" rx="1" />
					<rect x="97" y="160" width="22" height="37" rx="1" />
					<rect x="123" y="152" width="32" height="45" rx="1" />
					<rect x="159" y="158" width="20" height="39" rx="1" />
					<rect x="183" y="154" width="38" height="43" rx="1" />
					<rect x="225" y="162" width="25" height="35" rx="1" />
					<rect x="254" y="156" width="30" height="41" rx="1" />
					<rect x="288" y="160" width="26" height="37" rx="1" />
					<rect x="318" y="155" width="18" height="42" rx="1" />
				</g>
				
				<!-- Books - Row 3 -->
				<g stroke="currentColor" stroke-width="1" fill="none" opacity="0.55">
					<rect x="60" y="255" width="30" height="42" rx="1" />
					<rect x="94" y="260" width="24" height="37" rx="1" />
					<rect x="122" y="252" width="28" height="45" rx="1" />
					<rect x="154" y="258" width="22" height="39" rx="1" />
					<rect x="180" y="254" width="35" height="43" rx="1" />
					<rect x="219" y="262" width="28" height="35" rx="1" />
					<rect x="251" y="256" width="32" height="41" rx="1" />
					<rect x="287" y="260" width="20" height="37" rx="1" />
					<rect x="311" y="255" width="26" height="42" rx="1" />
				</g>
				
				<!-- Decorative elements -->
				<g stroke="currentColor" stroke-width="1" fill="none" opacity="0.4">
					<!-- Globe on shelf -->
					<circle cx="85" cy="370" r="18" />
					<ellipse cx="85" cy="370" rx="18" ry="6" />
					<line x1="85" y1="352" x2="85" y2="388" />
					
					<!-- Stack of books lying flat -->
					<rect x="130" y="378" width="45" height="8" rx="1" />
					<rect x="135" y="370" width="40" height="8" rx="1" />
					<rect x="132" y="362" width="42" height="8" rx="1" />
					
					<!-- Quill/pen in holder -->
					<ellipse cx="250" cy="385" rx="12" ry="8" />
					<path d="M250 377 Q255 340 270 320" />
					
					<!-- Small plant -->
					<rect x="300" y="370" width="20" height="25" rx="2" />
					<path d="M310 370 Q305 355 310 340" />
					<path d="M310 370 Q315 350 308 335" />
					<path d="M310 370 Q320 358 325 345" />
				</g>
				
				<!-- Floating pencil lines (decorative) -->
				<g stroke="currentColor" stroke-width="0.5" opacity="0.3">
					<line x1="30" y1="480" x2="80" y2="460" />
					<line x1="320" y1="470" x2="380" y2="450" />
					<line x1="20" y1="30" x2="45" y2="45" />
				</g>
			</svg>
			
			<!-- Quote overlay -->
			<blockquote class="illustration-quote">
				<p>„Die Grenzen meiner Sprache bedeuten die Grenzen meiner Welt."</p>
				<cite>— Ludwig Wittgenstein</cite>
			</blockquote>
		</div>
	</div>
	
	<!-- Right: Auth Form -->
	<div class="auth-form-section">
		<div class="auth-form-container">
			<!-- Logo -->
			<div class="auth-logo-wrapper">
				<img 
					src="/icons/Artellico Logo.png" 
					alt="Artellico" 
					class="auth-logo"
				/>
			</div>
			
			<!-- Title -->
			<h1 class="auth-main-title">
				{mode === 'login' ? i18n.t('auth.login') : i18n.t('auth.register')}
			</h1>
			
			<!-- Error/Success Messages -->
			{#if form?.error}
				<div class="auth-message auth-message-error" role="alert">
					{i18n.t(form.error === 'invalid_credentials' ? 'auth.loginError' : 
						form.error === 'subscription_required' ? 'auth.subscriptionRequired' :
						form.error === 'subscription_expired' ? 'auth.subscriptionExpired' :
						'auth.registerError')}
				</div>
			{/if}
			
			{#if form?.success}
				<div class="auth-message auth-message-success" role="status">
					{i18n.t('auth.registerSuccess')}
				</div>
			{/if}
			
			<!-- OAuth Buttons -->
			<div class="oauth-buttons">
				<button type="button" class="oauth-btn" disabled>
					<svg viewBox="0 0 24 24" fill="currentColor" class="oauth-icon">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
					</svg>
					<span>Google</span>
				</button>
				
				<button type="button" class="oauth-btn" disabled>
					<svg viewBox="0 0 24 24" fill="currentColor" class="oauth-icon">
						<path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
					</svg>
					<span>Apple</span>
				</button>
				
				<button type="button" class="oauth-btn" disabled>
					<svg viewBox="0 0 24 24" fill="currentColor" class="oauth-icon">
						<path d="M11.4 24H1V10h10.4v14zm1.2-14H24v14H12.6V10zM11.4 0v9H1V0h10.4zm1.2 0h11.4v9H12.6V0z"/>
					</svg>
					<span>Microsoft</span>
				</button>
			</div>
			
			<div class="auth-divider">
				<span>{i18n.t('auth.orContinueWith')}</span>
			</div>
			
			<!-- Form -->
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
					class="btn btn-primary auth-submit-btn"
					disabled={isSubmitting}
				>
					{mode === 'login' ? i18n.t('auth.login') : i18n.t('auth.register')}
				</button>
			</form>
			
			<!-- Switch Mode -->
			<div class="auth-mode-switch">
				{#if mode === 'login'}
					<span class="auth-mode-text">{i18n.t('auth.noAccount')}</span>
					<button 
						type="button" 
						class="auth-mode-btn"
						onclick={() => mode = 'register'}
					>
						{i18n.t('auth.register')}
					</button>
				{:else}
					<span class="auth-mode-text">{i18n.t('auth.hasAccount')}</span>
					<button 
						type="button" 
						class="auth-mode-btn"
						onclick={() => mode = 'login'}
					>
						{i18n.t('auth.login')}
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Styles in app.css -->
