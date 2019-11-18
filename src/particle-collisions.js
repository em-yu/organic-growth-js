import Vector from '../geometry-processing-js/node/linear-algebra/vector';
import DenseMatrix from '../geometry-processing-js/node/linear-algebra/dense-matrix';
import sparse from '../geometry-processing-js/node/linear-algebra/sparse-matrix';
const SparseMatrix = sparse[0];
const Triplet = sparse[1];

import Grid from './grid';

export default class ParticleCollisions {
	constructor(mesh, edgeLength, k, coef) {
		this.mesh = mesh;
		this.resolution = edgeLength;
		this.grid = undefined;
		this.k = k / edgeLength;
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
		// let repulsiveForce = new Array(this.mesh.vertices.length);
		// let repulsiveForce = DenseMatrix.zeros(1, nVertex * 3); // row vector
		let repulsiveTriplet = new Triplet(1, 3 * nVertex);
		let jacobianTriplet = new Triplet(3 * nVertex, 3 * nVertex);
		for (let v of this.mesh.vertices) {
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
			let jacobian_i = DenseMatrix.zeros(3, 3);
			for (let neighborIdx of allNeighbors) {
				const npos = Xi[neighborIdx];
				let vij = npos.minus(pos);
				let lij = vij.norm();
				if (lij > this.resolution * 1.0)
					continue;
				
				vij.divideBy(lij);

				// Check if vj is adjacent
				let l0 = this.le;
				if (adjacents.includes(neighborIdx)) {
					l0 = this.resolution * 0.8;
				}
				let delta = lij - l0;
				if (delta < 0) {
					let fij = vij.times(this.k * delta);

					// Derivative (jacobian)
					// A = delta * I3
					let A = DenseMatrix.identity(3, 3).timesReal(delta);

					// B = l0 * vij * vijT
					let Vij = DenseMatrix.zeros(3, 1);
					Vij.set(vij.x, 0, 0);
					Vij.set(vij.y, 1, 0);
					Vij.set(vij.z, 2, 0);
					let VijT = Vij.transpose();
					let B = Vij.timesDense(VijT);
					B.scaleBy(l0);

					// Dij = (ke/lij) * (A + B)
					let Dij = A.plus(B);
					Dij.scaleBy(this.k / lij);

					const j = neighborIdx;

					jacobian_i.incrementBy(Dij.timesReal(-1));

					for (let k = 0; k < 3; k++) {
						for (let l = 0; l < 3; l++) {
							jacobianTriplet.addEntry(Dij.get(k, l), 3 * i + k, 3 * j + l);
						}
					}
					
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

				for (let k = 0; k < 3; k++) {
					for (let l = 0; l < 3; l++) {
						jacobianTriplet.addEntry(jacobian_i.get(k, l), 3 * i + k, 3 * i + l);
					}
				}
			}
		}
		let repulsiveSparse = SparseMatrix.fromTriplet(repulsiveTriplet);
		let repulsiveDense = repulsiveSparse.transpose().toDense();
		let forceDerivative = SparseMatrix.fromTriplet(jacobianTriplet);

		return {
			force: repulsiveDense,
			derivative: forceDerivative
		};
	}
}