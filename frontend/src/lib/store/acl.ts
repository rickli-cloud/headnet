import { Acl } from '$lib/api';
import { writable } from 'svelte/store';

export const AclStore = writable<Acl>(new Acl(''));
