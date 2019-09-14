/**
 * @typedef {import('./Vertex')} Vertex
 */

class Face {
	constructor() {
		/** @type {Edge[]} */
		this.edges = [];
		/** @type {Vertex[]} */
		this.vertices = undefined;
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

	// getVerticesInd() {
	// 	let vertices = new Map();
	// 	for (let i = 0; i < 3 ; i++) {
	// 		const edge = this.edges[i];
	// 		for (let j = 0; j < 2; j++) {
	// 			const vertex = edge.vertices[j];
	// 			if (!vertices.has(vertex.index)) {
	// 				vertices.set(vertex.index, vertex.index);
	// 			}
	// 		}
	// 	}
	// 	if (this.reversed) {
	// 		console.log("reversed");
	// 		console.log(vertices.values());
	// 		console.log(Array.from(vertices.values()).reverse());
	// 	}
	// 	return this.reversed? Array.from(vertices.values()).reverse() : Array.from(vertices.values());
	// }
}

export default Face;