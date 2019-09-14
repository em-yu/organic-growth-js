/**
 * @typedef {import('./Vertex')} Vertex
 * @typedef {import('./Face')} Face
 */

class Edge {
	constructor() {
		// /** @type {Vertex[]} */
		// this.vertices = [];
		/** @type {Face[]} */
		this.faces = [];
	}

	// setVertices(vertexA, vertexB) {
	// 	this.vertices.push(vertexA);
	// 	this.vertices.push(vertexB);
	// }

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

	// getVertices() {
	// 	if (this.isBoundary()) {
			
	// 	}
	// 	else {
	// 		this.faces
	// 	}
	// }
}

export default Edge;