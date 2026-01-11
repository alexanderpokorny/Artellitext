<!--
  Artellico - Auth Page (Login/Register)
  
  Minimalist login page with underline-only inputs.
-->

<script lang="ts">
	import { createI18n } from '$stores/i18n.svelte';
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
		<!-- Logo/Brand -->
		<div class="auth-brand">
			<img 
				src="/icons/Artellico Logo.png" 
				alt="Artellico" 
				class="auth-logo"
			/>
		</div>
		
		<!-- Auth Form -->
		<div class="auth-card">
			<h1 class="auth-title">
				{mode === 'login' ? i18n.t('auth.login') : i18n.t('auth.register')}
			</h1>
			
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
					class="btn btn-primary auth-submit"
					disabled={isSubmitting}
				>
					{mode === 'login' ? i18n.t('auth.login') : i18n.t('auth.register')}
				</button>
			</form>
			
			<div class="auth-footer">
				{#if mode === 'login'}
					<span class="auth-switch-text">{i18n.t('auth.noAccount')}</span>
					<button 
						type="button" 
						class="auth-switch-btn"
						onclick={() => mode = 'register'}
					>
						{i18n.t('auth.register')}
					</button>
				{:else}
					<span class="auth-switch-text">{i18n.t('auth.hasAccount')}</span>
					<button 
						type="button" 
						class="auth-switch-btn"
						onclick={() => mode = 'login'}
					>
						{i18n.t('auth.login')}
					</button>
				{/if}
			</div>
		</div>
		
		<!-- Quote -->
		<blockquote class="auth-quote">
			<p>„Die Grenzen meiner Sprache bedeuten die Grenzen meiner Welt."</p>
			<cite>— Ludwig Wittgenstein</cite>
		</blockquote>
	</div>
</div>

<!-- Styles in app.css -->
