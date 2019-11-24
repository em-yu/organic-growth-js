import MeshIO from '../geometry-processing-js/node/utils/meshio';
import Vector from '../geometry-processing-js/node/linear-algebra/vector';
import MemoryManager from '../geometry-processing-js/node/linear-algebra/emscripten-memory-manager';

import smallDisk from './obj/small_disk.obj';

import SceneGeometry from './scene-geometry';
import ParticleCollisions from './particle-collisions';
import EdgeBasedGrowth from './edge-based-growth';
import RepulsivePlane from './repulsive-plane';


const MAX_POINTS = 100000;

// Stiffness (inter-cell repulsion)
const Ke = 80;
const REPULSE_COEFF = 1.0; // non-adjacent cells rest distance = edge length * REPULSE_COEFF

const G = 100.0;
const g_coeff = 1.0;

const TIME_STEP = 0.01;

const GROWTH_FADE = 0.5;
const GROWTH_SCALE = 2.0;

let growCounter = 0;

export let sceneGeometry;
let growthProcess;
let collisions;
let initialized = false;


export function init(params) {

	let { growthZone, smoothness, gravity } = params;

	growCounter = 0;
	initialized = true;

	let inputMesh = MeshIO.readOBJ(smallDisk);
	sceneGeometry = new SceneGeometry(MAX_POINTS);
	sceneGeometry.build(inputMesh["f"], inputMesh["v"], MAX_POINTS);

	// Initialise growth process
	let sources = sceneGeometry.setGrowthSources(3);
	growthProcess = new EdgeBasedGrowth(sceneGeometry.geometry, sceneGeometry.edgeLength * 2);
	growthProcess.updateGrowthFactors(GROWTH_FADE, 1 - growthZone);

	// Initialise collision detection
	collisions = new ParticleCollisions(
		sceneGeometry.mesh,
		sceneGeometry.edgeLength,
		Ke,
		REPULSE_COEFF);

	// let groundPlane = new RepulsivePlane(
	// 	new Vector(0, 0, 1),
	// 	new Vector(0, 0, -0.01)
	// );
	// collisions.addRepulsiveSurface(groundPlane);
	// growthProcess.addRepulsiveSurface(groundPlane);
}



export function grow(params) {

	if (!initialized)
		return;

	let { growthZone, smoothness, gravity, colorGrowth } = params;

	growthProcess.growEdges(GROWTH_SCALE);
	growthProcess.updateGrowthFactors(GROWTH_FADE, 1 - growthZone);
	
  // Update colors based on growth factors
  if (colorGrowth)
    sceneGeometry.setColors(growthProcess.growthFactors, -1, 1);
  else
		sceneGeometry.setColors();

  // Store positions before energy minimization
  const positions = sceneGeometry.getPositions();

  sceneGeometry.balanceMesh();
  integrateForces(positions, sceneGeometry.mesh, gravity);
	sceneGeometry.smoothMesh(smoothness);

  growCounter++;
  console.log("Grow step: " + growCounter);
	console.log(sceneGeometry.nVertices() + " vertices")
	return "Grow step: " + growCounter;
}

export function updateGrowthColors(params) {
	if (!initialized)
		return;
	let { growthZone } = params;
	// Update growth factors because params changed
	growthProcess.updateGrowthFactors(GROWTH_FADE, 1 - growthZone);
	sceneGeometry.setColors(growthProcess.growthFactors, -1, 1);
}

function integrateForces(X, mesh, g_coeff) {

  const nVertex = mesh.vertices.length;

	// Compute collision forces
	let repulseForce = collisions.repulsiveForces(X);
	let dV = repulseForce.timesReal(TIME_STEP);

	// Gravity
	let dV_gravity = new Vector(0.0, 0.0, G * g_coeff);
	dV_gravity.scaleBy(TIME_STEP);

	// Update positions
	for (let i = 0; i < nVertex; i++) {
		let dVi = new Vector(dV.get(3 * i, 0), dV.get(3 * i + 1, 0), dV.get(3 * i + 2, 0));
		// Gravity
		dVi.incrementBy( dV_gravity )
		X[i].incrementBy(dVi.times(TIME_STEP * mesh.vertices[i].growthFactor));
	}		

  MemoryManager.deleteExcept([growthProcess.growthFactors]);

}