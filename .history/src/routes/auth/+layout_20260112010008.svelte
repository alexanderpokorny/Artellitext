<!--
  Artellico - Auth Layout
  
  Completely standalone, minimalistic auth page.
  No header, no footer, no sidebar - just the content.
-->

<script lang="ts">
	import '../../app.css';
	
	let { children }: { children: any } = $props();
</script>

<div class="auth-layout-minimal">
	{@render children()}
</div>

<!-- Styles in app.css -->
