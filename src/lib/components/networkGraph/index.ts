import type { Machine, User } from '$lib/api';
import type { ForceGraph3DInstance } from '3d-force-graph';

export { default as NetworkGraph } from './network-graph.svelte';
export { default as NetworkGraphActions } from './network-graph-actions.svelte';

type GraphDataBase = Parameters<ForceGraph3DInstance['graphData']>[0];
type GraphDataBaseNode = GraphDataBase['nodes'][0];
type GraphDataBaseLink = GraphDataBase['links'][0];

interface BasicGraphDataNode extends GraphDataBaseNode {
	nodeId: number;
	name?: string;
	color?: string;
}

export type GraphDataNode = BasicGraphDataNode | Machine | User;

export interface GraphDataLink extends GraphDataBaseLink {}

export interface GraphData extends GraphDataBase {
	nodes: GraphDataNode[];
	links: GraphDataLink[];
}

export interface NetworkGraphAttributes {
	/** Node ID inside of network graph */
	nodeId?: number;
	/** Node name inside of network graph */
	nodeName?: string;
	/** Color of network graph node */
	color: string;
}
