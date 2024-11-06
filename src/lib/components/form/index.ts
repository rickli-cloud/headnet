import Form from './form.svelte';

class FormError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'FormError';
	}
}

export * from '$lib/components/ui/form';

export { Form, Form as Root, FormError, FormError as Error };
