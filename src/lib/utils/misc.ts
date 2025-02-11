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
	return (Number(`0x1${hex.replace(/^#/, '')}`) ^ 0xffffff).toString(16).substr(1).toUpperCase();
}

export function uuidv4() {
	return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
		(+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
	);
}

export function formatVersion(version: string): string {
	return /^v?0.0.0-?/.test(version)
		? version.replace(/^v?0.0.0-?/, '') || 'unknown'
		: /^v/.test(version)
			? version
			: 'v' + version;
}

export function splitAclDestination(destination: string): { host: string; port: string } {
	const lastIndex = destination.lastIndexOf(':');
	return {
		host: destination.slice(0, lastIndex),
		port: destination.slice(lastIndex + 1, destination.length + 1)
	};
}

export type Full<T> = {
	[P in keyof T]-?: T[P];
};
