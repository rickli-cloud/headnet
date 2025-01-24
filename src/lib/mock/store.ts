import { mockStoreOpt, mockSeed } from './seed';

const databaseName = 'mock';

export async function createDatabase(): Promise<IDBDatabase> {
	return new Promise<IDBDatabase>((resolve, reject) => {
		const dbOpenReq = indexedDB.open(databaseName, 2);
		const timeout = setTimeout(() => reject('timeout'), 3000);

		dbOpenReq.onblocked = () => {
			clearTimeout(timeout);
			reject(dbOpenReq.error);
		};
		dbOpenReq.onerror = () => {
			clearTimeout(timeout);
			reject(dbOpenReq.error);
		};
		dbOpenReq.onsuccess = () => {
			clearTimeout(timeout);
			resolve(dbOpenReq.result);
		};
		dbOpenReq.onupgradeneeded = async () => {
			clearTimeout(timeout);
			resolve(await initDatabase(dbOpenReq.result));
		};
	});
}

async function initDatabase(db: IDBDatabase): Promise<IDBDatabase> {
	const seed = mockSeed();
	console.debug('Mock database seed:', seed);

	for (const key in seed) {
		if (!db.objectStoreNames.contains(key)) {
			const store = db.createObjectStore(key, mockStoreOpt[key]);
			for (const entry of seed[key]) store.add(entry);
		}
	}

	return db;
}
