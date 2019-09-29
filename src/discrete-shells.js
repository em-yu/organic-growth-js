import Vector from '../geometry-processing-js/node/linear-algebra/vector';

export default class DiscreteShells {
	constructor(x0, xi, mesh, kb, timeStep, n) {
		this.x0 = x0; // vertices positions at t0 (undeformed state)
		this.xi = xi; // vertices positions at ti (deformed state)
		this.mesh = mesh; // connectivity info (geometry-processing-js mesh)
		this.kb = kb,
		this.h = timeStep;
		this.h2 = timeStep * timeStep;
		this.nIter = n;
	}

	minimizeBend() {
	
		for (let it = 0; it < this.nIter; it++) {
			// Compute gradient of the bending energy
			const hingeGrad = this.hingeGradient();
			// Explicit Euler integration
			// Compute new positions for vertices
			const nVertex = this.mesh.vertices.length;
			for (let i = 0; i < nVertex; i++) {
				let update = hingeGrad[i].times(-this.h2);
				this.xi[i].incrementBy(update);
				
			}
		}
	}

	hingeGradient() {
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
	
		// Gradient of the hinge energy
		let gradHinge = new Array(nVertex);
	
		// Loop over faces:
		// - face normals
		// - face areas
		for (let i = 0; i < nFace; i++) {
			const f = this.mesh.faces[i];
			// Undeformed state
			const u0 = this.vector_0(f.halfedge);
			const v0 = this.vector_0(f.halfedge.prev).negated();
			
			let n0 = u0.cross(v0);
			let area0 = n0.norm() * 0.5;
			n0.divideBy(2 * area0);
	
			faceNormals0[i] = n0;
			faceAreas0[i] = area0;
	
			// Deformed state
			// const f = geometry.faces[i];
			const u = this.vector_i(f.halfedge);
			const v = this.vector_i(f.halfedge.prev).negated();
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
			let v0 = this.vector_0(e.halfedge);
			let l02 = v0.norm2();
			v0.divideBy(Math.sqrt(l02));
			let theta0 = this.dihedralAngle(e.halfedge, v0, faceNormals0[fai], faceNormals0[fbi]);
	
			// Deformed state
			let v = this.vector_i(e.halfedge);
			let l = v.norm();
			v.divideBy(l);
			let theta = this.dihedralAngle(e.halfedge, v, faceNormals[fai], faceNormals[fbi]);
	
			// Store info
			// console.log("edge index " + i + " angle difference " + (theta - theta0));
			// console.log("coeff " + (l02 / (faceAreas0[fai] + faceAreas0[fbi])));
			dP[i] = this.kb * 6 * l02 * (theta - theta0) / (faceAreas0[fai] + faceAreas0[fbi]);
			edgeVectors[i] = v;
			edgeLengths[i] = l;
		}
		// console.log(dP);
		// console.log(edgeVectors);
	
		// Loop over vertices
		//  - Loop over adjacent edges
		//    - Partial derivative of hinge energy wrt vertex i
		for (let i = 0; i < nVertex; i++) {
			const vi = this.mesh.vertices[i];
			let grad = new Vector();
			
			for (let e of vi.adjacentEdges()) {
				// Hinge gradient for outgoing edge wrt vi
				// he is the halfedge pointing towards x0
				// e0 is the vector corresponding to he
				let v0 = edgeVectors[e.index];
				let he = e.halfedge;
				if (e.halfedge.vertex.index === i) {
					v0 = v0.negated();
					he = he.twin;
				}
				// Cosine of alpha1
				let he1 = he.twin.next;
				let v1 = edgeVectors[he1.edge.index];
				v1.scaleBy(this.orientation(he1)); // fix orientation
				let cos1 = v0.dot(v1);
	
				// Cosine of alpha2
				let he2 = he.prev;
				let v2 = edgeVectors[he2.edge.index];
				v2.scaleBy(this.orientation(he2) * (-1)); // fix orientation
				let cos2 = v0.dot(v2);
	
				// Triangles
				const f2 = he.face;
				const f1 = he.twin.face;
	
				// Altitudes
				let alt1 = faceAreas[f1.index] * 2 / edgeLengths[he1.edge.index];
				let alt2 = faceAreas[f2.index] * 2 / edgeLengths[he2.edge.index];
	
				// Normals
				let n1 = faceNormals[f1.index];
				let n2 = faceNormals[f2.index];
	
				// dPsi
				let dPsi = dP[e.index];
	
				// Hinge gradient of edge e wrt vertex vi
				let angleGrad = n1.times(cos1/alt1).plus(n2.times(cos2/alt2));
				// console.log("angleGrad.z of vertex " + i + " " + angleGrad.z);
				grad.incrementBy(angleGrad.times(dPsi));
	
				// Hinge gradient for opposite edge wrt vi
				let eOpp = he.twin.next.edge;
				// dPsi
				let dPsiOpp = dP[eOpp.index];
				let angleGradOpp = n1.times(-1/alt1);
				grad.incrementBy(angleGradOpp.times(dPsiOpp));
	
			}
	
			gradHinge[i] = grad;
		}
		return gradHinge;
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
	vector_i(h) {
		let a = this.xi[h.vertex];
		let b = this.xi[h.next.vertex];

		return b.minus(a);
	}

	/**
	 * 
	 * @param {Halfedge} h 
	 */
	vector_0(h) {
		let a = this.x0[h.vertex];
		let b = this.x0[h.next.vertex];

		return b.minus(a);
	}

	/**
	 * 
	 * @param {Halfedge} halfedge 
	 */
	orientation(halfedge) {
		return halfedge.edge.halfedge.index === halfedge.index ? 1 : -1;
	}


}