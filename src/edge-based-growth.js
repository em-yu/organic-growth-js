import HeatMethod from '../libs/geometry-processing-js/node/projects/geodesic-distance/heat-method';
import DenseMatrix from '../libs/geometry-processing-js/node/linear-algebra/dense-matrix';

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

		if (this.sources !== undefined) {
			for (let source of this.sources) {
				let v = this.mesh.vertices[source];
				if (!this.isColliding(this.geometry.positions[v.index]))
					delta.set(1, source, 0);
			}
		}
		else {
			// Add heat sources at boundary vertices
			// for (let boundaryFace of this.mesh.boundaries) {
					
				let boundaryFace = this.mesh.boundaries[0];
				// let nBoundary = 0;
				// for (let v of boundaryFace.adjacentVertices()) {
				// 	nBoundary++;
				// }
				// let i = 0;
				for (let v of boundaryFace.adjacentVertices()) {
					// if (i > nBoundary / 2)
					// 	break;
					if (!this.isColliding(this.geometry.positions[v.index]))
						delta.set(1, v.index, 0);
					// i++;
				}
			}
		// }
		let heatMethod = new HeatMethod(this.geometry);
	
		let distanceToSource = heatMethod.compute(delta);

		// From distance compute the growth factors
		let maxDist = 0;
		for (let i = 0; i < distanceToSource.nRows(); i++) {
			maxDist = Math.max(distanceToSource.get(i, 0), maxDist);
		};

		let max = DenseMatrix.constant(maxDist, V, 1);
		// Growth factor (between 0 and 1, max closer to the growth zone)
		let growthFactor = max.minus(distanceToSource).timesReal(1 / maxDist);

		// Apply smooth step function
		for (let i = 0; i < V; i++) {
			let factor = this.smoothStep(growthFactor.get(i, 0), growthFade, growthZone);
			growthFactor.set( factor, i, 0);
			this.mesh.vertices[i].growthFactor = factor;
		}

		return growthFactor;
	}

	updateGrowthFactors(growthFade, growthZone) {
		this.growthFactors = this.computeGrowthFactors(growthFade, growthZone);
	}

	smoothStep(x, s, p) {
		let x_clamped = Math.max(Math.min(x, 1.0), 0.0);
		const c = 2 / (1-s) - 1;
		if (x_clamped <= p) {
			return Math.pow(x_clamped/p, c) * p;
		}
		else {
			return 1 - Math.pow((1-x_clamped)/(1-p), c) * (1-p);
		}
	}

	growEdges() {
		let vertexGrowthFactors = this.growthFactors;

		let toSplit = [];
		for (let i = 0; i < this.mesh.edges.length; i++) {
			const e = this.mesh.edges[i];
			let edgeLength = this.geometry.length(e);
			let vA = e.halfedge.vertex;
			let vB = e.halfedge.twin.vertex;
			let phiA = vertexGrowthFactors.get(vA.index, 0);
			let phiB = vertexGrowthFactors.get(vB.index, 0);

			// let phi = Math.max(phiA, phiB);
			let phi = (phiA + phiB) / 2;
			let newEdgeLength = edgeLength
													* (1 + phi);
			if (newEdgeLength > this.edgeThreshold) {
				toSplit.push(e);
			}
		}

		for (let e of toSplit) {
			let newIndex = this.geometry.split(e);
			// let vA = e.halfedge.vertex;
			// let vB = e.halfedge.twin.vertex;
			// Add new vertex to sources?
			// if (e.onBoundary() && this.sources && (this.sources.includes(vA.index) || this.sources.includes(vB.index))) {
			// 	this.sources.push(newIndex);
			// }
		}

	}


}