import { Mesh } from '../geometry-processing-js/node/core/mesh';
import { Geometry } from '../geometry-processing-js/node/core/geometry';
import Vector from '../geometry-processing-js/node/linear-algebra/vector';
import { colormap, coolwarm } from '../geometry-processing-js/node/utils/colormap';
import MeanCurvatureFlow from '../geometry-processing-js/node/projects/geometric-flow/mean-curvature-flow';

export default class SceneGeometry {
	constructor() {
		this.geometry = undefined;
		this.mesh = undefined;
		this.colors = undefined;
		this.edgeLength = undefined;
	}

	build(indices, positions, MAX_POINTS) {
		// Build mesh
		const mesh = new Mesh();
		mesh.build({
			f: indices,
			v: positions
		});

		// Create geometry object
		const geometry = new Geometry(mesh, positions, MAX_POINTS);

		// Get edge length
		let edgeLength = 0;
		const v0 = mesh.vertices[0];
		let n = 0;
		for (let e of v0.adjacentEdges()) {
			edgeLength += geometry.length(e);
			n++;
		}
		edgeLength /= n;

		this.mesh = mesh;
		this.geometry = geometry;
		this.edgeLength = edgeLength;

		this.raiseEdge(0.01);
	}

	raiseEdge(z) {
		let boundaryFace = this.mesh.boundaries[0];
		let X = this.getPositions();
		for (let v of boundaryFace.adjacentVertices()) {
			let up;
			if (z !== undefined)
				up = z;
			else
				up = Math.random() / 100;
			X[v.index].incrementBy(new Vector(0, 0, up));
		}
	}

	getPositions() {
		return this.geometry.positions;
	}

	getPositionsCopy() {
		// Create a deep copy of positions
		const positions0 = {};
		for (let v of this.geometry.mesh.vertices) {
			let pos0 = new Vector(
									this.geometry.positions[v.index].x,
									this.geometry.positions[v.index].y,
									this.geometry.positions[v.index].z
									)
			positions0[v.index] = pos0;
		}
		return positions0;
	}

	nVertices() {
		return this.mesh.vertices.length;
	}

	setColors(factors, min, max) {
		if (!factors) {
			this.colors = undefined;
			return;
		}
		let colors = new Array(this.nVertices());
		for (let v of this.mesh.vertices) {
			// Compute new vertex colors based on growth factors
			colors[v.index] = colormap(factors.get(v.index, 0), min, max, coolwarm);
		}
		this.colors = colors;
	}

	setGrowthSources(nb) {
		let boundaryFace = this.mesh.boundaries[0];
		let nV = 0;
		for (let v of boundaryFace.adjacentVertices()) {
			nV++;
		}
		let stride = Math.ceil(nV / nb);
		let sources = [];
		let i = 0;
		for (let v of boundaryFace.adjacentVertices()) {
			if (i % stride === 0) {
				sources.push(v.index);
			}
			i++;
		}
		return sources;
	}

	balanceMesh() {
		const nEdges = this.mesh.edges.length;
		for (let i = 0; i < nEdges; i++) {
			const e = this.mesh.edges[i];
			if (this.geometry.isFlippable(e)) {
				this.geometry.flip(e);
			}
		}
	}
	
	smoothMesh(smoothness) {
		let scale = smoothness || 0.1;
		for (let v of this.mesh.vertices) {
			const onBoundary = v.onBoundary();
			let vPos = this.geometry.positions[v.index];
			let barycenter = new Vector();
			let n = 0;
			for (let adjacent of v.adjacentVertices()) {
				if (onBoundary && !adjacent.onBoundary()) // for boundary vertices: only other boundary vertices count
					continue;
				const aPos = this.geometry.positions[adjacent.index];
				barycenter.incrementBy(aPos);
				n++;
			}
			if (n > 0) {
				barycenter.divideBy(n);
				let smoothing = barycenter.minus(vPos);
				if (onBoundary) {
					// Smooth less
					smoothing.scaleBy(0.1);
				}
				smoothing.scaleBy(scale * v.growthFactor);
	
				// Move vertex to tangential barycenter of neighbors
				this.geometry.positions[v.index].incrementBy(smoothing);
			}
		}
	}

	meanCurvSmooth(step) {
		let meanCurvatureFlow = new MeanCurvatureFlow(this.geometry);
		let h = step || 0.001;
		meanCurvatureFlow.integrate(h);
	}

}