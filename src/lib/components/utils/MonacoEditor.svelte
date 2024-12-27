<script lang="ts">
	import { mode } from 'mode-watcher';
	import { get, type Writable } from 'svelte/store';
	import { createEventDispatcher, onMount } from 'svelte';
	import type { editor as Editor, IScrollEvent } from 'monaco-editor/esm/vs/editor/editor.api';

	import Loading from './Spinner.svelte';
	import ErrorComponent from './ErrorComponent.svelte';

	interface $$Props extends Partial<HTMLDivElement> {
		content: Writable<string>;
		lang?: string;
		readonly?: boolean;
	}

	export let content: $$Props['content'];
	export let lang: $$Props['lang'] = 'json';
	export let readonly: $$Props['readonly'] = false;

	const dispatch = createEventDispatcher<{ change: string; scroll: IScrollEvent }>();
	const observer = new ResizeObserver(resizeEditor);

	let editorEl: HTMLDivElement;
	let editor: Editor.IStandaloneCodeEditor;

	const themes: {
		customDark: Editor.IStandaloneThemeData;
		customLight: Editor.IStandaloneThemeData;
	} = {
		customDark: {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '888888' },
				{ token: 'string', foreground: 'ce9178' }
			],
			colors: {
				// 'editor.foreground': '#FFFFFF',
				'editor.background': '#0a0a0a'
				// 'editor.selectionBackground': '#2a2a2b',
				// 'editor.lineHighlightBackground': '#2a2a2b',
				// 'editorCursor.foreground': '#FFFFFF',
				// 'editorWhitespace.foreground': '#FFFFFF'
			}
		},

		customLight: {
			base: 'vs',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '888888' },
				{ token: 'string', foreground: 'ce9178' }
			],
			colors: {
				// 'editor.foreground': '#000000',
				'editor.background': '#FFFFFF'
				// 'editor.selectionBackground': '#FEFEFE',
				// 'editor.lineHighlightBackground': '#FEFEFE',
				// 'editorCursor.foreground': '#000000',
				// 'editorWhitespace.foreground': '#000000'
			}
		}
	};

	mode.subscribe((currentMode) => {
		editor?.updateOptions({ theme: currentMode === 'dark' ? 'customDark' : 'customLight' });
	});

	async function init() {
		const { editor: Editor } = await import('monaco-editor/esm/vs/editor/editor.api');

		Editor.defineTheme('customDark', themes.customDark);
		Editor.defineTheme('customLight', themes.customLight);

		editor = Editor.create(editorEl, {
			colorDecorators: true,
			value: get(content),
			language: lang,
			theme: get(mode) === 'dark' ? 'customDark' : 'customLight',
			minimap: {
				enabled: true,
				autohide: true
			},
			lineNumbers: 'off',
			wordWrap: 'on',
			readOnly: readonly,
			fontSize: 15
		});

		Editor.colorizeElement(editorEl, {});

		editor.onDidChangeModelContent(() => {
			const val = editor.getValue();
			dispatch('change', val);
			content.set(val);
		});

		editor.onDidScrollChange((ev) => dispatch('scroll', ev));

		window.requestAnimationFrame(resizeEditor);

		if (editorEl.parentElement) observer.observe(editorEl.parentElement);
	}

	export function resizeEditor() {
		const rect = editorEl?.getBoundingClientRect();
		if (rect) editor.layout({ width: rect.width, height: rect.height });
	}

	onMount(() => {
		// cleanup function
		return () => editor.dispose();
	});
</script>

<svelte:window
	on:resize={() => {
		editor.layout({ width: 0, height: 0 });
		window.requestAnimationFrame(resizeEditor);
	}}
/>

<div bind:this={editorEl} class="h-full w-full"></div>

{#await init()}
	<Loading />
{:catch err}
	<ErrorComponent {err} />
{/await}
