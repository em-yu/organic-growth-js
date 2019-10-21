import Vector from '../geometry-processing-js/node/linear-algebra/vector';
import sparse from '../geometry-processing-js/node/linear-algebra/sparse-matrix';
const SparseMatrix = sparse[0];
const Triplet = sparse[1];

export default class DiscreteShells {
	constructor(X0, mesh, kb) {
		this.X0 = X0; // vertices positions at t0 (undeformed state)
		this.mesh = mesh; // connectivity info (geometry-processing-js mesh)
		this.kb = kb;
	}

	bendingForces(Xi) {
		const nFace = this.mesh.faces.length;
		const nEdge = this.mesh.edges.length;
		const nVertex = this.mesh.vertices.length;
		// Store per-triangle results in arrays
		let faceNormals0 = new Array(nFace); // undeformed state
		let faceAreas0 = new Array(nFace); // undeformed state
		let faceNormals = new Array(nFace);
		let faceAreas = new Array(nFace);
		// Store per-edge results in arrays
		let edgeVectors = new Array(nEdge);
		let edgeLengths = new Array(nEdge);
		let dP = new Array(nEdge);
	
		// Bending force
		let forceTriplet = new Triplet(1, 3 * nVertex);
		// Angle gradient
		let angleGradTriplet = new Triplet(1, 3 * nVertex);
	
		// Loop over faces:
		// - face normals
		// - face areas
		for (let i = 0; i < nFace; i++) {
			const f = this.mesh.faces[i];
			// Undeformed state
			const u0 = this.vector(f.halfedge, this.X0);
			const v0 = this.vector(f.halfedge.prev, this.X0).negated();
			
			let n0 = u0.cross(v0);
			let area0 = n0.norm() * 0.5;
			n0.divideBy(2 * area0);
	
			faceNormals0[i] = n0;
			faceAreas0[i] = area0;
	
			// Deformed state
			// const f = geometry.faces[i];
			const u = this.vector(f.halfedge, Xi);
			const v = this.vector(f.halfedge.prev, Xi).negated();
			let n = u.cross(v);
			let area = n.norm() * 0.5;
			n.divideBy(2 * area);
	
			faceNormals[i] = n;
			faceAreas[i] = area;
		}
	
		// Loop over edges:
		// - edge vector (deformed state)
		// - derivative of hinge energy function
		for (let i = 0; i < nEdge; i++) {
			const e = this.mesh.edges[i];
	
			const fai = e.halfedge.face.index;
			const fbi = e.halfedge.twin.face.index;
			
			// Undeformed state
			let v0 = this.vector(e.halfedge, this.X0);
			let l02 = v0.norm2();
			v0.divideBy(Math.sqrt(l02));
	
			// Deformed state
			let v = this.vector(e.halfedge, Xi);
			let l = v.norm();
			v.divideBy(l);

			if (!e.onBoundary()) {
				let theta0 = this.dihedralAngle(e.halfedge, v0, faceNormals0[fai], faceNormals0[fbi]);
				let theta = this.dihedralAngle(e.halfedge, v, faceNormals[fai], faceNormals[fbi]);

				// console.log("edge index " + i + " angle difference " + (theta - theta0).toExponential());
				// console.log("coeff " + (l02 / (faceAreas0[fai] + faceAreas0[fbi])));
				dP[i] = -1 * this.kb * 6 * l02 * (theta - theta0) / (faceAreas0[fai] + faceAreas0[fbi]);
			}
			else {
				dP[i] = 0;
			}

			edgeVectors[i] = v;
			edgeLengths[i] = l;
		}
		
		// console.log(dP);
	
		// Loop over vertices
		//  - Loop over adjacent edges
		//    - Partial derivative of hinge energy wrt vertex i
		for (let i = 0; i < nVertex; i++) {
			const vi = this.mesh.vertices[i];
			let grad = new Vector();
			let fi = new Vector();
			
			// for (let e of vi.adjacentEdges()) {
			for (let ohe of vi.adjacentHalfedges()) {
				// ohe is an outgoing halfedge

				// Hinge gradient for outgoing edge wrt vi
				// he is the halfedge pointing towards x0
				// v0 is the vector corresponding to he
				let he = ohe.twin; // ingoing halfedge
				let e = he.edge;
				// let vhe = edgeVectors[e.index];
				let vhe = this.vector(he, Xi);
				vhe.normalize();

				let n1;
				let alt1;
				if (!e.onBoundary()) {

					// Cosine of alpha1
					let he1 = he.twin.next;
					let v1 = edgeVectors[he1.edge.index].times(this.orientation(he1));
					let cos1 = vhe.dot(v1);
		
					// Cosine of alpha2
					let he2 = he.prev;
					let v2 = edgeVectors[he2.edge.index].times(this.orientation(he2));
					let cos2 = -vhe.dot(v2);
		
					// Triangles
					const f2 = he.face;
					const f1 = he.twin.face;
		
					// Altitudes
					alt1 = faceAreas[f1.index] * 2 / edgeLengths[he1.edge.index];
					let alt2 = faceAreas[f2.index] * 2 / edgeLengths[he2.edge.index];
		
					// Normals
					n1 = faceNormals[f1.index];
					let n2 = faceNormals[f2.index];
		
					// dPsi
					let dPsi = dP[e.index];
		
					// Hinge gradient of edge e wrt vertex vi
					let angleGrad = n1.times(cos1/alt1).plus(n2.times(cos2/alt2));
					// console.log("angleGrad.z of vertex " + i + " " + angleGrad.z);
					fi.incrementBy(angleGrad.times(dPsi));
					grad.incrementBy(angleGrad);
				}
				else {
					if (!he.onBoundary) {
						const f1 = he.face;
						const he1 = he.next;
						// Altitude
						alt1 = faceAreas[f1.index] * 2 / edgeLengths[he1.edge.index];
			
						// Normal
						n1 = faceNormals[f1.index];
					}
				}
	
				// Hinge gradient for opposite edge wrt vi
				let eOpp;
				if (!e.onBoundary())
					eOpp = he.twin.next.edge;
				else {
					if (!he.onBoundary) {
						eOpp = he.next.edge;
					}
				}
				if (eOpp && !eOpp.onBoundary()) {
					// dPsi
					let dPsiOpp = dP[eOpp.index];

					let angleGradOpp = n1.times(-1/alt1);
					fi.incrementBy(angleGradOpp.times(dPsiOpp));
					grad.incrementBy(angleGradOpp);
				}
	
			}

			// console.log("vertex " + i + " " + fi.z);

			if (fi.norm() > 10e-3) {
				forceTriplet.addEntry(fi.x, 0, 3 * i);
				forceTriplet.addEntry(fi.y, 0, 3 * i + 1);
				forceTriplet.addEntry(fi.z, 0, 3 * i + 2);

				angleGradTriplet.addEntry(grad.x, 0, 3 * i);
				angleGradTriplet.addEntry(grad.y, 0, 3 * i + 1);
				angleGradTriplet.addEntry(grad.z, 0, 3 * i + 2);
			}
		}

		let forceSparse = SparseMatrix.fromTriplet(forceTriplet);
		let angleGradSparse = SparseMatrix.fromTriplet(angleGradTriplet);
		let forceDerivative = forceSparse.transpose().timesSparse(angleGradSparse);

		let forceDense = forceSparse.transpose().toDense();


		return {
			force: forceDense,
			derivative: forceDerivative
		};
	}

	/**
	 * 
	 * @param {Halfedge} he 
	 * @param {Vector} hev 
	 * @param {Vector} n1 
	 * @param {Vector} n2 
	 */
	dihedralAngle(he, hev, n1, n2) {
		if (he.onBoundary || he.twin.onBoundary) return 0.0;

		let cosTheta = n1.dot(n2);
		let sinTheta = n1.cross(n2).dot(hev);

		return Math.atan2(sinTheta, cosTheta);
	}

	/**
	 * 
	 * @param {Halfedge} h 
	 */
	vector(h, X) {
		let a = X[h.vertex];
		let b = X[h.next.vertex];
		return b.minus(a);
	}

	/**
	 * 
	 * @param {Halfedge} halfedge 
	 */
	orientation(he) {
		return he.edge.halfedge.index === he.index ? 1 : -1;
	}


}