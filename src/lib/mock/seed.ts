import {
	type V1ApiKey,
	type V1Node,
	type V1Policy,
	type V1PreAuthKey,
	type V1Route,
	type V1User
} from '$lib/api';
import { faker } from '@faker-js/faker';
import { randomSizedArray } from './utils';

faker.seed();

/** Keys need to match the result of mockSeed */
export const mockStoreOpt: { [x: string]: IDBObjectStoreParameters } = {
	users: { keyPath: 'name' },
	machines: { keyPath: 'id', autoIncrement: true },
	apikeys: { keyPath: 'prefix' },
	policy: { keyPath: 'id' },
	routes: { keyPath: 'id', autoIncrement: true },
	preauthkeys: { keyPath: 'key' }
};

export function mockSeed(): { [x: string]: object[] } {
	const users = seedUsers();
	const apikeys = seedApiKey();
	const machines = seedMachines(users);
	const policy = seedPolicy(users);
	const routes = seedRoutes(machines);
	const preauthkeys = seedPreauthkeys();

	return {
		users,
		machines,
		apikeys,
		policy,
		routes,
		preauthkeys
	};
}

function seedUsers(): V1User[] {
	return randomSizedArray(
		(i) => {
			const name = faker.person.firstName();
			return {
				id: String(i + 1),
				name,
				displayName: name,
				createdAt: faker.date.recent().toISOString()
			};
		},
		{ min: 5, max: 10 }
	);
}

function seedMachines(users: V1User[]): V1Node[] {
	return randomSizedArray(
		(i) => {
			const userId = faker.number.int({ min: 1, max: users.length });

			return {
				id: String(i + 1),
				name: faker.person.lastName(),
				givenName: faker.person.lastName(),
				createdAt: faker.date.recent().toISOString(),
				expiry: faker.date.soon().toISOString(),
				lastSeen: faker.date.recent().toISOString(),
				registerMethod: 'REGISTER_METHOD_UNSPECIFIED',
				online: faker.datatype.boolean(),
				discoKey: `discokey:${btoa(window.crypto.getRandomValues(new Uint8Array(10)).toString()).replace(/=+$/, '')}`,
				nodeKey: `nodekey:${btoa(window.crypto.getRandomValues(new Uint8Array(10)).toString()).replace(/=+$/, '')}`,
				machineKey: `mkey:${btoa(window.crypto.getRandomValues(new Uint8Array(10)).toString()).replace(/=+$/, '')}`,
				invalidTags: [],
				forcedTags: [],
				validTags: [],
				user: {
					id: String(userId),
					name: users.find((i) => i.id === String(userId))?.name
				},
				ipAddresses: [
					`100.64.${((i + 1) / 255).toFixed(0)}.${(i + 1) % 255}`,
					'fd7a:115c:a1e0::' + (i + 1).toString(16)
				]
			};
		},
		{ min: 10, max: 30 }
	);
}

function seedApiKey(): V1ApiKey[] {
	return randomSizedArray(
		() => {
			return {
				id: faker.number.octal(),
				prefix: btoa(
					String.fromCharCode.apply(null, [...crypto.getRandomValues(new Uint8Array(3))])
				),
				expiration: faker.date
					.between({ from: Date.now() - 1000 * 60 * 24 * 31, to: Date.now() + 1000 * 60 * 24 * 31 })
					.toISOString(),
				createdAt: faker.date.past().toISOString(),
				lastSeen: faker.date.recent().toISOString()
			};
		},
		{ min: 4, max: 16 }
	);
}

function seedPolicy(users: V1User[]): [{ id: number; policy: string; updatedAt?: string }] {
	// const policy = new Acl({
	// 	policy: JSON.stringify({
	// 		hosts: {
	// 			demo: '172.20.10.1/32'
	// 		},
	// 		tagOwners: {
	// 			'tag:demo': ['group:demo']
	// 		},
	// 		groups: {
	// 			'group:internet': randomSizedArray(
	// 				() =>
	// 					users.find((usr) => usr.id === String(faker.number.int({ min: 1, max: users.length })))
	// 						?.name
	// 			).filter((i) => i?.length)
	// 		},
	// 		acls: []
	// 	} as V1Policy),
	// 	updatedAt: faker.date.recent().toISOString()
	// });

	// policy.acls = [
	// 	// ...randomSizedArray(
	// 	// 	() => ({
	// 	// 		id: '',
	// 	// 		action: 'accept',
	// 	// 		src: [
	// 	// 			// Object.keys(groups)[faker.number.int({ min: 0, max: Object.keys(groups).length - 1 })]
	// 	// 		],
	// 	// 		dst: [
	// 	// 			{
	// 	// 				host: Object.keys(groups)[
	// 	// 					faker.number.int({ min: 0, max: Object.keys(groups).length - 1 })
	// 	// 				],
	// 	// 				port: '*'
	// 	// 			}
	// 	// 		],
	// 	// 		comments: ['// Demo groups \n']
	// 	// 	}),
	// 	// 	faker.number.int({ min: 2, max: Object.keys(groups).length })
	// 	// ),
	// 	...users
	// 		.map((usr) =>
	// 			usr.name
	// 				? {
	// 						id: '',
	// 						action: 'accept',
	// 						src: [usr.name],
	// 						dst: [{ host: usr.name, port: '*' }],
	// 						comments: ["// Allow communication between user's owned devices \n"]
	// 					}
	// 				: undefined
	// 		)
	// 		.filter((i) => !!i),
	// 	{
	// 		id: '',
	// 		action: 'accept',
	// 		src: ['group:internet'],
	// 		dst: [{ host: 'autogroup:internet', port: '*' }],
	// 		comments: ['// Allow access to all exit nodes \n']
	// 	},
	// 	{
	// 		id: '',
	// 		action: 'accept',
	// 		src: ['*'],
	// 		dst: [{ host: 'demo', port: '*' }],
	// 		comments: ['// Demo host \n']
	// 	}
	// ];

	// return [{ id: 1, policy: policy.stringify(), updatedAt: policy.updatedAt }];
	return [{ id: 1, policy: '', updatedAt: new Date().toISOString() }];
}

function seedRoutes(machines: V1Node[]): V1Route[] {
	return [
		{
			id: '1',
			advertised: true,
			enabled: true,
			isPrimary: true,
			createdAt: faker.date.recent().toISOString(),
			node: { id: '1' },
			prefix: '172.20.10.1/32'
		},
		...randomSizedArray(() => ({
			id: String(faker.number.int({ min: 2, max: 1000 })),
			advertised: true,
			enabled: true,
			createdAt: faker.date.recent().toISOString(),
			node: { id: faker.number.octal({ min: 1, max: machines.length }) },
			prefix: '0.0.0.0/0'
		})),
		...randomSizedArray(() => ({
			id: String(faker.number.int({ min: 1000, max: 2000 })),
			advertised: true,
			enabled: true,
			createdAt: faker.date.recent().toISOString(),
			node: { id: faker.number.octal({ min: 1, max: machines.length }) },
			prefix: '::/0'
		}))
	];
}

function seedPreauthkeys(): V1PreAuthKey[] {
	return [];
}
