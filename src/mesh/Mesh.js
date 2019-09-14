import { Vector3 } from 'three';
import Vertex from './Vertex';
import Edge from './Edge';
import Face from './Face';


class Mesh {
	constructor() {
		/** @type {Vertex[]} */
		this.vertices = [];
		/** @type {Face[]} */
		this.faces = [];
		/** @type {Edge[]} */
		this.edges = [];
	};

	buildFromOBJ(input) {
		let lines = input.split("\n");
		let positions = [];
		let indices = [];

		for (let line of lines) {
			line = line.trim();
			let tokens = line.split(" ");
			let identifier = tokens[0].trim();

			if (identifier === "v") {
				positions.push(new Vector3(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])));

			}
			else if (identifier === "f") {
				if (tokens.length > 4) {
					alert("Only triangle meshes are supported at this time!");
					return undefined;
				}
				let fIndices = [];
				for (let i = 1; i < tokens.length; i++) {
					let index = (tokens[i].split("/")[0]).trim();
					fIndices.push(parseInt(index) - 1);
				}
				indices.push(fIndices);
			}
		};

		// Create Vertices
		let vertices = [];
		for (let i = 0; i < positions.length; i++) {
			let vertex = new Vertex(i, positions[i]);
			vertices.push(vertex);
		};
		this.vertices = vertices;

		// Create Faces and Edges
		// Edge map
		let existingEdges = new Map();
		for (let I = 0; I < indices.length; I++) {
			let face = new Face();
			this.faces.push(face);

			// Set vertices
			const verticesInd = indices[I];
			const faceVertices = verticesInd.map(idx => this.vertices[idx]);
			face.setVertices(faceVertices);

			for (let k = 0; k < 3; k++) {
				const i = verticesInd[k];
				const j = verticesInd[(k+1)%3];
				const key = i < j ? [i,j].toString() : [j,i].toString();
				if (existingEdges.has(key)) {
					// This edge exists already
					const edge = existingEdges.get(key);
					edge.setFace(face);
					face.setEdge(edge);
					face.reversed = true;
				}
				else {
					// const vi = vertices[i];
					// const vj = vertices[j];

					// Create edge
					let edge = new Edge();
					// edge.setVertices(vi, vj);
					edge.setFace(face);
					this.edges.push(edge);

					// Add edge to face
					face.setEdge(edge);

					// Update edge map
					existingEdges.set(key, edge);
				}
			}
		}

	}

}

export default Mesh;