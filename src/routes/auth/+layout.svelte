<!--
  Artellico - Auth Layout
  
  Standalone layout for authentication pages.
  No sidebar, no app header - just a clean auth experience.
-->

<script lang="ts">
	import '../../app.css';
	import { browser } from '$app/environment';
	import ThemeSelector from '$components/ui/ThemeSelector.svelte';
	import LanguageSelector from '$components/ui/LanguageSelector.svelte';
	import { createTheme } from '$stores/theme.svelte';
	import { createI18n } from '$stores/i18n.svelte';
	
	let { children }: { children: any } = $props();
	
	// Initialize stores
	const themeStore = createTheme();
	const i18n = createI18n();
	
	// Get current year for copyright
	const currentYear = new Date().getFullYear();
</script>

<div class="auth-layout">
	<!-- Minimal Header with Theme/Language -->
	<header class="auth-layout-header">
		<div class="auth-layout-controls">
			<LanguageSelector
				language={i18n.language}
				supportedLanguages={i18n.supportedLanguages}
				onSelect={i18n.setLanguage}
				compact
			/>
			<ThemeSelector
				theme={themeStore.theme}
				effectiveTheme={themeStore.effectiveTheme}
				onSelect={themeStore.setTheme}
				t={i18n.t}
			/>
		</div>
	</header>
	
	<!-- Main Content -->
	<main class="auth-layout-main">
		{@render children()}
	</main>
	
	<!-- Minimal Footer -->
	<footer class="auth-layout-footer">
		<span class="copyright">© {currentYear} Artellico</span>
	</footer>
</div>

<!-- Styles in app.css -->
