export function debounce<T extends Array<any>>(callback: (...args: T) => void, wait: number) {
	let timeoutId: number;
	return (...args: T) => {
		window.clearTimeout(timeoutId);
		timeoutId = window.setTimeout(() => {
			callback(...args);
		}, wait);
	};
}

export function invertHex(hex: string) {
	return (Number(`0x1${hex}`) ^ 0xffffff).toString(16).substr(1).toUpperCase();
}
