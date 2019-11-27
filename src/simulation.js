import Vector from '../geometry-processing-js/node/linear-algebra/vector';
import MemoryManager from '../geometry-processing-js/node/linear-algebra/emscripten-memory-manager';


import { initMesh } from './input';
import SceneGeometry from './scene-geometry';
import ParticleCollisions from './particle-collisions';
import EdgeBasedGrowth from './edge-based-growth';
import RepulsivePlane from './repulsive-plane';


const MAX_POINTS = 100000;

// MAGIC CONSTANTS

// Stiffness (inter-cell repulsion)
// const Ke = 3.0;
const Ke = 2.0;
const REPULSE_COEFF = 1.0; // non-adjacent cells rest distance = edge length * REPULSE_COEFF

const TIME_STEP = 1e-1;

const GROWTH_FADE = 0.5;
const GROWTH_TRESHOLD = 1.0;

export let sceneGeometry;
let growthProcess;
let collisions;
let initialized = false;


export function init(params) {

	let { growthZone, colorGrowth, sources, model } = params;

	initialized = true;

	let inputMesh = initMesh(model);
	sceneGeometry = new SceneGeometry(MAX_POINTS);
	sceneGeometry.build(inputMesh["f"], inputMesh["v"], MAX_POINTS);

	// Initialise growth process
	if (sources === 0) {
		growthProcess = new EdgeBasedGrowth(sceneGeometry.geometry, sceneGeometry.edgeLength * GROWTH_TRESHOLD);
	}
	else {
		if (model === 'disk' && (sources === 5 || sources === 4)) {
			let inputMesh = initMesh('disk20');
			sceneGeometry = new SceneGeometry(MAX_POINTS);
			sceneGeometry.build(inputMesh["f"], inputMesh["v"], MAX_POINTS);
		}
		if (model === 'disk' && (sources === 6)) {
			let inputMesh = initMesh('disk18');
			sceneGeometry = new SceneGeometry(MAX_POINTS);
			sceneGeometry.build(inputMesh["f"], inputMesh["v"], MAX_POINTS);
		}
		let sourcesIndex = sceneGeometry.setGrowthSources(sources);
		growthProcess = new EdgeBasedGrowth(sceneGeometry.geometry, sceneGeometry.edgeLength * GROWTH_TRESHOLD, sourcesIndex);
	}
	growthProcess.updateGrowthFactors(GROWTH_FADE, 1 - growthZone);

	// Initialise collision detection
	collisions = new ParticleCollisions(
		sceneGeometry.mesh,
		sceneGeometry.edgeLength,
		Ke,
		REPULSE_COEFF);

	// Input mesh dependent parameters
	switch (model) {
		case "disk":
		case "square":
			sceneGeometry.raiseEdge(0.01);
			// let boundaryFace = sceneGeometry.mesh.boundaries[0];
			// for (let i = 0; i < 3; i++) {
			// 	let maxLength = 0;
			// 	let maxEdge;
			// 	for (let e of boundaryFace.adjacentEdges()) {
			// 		if (sceneGeometry.geometry.length(e) > maxLength) {
			// 			maxLength = sceneGeometry.geometry.length(e);
			// 			maxEdge = e;
			// 		}
			// 	}
			// 	sceneGeometry.geometry.split(maxEdge);
			// }
		case "cylinder":
			sceneGeometry.stretchEdge(0.01);
			break;
	}
	// let groundPlane = new RepulsivePlane(
	// 	new Vector(0, 0, 1),
	// 	new Vector(0, 0, -0.01)
	// );
	// collisions.addRepulsiveSurface(groundPlane);
	// growthProcess.addRepulsiveSurface(groundPlane);

	// Colors
	if (colorGrowth) {
		growthProcess.updateGrowthFactors(GROWTH_FADE, 1 - growthZone);
		sceneGeometry.setColors(growthProcess.growthFactors, -1, 1);
	}
}



export function grow(params) {

	if (!initialized)
		return;

	let { growthZone, smoothness, gravity, colorGrowth } = params;

	growthProcess.growEdges();
	growthProcess.updateGrowthFactors(GROWTH_FADE, 1 - growthZone);
	
  // Update colors based on growth factors
  if (colorGrowth)
    sceneGeometry.setColors(growthProcess.growthFactors, -1, 1);
  else
		sceneGeometry.setColors();

  // Store positions before energy minimization
  const positions = sceneGeometry.getPositions();

  sceneGeometry.balanceMesh();
  integrateForces(positions, sceneGeometry.mesh, gravity.vector);
	sceneGeometry.smoothMesh(smoothness);
}

export function updateGrowthColors(params) {
	if (!initialized)
		return;
	let { growthZone } = params;
	// Update growth factors because params changed
	growthProcess.updateGrowthFactors(GROWTH_FADE, 1 - growthZone);
	sceneGeometry.setColors(growthProcess.growthFactors, -1, 1);
}

function integrateForces(X, mesh, gravity) {

  const nVertex = mesh.vertices.length;

	// Compute collision forces
	let repulseForce = collisions.repulsiveForces(X);
	let dV = repulseForce.timesReal(TIME_STEP);

	// Gravity
	let dV_gravity = gravity.times(TIME_STEP);

	// Update positions
	for (let i = 0; i < nVertex; i++) {
		let dVi = new Vector(dV.get(3 * i, 0), dV.get(3 * i + 1, 0), dV.get(3 * i + 2, 0));
		// Gravity
		dVi.incrementBy( dV_gravity );
		X[i].incrementBy(dVi.times(TIME_STEP * mesh.vertices[i].growthFactor));
	}		

  MemoryManager.deleteExcept([growthProcess.growthFactors]);

}