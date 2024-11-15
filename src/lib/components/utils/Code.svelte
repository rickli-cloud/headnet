<script lang="ts">
	import type { ClassValue } from 'clsx';
	import { stringify } from 'yaml';

	interface $$Props extends Partial<HTMLPreElement> {
		class?: ClassValue;
		json?: any;
		yaml?: any;
	}

	export let json: $$Props['json'] = undefined;
	export let yaml: $$Props['yaml'] = undefined;
</script>

<!-- prettier-ignore -->
<pre {...$$restProps}><code><slot>{#if yaml}{stringify(yaml)}{:else if json}{JSON.stringify(json, null, 2)}{/if}</slot></code></pre>
