import * as dat from 'dat.gui';

import Vector from '../geometry-processing-js/node/linear-algebra/vector';
import MeshIO from '../geometry-processing-js/node/utils/meshio';
import DenseMatrix from '../geometry-processing-js/node/linear-algebra/dense-matrix';
import sparse from '../geometry-processing-js/node/linear-algebra/sparse-matrix';
const SparseMatrix = sparse[0];
import MemoryManager from '../geometry-processing-js/node/linear-algebra/emscripten-memory-manager';

import smallDisk from './obj/small_disk.obj';

import { planeGeometry } from './input';
import { exportOBJ } from './output';
import Renderer from './renderer';
import SceneGeometry from './scene-geometry';
import ParticleCollisions from './particle-collisions';
import EdgeBasedGrowth from './edge-based-growth';

import './style.css';

const BEIGE = new Vector(1.0, 0.9, 0.9);
const ORANGE = new Vector(1.0, 0.5, 0.0);
const GREEN = new Vector(0.0, 1.0, 0.3);

const MAX_POINTS = 100000;
let growCounter = 0;

// GUI
let sceneState = function() {
  this.playGrowth = false;
  this.growStep = function() { grow() };
  this.growSteps = function() { growSteps() };
  this.nSteps = 10;
  this.growthScale = 2.0;
  // this.growthFade = 2.2;
  this.growthFade = 0.5;
  this.growthZone = 0.5;
  this.collisionDetection = true;
  this.energyMin = false;
  this.kb = 15.0;
  this.ke = 30.0;
  this.smooth = true;
  // this.smoothness = 0.003;
  this.smoothness = 0.5;
  this.implicit = false;
  this.chol = true;
  this.timeStep = 0.02;
  this.nIter = 1;
  this.wireframe = false;
  this.colorGrowth = true;
  this.smoothMesh = function() { sceneGeometry.smoothMesh() };
  this.meanCurvSmooth = function() {
    sceneGeometry.smoothMesh(params.smoothness);
    // sceneGeometry.meanCurvSmooth(params.smoothness);
    renderer.updateGeometry(sceneGeometry);
  };
  this.inputMesh = 'disk';
  this.exportOBJ = function() { exportOBJ(sceneGeometry) };
};

let params = new sceneState();

const gui = new dat.GUI();

let growFolder = gui.addFolder('Growth action');
growFolder.add( params, 'playGrowth');
growFolder.add( params, 'growStep' );

growFolder.open();

let growParamsFolder = gui.addFolder('Growth parameters');
// let growthFadeCtrl = growParamsFolder.add( params, 'growthFade', 0.1, 10);
let growthFadeCtrl = growParamsFolder.add( params, 'growthFade', 0.1, 0.9);
let growthZoneCtrl = growParamsFolder.add( params, 'growthZone', 0.1, 0.9);
// growParamsFolder.add( params, 'growthScale', 1, 2);

growParamsFolder.open();

let materialFolder = gui.addFolder('Material parameters');
// materialFolder.add( params, 'kb', 5, 25);
materialFolder.add( params, 'ke', 20, 60);
// materialFolder.add( params, 'smoothness', 0.001, 0.01);
materialFolder.add( params, 'smoothness', 0.2, 1.0);
materialFolder.add( params, 'smooth');

materialFolder.open();

let displayFolder = gui.addFolder('Display settings');
displayFolder.add( params, 'wireframe' );
displayFolder.add( params, 'colorGrowth' );

displayFolder.open();

let ioFolder = gui.addFolder('In/Out');
let inputMeshSelect = ioFolder.add( params, 'inputMesh', [ 'disk', 'rectangle' ] );
ioFolder.add( params, 'exportOBJ' );


ioFolder.open();

growthFadeCtrl.onFinishChange(value => {
  onGrowthParamsChange();
});

growthZoneCtrl.onFinishChange(value => {
  onGrowthParamsChange();
});

inputMeshSelect.onFinishChange((value) => {
  let inputMesh;
  switch(params.inputMesh) {
    case 'disk':
      inputMesh = MeshIO.readOBJ(smallDisk);
      params.growthScale = 2.0;
      break;
    case 'rectangle':
      inputMesh = planeGeometry(6, 3, 6, 3);
      params.growthScale = 1.5;
      break;
  }

  sceneGeometry.build(inputMesh["f"], inputMesh["v"], MAX_POINTS);

  raiseEdge(0.1);
  growthProcess = new EdgeBasedGrowth(sceneGeometry.geometry, sceneGeometry.edgeLength * 2);
  renderer.updateGeometry(sceneGeometry);
});

function onGrowthParamsChange() {
  if (!params.colorGrowth)
    return;
  let factors = growthProcess.computeGrowthFactors(params.growthFade, 1 - params.growthZone);
  // Update colors based on growth factors
  sceneGeometry.setColors(factors, 0.0, 1);
  renderer.updateGeometry(sceneGeometry);
}



