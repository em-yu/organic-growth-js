import Vector from '../geometry-processing-js/node/linear-algebra/vector';
import DenseMatrix from '../geometry-processing-js/node/linear-algebra/dense-matrix';
import sparse from '../geometry-processing-js/node/linear-algebra/sparse-matrix';
const SparseMatrix = sparse[0];
const Triplet = sparse[1];

import Grid from './grid';

export default class ParticleCollisions {
	constructor(mesh, edgeLength, k, coef) {
		this.mesh = mesh;
		this.resolution = Math.max(edgeLength, edgeLength * coef);
		this.grid = undefined;
		this.k = k;
		this.le_adj = edgeLength;
		this.le = edgeLength * coef;
		this.repulsiveSurfaces = [];
	}

	addRepulsiveSurface(surface) {
		this.repulsiveSurfaces.push(surface);
	}

	/**
	 * 
	 * @param {Mesh} mesh 
	 * @param {Vector[]} Xi positions of all vertices
	 */
	fillGrid(Xi) {
		let grid = new Grid(this.resolution);
		for (let v of this.mesh.vertices) {
			const idx = v.index;
			const pos = Xi[idx];
			grid.add(pos, idx);
		}
		return grid;
	}

	repulsiveForces(Xi) {
		// Build grid
		const grid = this.fillGrid(Xi);

		let nVertex = this.mesh.vertices.length;
		let repulsiveTriplet = new Triplet(1, 3 * nVertex);
		for (let v of this.mesh.vertices) {
			if (v.growthFactor < 0.5) {
				// Fixed vertices
				continue;
			}
			const pos = Xi[v.index];
			const i = v.index;
			// List of adjacent vertices index
			let adjacents = [];
			for (let adjacent of v.adjacentVertices()) {
				adjacents.push(adjacent.index);
			}
			// Find neighbors (exclude self)
			let allNeighbors = grid.getNeighbors(pos).filter(neighbor => {
				return neighbor !== i
			});
			let fi = new Vector();
			for (let neighborIdx of allNeighbors) {
				const npos = Xi[neighborIdx];
				let vij = npos.minus(pos);
				let lij = vij.norm();
				if (lij > this.resolution)
					continue;
				
				vij.divideBy(lij);

				// Check if vj is adjacent
				let l0 = this.le;
				if (adjacents.includes(neighborIdx)) {
					l0 = this.le_adj;
				}
				let delta = lij - l0;
				if (delta < 0) {
					let fij = vij.times(this.k * delta);					
					fi.incrementBy(fij);
				}
			}

			// Repulsive surfaces
			for (let surf of this.repulsiveSurfaces) {
				let repulse = surf.repulse(pos);
				fi.incrementBy(repulse);
			}

			// If non nul
			if (fi.norm() > 10e-10) {
				repulsiveTriplet.addEntry(fi.x, 0, 3 * i);
				repulsiveTriplet.addEntry(fi.y, 0, 3 * i + 1);
				repulsiveTriplet.addEntry(fi.z, 0, 3 * i + 2);
			}
		}
		let repulsiveSparse = SparseMatrix.fromTriplet(repulsiveTriplet);
		let repulsiveDense = repulsiveSparse.transpose().toDense();
		return repulsiveDense;
	}
}