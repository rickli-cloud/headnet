import { ApiError } from '$lib/api';

export function formatStack(stack: string | undefined) {
	return (
		stack
			?.trim()
			.split(/\n/gm)
			.map((i) => [
				i.substring(0, i.indexOf('@')) || 'anonymous',
				i.substring(i.indexOf('@') + 1)
			]) || []
	);
}

export function formatError(err: any) {
	if (err instanceof ApiError) {
		return `${err.name}: ${err.message} ${err.code ? `#${err.code} ` : ''}`;
	} else if (err instanceof Error) {
		return `${err.name}: ${err.message}`;
	} else {
		return `Internal Error: ${err?.toString()}`;
	}
}
