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
import Scene from './scene';
import SceneGeometry from './scene-geometry';
import DiscreteShells from './discrete-shells';
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
  // this.growScale = 0.05;
  this.collisionDetection = true;
  this.energyMin = true;
  this.kb = 10.0;
  this.ke = 150.0;
  this.implicit = true;
  this.chol = true;
  this.timeStep = 0.01;
  this.nIter = 2;
  this.wireframe = false;
  this.colorGrowth = true;
  this.smoothMesh = function() { sceneGeometry.smoothMesh() };
  this.exportOBJ = function() { exportOBJ(sceneGeometry) };
};

let params = new sceneState();
const gui = new dat.GUI();
gui.add( params, 'playGrowth');
gui.add( params, 'wireframe' );
gui.add( params, 'colorGrowth' );
gui.add( params, 'exportOBJ' );

if (process.env.NODE_ENV === 'development') {
  gui.add( params, 'growStep' );
  gui.add( params, 'growSteps' );
  gui.add( params, 'nSteps' );
  // gui.add( params, 'growScale' );
  gui.add( params, 'collisionDetection' );
  gui.add( params, 'energyMin' );
  gui.add( params, 'kb' );
  gui.add( params, 'ke' );
  gui.add( params, 'implicit' );
  gui.add( params, 'chol' );
  gui.add( params, 'timeStep' );
  gui.add( params, 'nIter' );

  gui.add( params, 'smoothMesh' );

}



// Init THREE.js scene
const scene = new Scene(MAX_POINTS);
scene.init();

// Init geometry
let polygonSoup = MeshIO.readOBJ(smallDisk);
// let polygonSoup = planeGeometry(6, 3, 6, 3);
const sceneGeometry = new SceneGeometry(MAX_POINTS);
sceneGeometry.build(polygonSoup["f"], polygonSoup["v"], MAX_POINTS);

raiseEdge(0.1);

let sources = sceneGeometry.setGrowthSources(5);

scene.updateGeometry(sceneGeometry);

// Vectors
let vectors = new Array(MAX_POINTS);

let growthProcess = new EdgeBasedGrowth(sceneGeometry.geometry, 1.2, 0.5, sceneGeometry.edgeLength, sources);

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
  growthProcess.growEdges();

  // Update colors based on growth factors
  if (params.colorGrowth)
    sceneGeometry.setColors(growthProcess.growthFactors, 0, 1);
  else
    sceneGeometry.setColors();

  // Store positions before energy minimization
  const positions0 = sceneGeometry.getPositionsCopy();
  const positions = sceneGeometry.getPositions();

  sceneGeometry.balanceMesh();


  integrateForces(positions0, positions, sceneGeometry.mesh);
  sceneGeometry.smoothMesh();
  scene.updateGeometry(sceneGeometry);
  // scene.drawVectors(mesh, geometry, vectors);

  growCounter++;
  console.log("Grow step: " + growCounter);
  console.log(sceneGeometry.nVertices() + " vertices")
}

function integrateForces(X0, X, mesh) {
  let shells, collisions;
  if (params.energyMin) {
    shells = new DiscreteShells(
      X0,
      mesh,
      params.kb,
      );
  }

  if (params.collisionDetection) {
    collisions = new ParticleCollisions(
      mesh,
      sceneGeometry.edgeLength * 0.5,
      params.ke);
  }

  if (!shells && !collisions)
    return;

  const m = 1;
  const nVertex = mesh.vertices.length;

  let h = params.timeStep;

  for (let it = 0; it < params.nIter; it++) {
    // Compute bending forces
    const bend = shells && it > 0 ? shells.bendingForces(X) : null;
    let bendForce = bend ? bend.force : null;
    let bendDerivative = bend ? bend.derivative : null;

    const h2 = h * h;

    // Compute collision forces
    const repulse = collisions && it == 0 ? collisions.repulsiveForces(X) : null;
    let repulseForce = repulse ? repulse.force : null;
    let repulseDerivative = repulse ? repulse.derivative : null;

    // Implicit Euler
    // Solve for dV : (I - (h2/m) * forceDerivatives) * dV = (h/m) * forces
    // Build left hand matrix of the equation 
    let A = SparseMatrix.identity(nVertex * 3, nVertex * 3);

    // Build right hand side of the equation
    let B = DenseMatrix.zeros(nVertex * 3, 1);

    if (bend) {
      A.incrementBy(bendDerivative.timesReal(-h2/m));
      B.incrementBy(bendForce);
    }
    if (repulse) {
      A.incrementBy(repulseDerivative.timesReal(-h2/m));
      B.incrementBy(repulseForce);
    }
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

  scene.render(params);

  // Next frame
  requestAnimationFrame(animate);
}
