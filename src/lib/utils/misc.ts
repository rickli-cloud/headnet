export function debounce<T extends Array<any>>(callback: (...args: T) => void, wait: number) {
	let timeoutId: number;
	return (...args: T) => {
		window.clearTimeout(timeoutId);
		timeoutId = window.setTimeout(() => {
			callback(...args);
		}, wait);
	};
}
