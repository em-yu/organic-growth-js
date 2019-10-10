import Vector from '../geometry-processing-js/node/linear-algebra/vector';

import Grid from './grid';

export default class ParticleCollisions {
	constructor(mesh, positions, resolution, k) {
		this.mesh = mesh;
		this.positions = positions;
		this.resolution = resolution;
		this.grid = undefined;
		this.k = k;
		// this.le = resolution;
	}

	/**
	 * 
	 * @param {Mesh} mesh 
	 * @param {Vector[]} positions 
	 */
	buildGrid() {
		let grid = new Grid(this.resolution);
		for (let v of this.mesh.vertices) {
			const idx = v.index;
			const pos = this.positions[idx];
			grid.add(pos, idx);
		}
		this.grid = grid;
		// console.log(this.grid);
	}

	collisionForces() {
		let repulsiveForce = new Array(this.mesh.vertices.length);
		for (let v of this.mesh.vertices) {
			const pos = this.positions[v.index];
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
				// Determine relaxed distance, depending on if adjacent or not
				let l0;
				if (adjacents.includes(neighborIdx))
					l0 = this.resolution * 0.9;
				else
					l0 = this.resolution * 2;
				const npos = this.positions[neighborIdx];
				let vij = npos.minus(pos);
				let lij = vij.norm();
				vij.divideBy(lij);
				let delta = lij - l0;
				if (delta < 0) {
					let fij = vij.times(this.k * delta);
					fi.incrementBy(fij);
				}
				else {
					// console.log("vertices: " + v.index + " and: " + neighborIdx + " " + delta)
				}
			}
			repulsiveForce[v.index] = fi;
		}
		return repulsiveForce;
	}
}