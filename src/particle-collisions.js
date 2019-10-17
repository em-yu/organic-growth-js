import Vector from '../geometry-processing-js/node/linear-algebra/vector';
import DenseMatrix from '../geometry-processing-js/node/linear-algebra/dense-matrix';
import sparse from '../geometry-processing-js/node/linear-algebra/sparse-matrix';
const SparseMatrix = sparse[0];
const Triplet = sparse[1];

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
		// Build grid
		this.buildGrid(Xi);

		let nVertex = this.mesh.vertices.length;
		// let repulsiveForce = new Array(this.mesh.vertices.length);
		// let repulsiveForce = DenseMatrix.zeros(1, nVertex * 3); // row vector
		let repulsiveTriplet = new Triplet(1, 3 * nVertex);
		let jacobianTriplet = new Triplet(3 * nVertex, 3 * nVertex);
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
				if (lij > this.resolution * 0.9)
					continue;
				
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
					let l0 = this.resolution * 0.9;
					let delta = lij - l0;
					if (delta < 0) {
						fij = vij.times(this.k * delta);
					}
				}
				
				fi.incrementBy(fij);
			}

			// If non nul
			if (fi.norm() > 10e-10) {
				repulsiveTriplet.addEntry(fi.x, 0, 3 * v.index);
				repulsiveTriplet.addEntry(fi.y, 0, 3 * v.index + 1);
				repulsiveTriplet.addEntry(fi.z, 0, 3 * v.index + 2);
			}
		}
		let repulsiveSparse = SparseMatrix.fromTriplet(repulsiveTriplet);
		repulsiveTriplet.delete();
		let repulsiveDense = repulsiveSparse.toDense();
		repulsiveSparse.delete();
		let forceDerivative = DenseMatrix.zeros(nVertex * 3, nVertex * 3);
		return {
			force: repulsiveDense,
			derivative: forceDerivative
		};
	}
}