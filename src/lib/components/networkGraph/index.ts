import type { Machine, User } from '$lib/api';
import type { ForceGraph3DInstance } from '3d-force-graph';

export { default as NetworkGraph } from './network-graph.svelte';
export { default as NetworkGraphActions } from './network-graph-actions.svelte';

export type GraphDataBase = Parameters<ForceGraph3DInstance['graphData']>[0];
export type GraphDataBaseNode = GraphDataBase['nodes'][0];
export type GraphDataBaseLink = GraphDataBase['links'][0];
