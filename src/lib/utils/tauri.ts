export function isTauri(): boolean {
	// @ts-expect-error
	return __TAURI__ === true || typeof __TAURI_INTERNALS__ !== 'undefined';
}
