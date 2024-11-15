import { toast } from 'svelte-sonner';

import CircleAlert from 'lucide-svelte/icons/circle-alert';
import CircleCheck from 'lucide-svelte/icons/circle-check';

export function successToast(message: string) {
	toast(message, {
		class: 'bg-green-600 text-white',
		icon: CircleCheck,
		duration: 10000
	});
}

export function errorToast(message: string) {
	toast(message, {
		class: 'bg-red-600 text-white',
		icon: CircleAlert,
		duration: 10000
	});
}
