/**
 * @typedef {import('./Vertex')} Vertex
 * @typedef {import('three').Vector3} Vector3
 */

import { Vector3 } from 'three';

class Face {
	constructor() {
		/** @type {Edge[]} */
		this.edges = [];
		/** @type {Vertex[]} */
		this.vertices = undefined;
		/** @type {Vector3} */
		this.normal = undefined;
		/** @type {number[]} */
		this.cosines = undefined;
		/** @type {Vector3[]} */
		this.altitudes = undefined;
	}

	setVertices(verticesList) {
		if (verticesList.length != 3) {
			console.error(verticesList + " is not a valid list of vertices. It must be of length 3.")
		}
		this.vertices = verticesList;
	}

	setEdge(edge) {
		if (this.edges.length >= 3) {
			console.error("Face already has 3 edges assigned")
			return false;
		}
		this.edges.push(edge);
	};

	getVerticesInd() {
		if (!this.vertices.map)
			return [];
		return this.vertices.map(v => v.index);
	}

}

export default Face;