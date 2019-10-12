import HeatMethod from '../geometry-processing-js/node/projects/geodesic-distance/heat-method';
import DenseMatrix from '../geometry-processing-js/node/linear-algebra/dense-matrix';

export default class EdgeBasedGrowth {
	constructor(geometry, growthScale, growthFade, edgeThreshold, sources) {
		this.geometry = geometry;
		this.growthScale = growthScale;
		this.mesh = geometry.mesh;
		this.growthFade = growthFade;
		this.edgeThreshold = edgeThreshold;
		this.sources = sources;
	}

	computeGrowthFactors() {
		// initialize geodesics in heat
		let V = this.mesh.vertices.length;
		// Vector containing sources
		let delta = DenseMatrix.zeros(V, 1);
	
		let boundaryFace = this.mesh.boundaries[0];
		if (this.sources !== undefined) {
			for (let source of this.sources) {
				delta.set(1, source, 0);
			}
		}
		else {
			// Add heat sources at boundary vertices
			for (let v of boundaryFace.adjacentVertices()) {
				delta.set(1, v.index, 0);
			}
		}
		let heatMethod = new HeatMethod(this.geometry);
	
		return heatMethod.compute(delta);
	}

	growEdges() {
		let vertexGrowthFactors = this.computeGrowthFactors();

		let maxPhi = 0;
		for (let i = 0; i < vertexGrowthFactors.nRows(); i++) {
			maxPhi = Math.max(vertexGrowthFactors.get(i, 0), maxPhi);
		}


		if (this.sources !== undefined) {
			for (let source of this.sources) {
				vertexGrowthFactors.set(0, source, 0);
			}
		}
		else {
			let boundaryFace = this.mesh.boundaries[0];
			// Add heat sources at boundary vertices
			for (let v of boundaryFace.adjacentVertices()) {
				vertexGrowthFactors.set(0, v.index, 0);
			}
		}

		const normalizer = Math.pow(maxPhi, this.growthFade);
		let toSplit = [];
		for (let i = 0; i < this.mesh.edges.length; i++) {
			const e = this.mesh.edges[i];
			let edgeLength = this.geometry.length(e);
			let vA = e.halfedge.vertex;
			let vB = e.halfedge.twin.vertex;
			let phiA = vertexGrowthFactors.get(vA.index, 0);
			let phiB = vertexGrowthFactors.get(vB.index, 0);

			let phi = Math.min(phiA, phiB);
			let newEdgeLength = edgeLength
													* (1 + Math.pow((maxPhi - phi), this.growthFade) / normalizer)
													* this.growthScale;
			if (newEdgeLength > this.edgeThreshold) {
				toSplit.push(e);
			}
		}

		for (let e of toSplit) {
			this.geometry.split(e);
		}

	}



}