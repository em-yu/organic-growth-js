/**
 * @typedef {import('three').Vector3} Vector3
 * @typedef {import('./Face')} Face
 */

import { Vector3 } from 'three';

class Edge {
	constructor() {
		/** @type {Vertex[]} */
		this.vertices = [];
		/** @type {Face[]} */
		this.faces = [];
		/** @type {Vector3} */
		this.direction = undefined;
		/** @type {number} */
		this.length = undefined;
	}

	setVertices(vertexA, vertexB) {
		this.vertices.push(vertexA);
		this.vertices.push(vertexB);
	}

	setFace(face) {
		if (this.faces && this.faces.length >= 2) {
			console.error("Edge already has 2 faces assigned")
			return false;
		}
		this.faces.push(face);
	}

	isBoundary() {
		return(this.faces && this.faces.length === 1);
	}

	computeProperties() {
		let dir = new Vector3();
		dir = dir.subVectors(this.vertices[1].position, this.vertices[0].position) ;
		this.length = dir.length();
		this.direction = dir.divideScalar(this.length);
	}

}

export default Edge;