// if (process.env.NODE_ENV === 'development') {
//   gui.add( params, 'growSteps' );
//   gui.add( params, 'nSteps' );
//   // gui.add( params, 'growScale' );
//   gui.add( params, 'collisionDetection' );
//   gui.add( params, 'energyMin' );
  gui.add( params, 'implicit' );
  gui.add( params, 'meanCurvSmooth' );
//   gui.add( params, 'chol' );
//   gui.add( params, 'timeStep' );
//   gui.add( params, 'nIter' );

//   gui.add( params, 'smoothMesh' );

// }



// Init THREE.js scene
const renderer = new Renderer(MAX_POINTS);
renderer.init();

// Init geometry
let inputMesh;
switch(params.inputMesh) {
  case 'disk':
    inputMesh = MeshIO.readOBJ(smallDisk);
    break;
  case 'rectangle':
    inputMesh = planeGeometry(6, 3, 6, 3);
    break;

}
// let inputMesh = MeshIO.readOBJ(smallDisk);
// let inputMesh = planeGeometry(6, 3, 6, 3);
const sceneGeometry = new SceneGeometry(MAX_POINTS);
sceneGeometry.build(inputMesh["f"], inputMesh["v"], MAX_POINTS);

raiseEdge(0.1);

let sources = sceneGeometry.setGrowthSources(3);

renderer.updateGeometry(sceneGeometry);

// Vectors
let vectors = new Array(MAX_POINTS);

let growthProcess = new EdgeBasedGrowth(sceneGeometry.geometry, sceneGeometry.edgeLength * 2);

// Render scene
animate();

function raiseEdge(z) {
  let boundaryFace = sceneGeometry.mesh.boundaries[0];
  let X = sceneGeometry.getPositions();
  for (let v of boundaryFace.adjacentVertices()) {
    let up;
    if (z !== undefined)
      up = z;
    else
      up = Math.random() / 100;
    X[v.index].incrementBy(new Vector(0, 0, up));
  }
}



function growSteps() {
  for (let i = 0; i < params.nSteps; i++) {
    grow();
  }
}

function grow() {
  // raiseEdge();
  growthProcess.growEdges(params.growthScale, params.growthFade, 1 - params.growthZone);

  // Update colors based on growth factors
  if (params.colorGrowth)
    sceneGeometry.setColors(growthProcess.growthFactors, 0.0, 1);
  else
    sceneGeometry.setColors();

  // Store positions before energy minimization
  const positions0 = sceneGeometry.getPositionsCopy();
  const positions = sceneGeometry.getPositions();

  sceneGeometry.balanceMesh();
  integrateForces(positions0, positions, sceneGeometry.mesh);
  if (params.smooth)
    sceneGeometry.smoothMesh(params.smoothness);
  renderer.updateGeometry(sceneGeometry);

  growCounter++;
  console.log("Grow step: " + growCounter);
  console.log(sceneGeometry.nVertices() + " vertices")
}

function integrateForces(X0, X, mesh) {

  let collisions = new ParticleCollisions(
      mesh,
      sceneGeometry.edgeLength,
      params.ke / sceneGeometry.edgeLength);

  const m = 1;
  const nVertex = mesh.vertices.length;

  let h = params.timeStep;

  for (let it = 0; it < params.nIter; it++) {

    const h2 = h * h;

    // Compute collision forces
    const repulse = collisions ? collisions.repulsiveForces(X) : null;
    let repulseForce = repulse ? repulse.force : null;
    let repulseDerivative = repulse ? repulse.derivative : null;

    // Implicit Euler
    // Solve for dV : (I - (h2/m) * forceDerivatives) * dV = (h/m) * forces
    // Build left hand matrix of the equation 
    let A = SparseMatrix.identity(nVertex * 3, nVertex * 3);

    // Build right hand side of the equation
    let B = DenseMatrix.zeros(nVertex * 3, 1);

    A.incrementBy(repulseDerivative.timesReal(-h2/m));
    B.incrementBy(repulseForce);
    
    B.scaleBy(h / m);

    let dV;

    if (params.implicit) {
      // Solve
      if (params.chol) {
        let llt = A.chol();
        dV = llt.solvePositiveDefinite(B);
      }
      else {
        let qr = A.qr();
        dV = qr.solve(B);
      }
    }
    else {
      dV = B;
    }

    // Update positions
    for (let i = 0; i < nVertex; i++) {
      // vectors[i] = bendForce ? new Vector(bendForce.get(3 * i, 0), bendForce.get(3 * i + 1, 0), bendForce.get(3 * i + 2, 0)) : new Vector();
      let dVi = new Vector(dV.get(3 * i, 0), dV.get(3 * i + 1, 0), dV.get(3 * i + 2, 0));
      // console.log(dVi);
      X[i].incrementBy(dVi.times(h));
    }		

  }
  MemoryManager.deleteExcept([growthProcess.growthFactors]);


}

function animate() {

  if (params.playGrowth)
    grow();

    renderer.render(params);

  // Next frame
  requestAnimationFrame(animate);
}
