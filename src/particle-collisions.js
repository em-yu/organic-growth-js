import Vector from '../geometry-processing-js/node/linear-algebra/vector';

import Grid from './grid';

export default class ParticleCollisions {
	constructor(mesh, resolution, k) {
		this.mesh = mesh;
		this.resolution = resolution;
		this.grid = undefined;
		this.k = k;
	}

	/**
	 * 
	 * @param {Mesh} mesh 
	 * @param {Vector[]} Xi positions of all vertices
	 */
	buildGrid(Xi) {
		let grid = new Grid(this.resolution);
		for (let v of this.mesh.vertices) {
			const idx = v.index;
			const pos = Xi[idx];
			grid.add(pos, idx);
		}
		this.grid = grid;
	}

	repulsiveForces(Xi) {
		let repulsiveForce = new Array(this.mesh.vertices.length);
		for (let v of this.mesh.vertices) {
			const pos = Xi[v.index];
			// List of adjacent vertices index
			let adjacents = [];
			for (let adjacent of v.adjacentVertices()) {
				adjacents.push(adjacent.index);
			}
			// Find neighbors (exclude self)
			let allNeighbors = this.grid.getNeighbors(pos).filter(neighbor => {
				if (neighbor === v.index)
					return false;
				// for (let adjacent of v.adjacentVertices()) {
				// 	if (neighbor === adjacent.index)
				// 		return false;
				// }
				return true;
			});
			let fi = new Vector();
			for (let neighborIdx of allNeighbors) {
				const npos = Xi[neighborIdx];
				let vij = npos.minus(pos);
				let lij = vij.norm();
				vij.divideBy(lij);

				// Determine relaxed distance, depending on if adjacent or not
				let fij = new Vector();
				if (adjacents.includes(neighborIdx)) {
					let l0 = this.resolution * 0.9;
					let delta = lij - l0;
					if (delta < 0) {
					 fij = vij.times(this.k * delta)
					}
				}
				else {
					let l0 = this.resolution * 1.1;
					let delta = lij - l0;
					if (delta < 0) {
						fij = vij.times(this.k * delta);
					}
				}
				fi.incrementBy(fij);
			}
			repulsiveForce[v.index] = fi;
		}
		return repulsiveForce;
	}
}