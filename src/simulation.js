import MeshIO from '../geometry-processing-js/node/utils/meshio';
import Vector from '../geometry-processing-js/node/linear-algebra/vector';
import MemoryManager from '../geometry-processing-js/node/linear-algebra/emscripten-memory-manager';

import smallDisk from './obj/small_disk.obj';

import SceneGeometry from './scene-geometry';
import ParticleCollisions from './particle-collisions';
import EdgeBasedGrowth from './edge-based-growth';
import RepulsivePlane from './repulsive-plane';


const MAX_POINTS = 100000;
const Ke = 30;
const REPULSE_COEFF = 1.0;
const TIME_STEP = 0.02;
const GROWTH_FADE = 0.5;
const GROWTH_SCALE = 2.0;

let growthZone = 0.5;
let smoothness = 0.7;
let colorGrowth = true;


let growCounter = 0;

export let sceneGeometry;
let growthProcess;
let collisions;
let initialized = false;


export function init() {

	growCounter = 0;
	initialized = true;

	let inputMesh = MeshIO.readOBJ(smallDisk);
	sceneGeometry = new SceneGeometry(MAX_POINTS);
	sceneGeometry.build(inputMesh["f"], inputMesh["v"], MAX_POINTS);

	// Initialise growth process
	let sources = sceneGeometry.setGrowthSources(3);
	growthProcess = new EdgeBasedGrowth(sceneGeometry.geometry, sceneGeometry.edgeLength * 2);

	// Initialise collision detection
	collisions = new ParticleCollisions(
		sceneGeometry.mesh,
		sceneGeometry.edgeLength,
		Ke,
		REPULSE_COEFF);

	let groundPlane = new RepulsivePlane(
		new Vector(0, 0, 1),
		new Vector(0, 0, -0.01)
	);
	collisions.addRepulsiveSurface(groundPlane);
	growthProcess.addRepulsiveSurface(groundPlane);
}



export function grow() {
	if (!initialized)
		return;

  growthProcess.growEdges(GROWTH_SCALE, GROWTH_FADE, 1 - growthZone);

  // Update colors based on growth factors
  if (colorGrowth)
    sceneGeometry.setColors(growthProcess.growthFactors, -1, 1);
  else
    sceneGeometry.setColors();

  // Store positions before energy minimization
  const positions = sceneGeometry.getPositions();

  sceneGeometry.balanceMesh();
  integrateForces(positions, sceneGeometry.mesh);
	sceneGeometry.smoothMesh(smoothness);

  growCounter++;
  console.log("Grow step: " + growCounter);
  console.log(sceneGeometry.nVertices() + " vertices")
}

export function getGrowthFactors() {
	if (!initialized)
		return;
	return growthProcess.computeGrowthFactors(GROWTH_FADE, 1 - growthZone);
}

function integrateForces(X, mesh) {

  const m = 1;
  const nVertex = mesh.vertices.length;

	// Compute collision forces
	let repulseForce = collisions.repulsiveForces(X);

	let dV = repulseForce.timesReal(TIME_STEP / m);

	// Update positions
	for (let i = 0; i < nVertex; i++) {
		// vectors[i] = bendForce ? new Vector(bendForce.get(3 * i, 0), bendForce.get(3 * i + 1, 0), bendForce.get(3 * i + 2, 0)) : new Vector();
		let dVi = new Vector(dV.get(3 * i, 0), dV.get(3 * i + 1, 0), dV.get(3 * i + 2, 0));
		// console.log(dVi);
		X[i].incrementBy(dVi.times(TIME_STEP));
	}		

  MemoryManager.deleteExcept([growthProcess.growthFactors]);

}