import HeatMethod from '../geometry-processing-js/node/projects/geodesic-distance/heat-method';
import DenseMatrix from '../geometry-processing-js/node/linear-algebra/dense-matrix';

export default class EdgeBasedGrowth {
	constructor(geometry, edgeThreshold, sources) {
		this.geometry = geometry;
		this.mesh = geometry.mesh;
		this.edgeThreshold = edgeThreshold;
		this.sources = sources;
		this.growthFactors = undefined;
		this.repulsiveSurfaces = [];
	}

	addRepulsiveSurface(surface) {
		this.repulsiveSurfaces.push(surface);
	}

	isColliding(x) {
		for (let surf of this.repulsiveSurfaces) {
			if (surf.isColliding(x)) {
				return true;
			}
		}
		return false;
	}

	computeGrowthFactors(growthFade, growthZone) {
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
				if (!this.isColliding(this.geometry.positions[v.index]))
					delta.set(1, v.index, 0);
			}
		}
		let heatMethod = new HeatMethod(this.geometry);
	
		let distanceToSource = heatMethod.compute(delta);

		// From distance compute the growth factors
		let maxDist = 0;
		for (let i = 0; i < distanceToSource.nRows(); i++) {
			maxDist = Math.max(distanceToSource.get(i, 0), maxDist);
		};

		for (let v of this.mesh.vertices) {
			if (this.isColliding(this.geometry.positions[v.index])) {
				distanceToSource.set(maxDist, v.index, 0);
			}
		}

		let max = DenseMatrix.constant(maxDist, V, 1);
		// Growth factor (between 0 and 1, max closer to the growth zone)
		let growthFactor = max.minus(distanceToSource).timesReal(1 / maxDist);

		// Apply growth fade exponent
		for (let i = 0; i < distanceToSource.nRows(); i++) {
			// let factor = Math.pow(growthFactor.get(i, 0), growthFade);
			let factor = this.smoothStep(growthFactor.get(i, 0), growthFade, growthZone);
			growthFactor.set( factor, i, 0);
		}

		return growthFactor;
	}

	smoothStep(x, s, p) {
		const c = 2 / (1-s) - 1;
		if (x <= p) {
			return Math.pow(x/p, c) * p;
		}
		else {
			return 1 - Math.pow((1-x)/(1-p), c) * (1-p);
		}
	}

	growEdges(growthScale, growthFade, growthZone) {
		let vertexGrowthFactors = this.growthFactors || this.computeGrowthFactors(growthFade, growthZone);

		let toSplit = [];
		for (let i = 0; i < this.mesh.edges.length; i++) {
			const e = this.mesh.edges[i];
			let edgeLength = this.geometry.length(e);
			let vA = e.halfedge.vertex;
			let vB = e.halfedge.twin.vertex;
			let phiA = vertexGrowthFactors.get(vA.index, 0);
			let phiB = vertexGrowthFactors.get(vB.index, 0);

			let phi = Math.max(phiA, phiB);
			let newEdgeLength = edgeLength
													* (1 + phi)
													* growthScale;
			if (newEdgeLength > this.edgeThreshold) {
				toSplit.push(e);
			}
		}

		for (let e of toSplit) {
			this.geometry.split(e);
		}

		// Update growth factors
		this.growthFactors = this.computeGrowthFactors(growthFade, growthZone);

	}


}