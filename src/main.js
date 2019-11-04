import * as dat from 'dat.gui';

import MeanCurvatureFlow from '../geometry-processing-js/node/projects/geometric-flow/mean-curvature-flow';

import Vector from '../geometry-processing-js/node/linear-algebra/vector';
import { Geometry } from '../geometry-processing-js/node/core/geometry';
import MeshIO from '../geometry-processing-js/node/utils/meshio';
import { Mesh } from '../geometry-processing-js/node/core/mesh';
import DenseMatrix from '../geometry-processing-js/node/linear-algebra/dense-matrix';
import sparse from '../geometry-processing-js/node/linear-algebra/sparse-matrix';
const SparseMatrix = sparse[0];
import MemoryManager from '../geometry-processing-js/node/linear-algebra/emscripten-memory-manager';

import { colormap, coolwarm } from '../geometry-processing-js/node/utils/colormap';

import smallDisk from '../geometry-processing-js/input/small_disk.obj';

import Scene from './scene';
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
  this.edgeSize = 0.25;
  this.colorGrowth = true;
  this.smoothMesh = function() { smoothMesh() };
  this.exportOBJ = function() { exportOBJ() };
};

let params = new sceneState();
const gui = new dat.GUI();
gui.add( params, 'playGrowth');
gui.add( params, 'wireframe' );
// gui.add( params, 'colorGrowth' );
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

  gui.add( params, 'edgeSize' );

  gui.add( params, 'smoothMesh' );

}

function exportOBJ() {

  let positions = new Array(mesh.vertices.length * 3);
  let normals = new Array(mesh.vertices.length * 3);

  for (let v of mesh.vertices) {
    let i = v.index;

    let position = geometry.positions[v];
    positions[3 * i + 0] = position.x;
    positions[3 * i + 1] = position.y;
    positions[3 * i + 2] = position.z;

    let normal = geometry.vertexNormalEquallyWeighted(v);
    normals[3 * i + 0] = normal.x;
    normals[3 * i + 1] = normal.y;
    normals[3 * i + 2] = normal.z;
  }

  let text = MeshIO.writeOBJ({
    "v": positions,
    "vt": undefined,
    "vn": normals,
    "f": geometry.indices
  })

  let element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
  element.setAttribute("download", "export.obj");

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

// Init THREE.js scene
const scene = new Scene(MAX_POINTS);
scene.init();


// Build mesh from polygon soup
let polygonSoup = MeshIO.readOBJ(smallDisk);
let mesh = new Mesh();
mesh.build(polygonSoup);
console.log(mesh);

// Create geometry object
let geometry = new Geometry(mesh, polygonSoup["v"], MAX_POINTS);
raiseEdge(0.1);

scene.updateGeometry(mesh, geometry);

// Colors
let colors = new Array(MAX_POINTS);

// Vectors
let vectors = new Array(MAX_POINTS);

// let sources = getGrowthSources(4);

let growthProcess = new EdgeBasedGrowth(geometry, 1.2, 6.0, params.edgeSize * 2.0);

// Render scene
animate();

function raiseEdge(z) {
  let boundaryFace = mesh.boundaries[0];
  for (let v of boundaryFace.adjacentVertices()) {
    let up;
    if (z !== undefined)
      up = z;
    else
      up = Math.random() / 100;
    geometry.positions[v.index].incrementBy(new Vector(0, 0, up));
  }
}

function getGrowthSources(nb) {
  let boundaryFace = mesh.boundaries[0];
  let nV = 0;
  for (let v of boundaryFace.adjacentVertices()) {
    nV++;
  }
  let stride = Math.floor(nV / nb);
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


function balanceMesh() {

  const nEdges0 = mesh.edges.length;

  for (let i = 0; i < nEdges0; i++) {
    const e = mesh.edges[i];
    if (geometry.isFlippable(e)) {
      geometry.flip(e);
    }
  }

}

function smoothMesh() {
  for (let v of mesh.vertices) {
    if (v.onBoundary())
      continue;
    let vPos = geometry.positions[v.index];
    let barycenter = new Vector();
    let n = 0;
    for (let adjacent of v.adjacentVertices()) {
      const aPos = geometry.positions[adjacent.index];
      barycenter.incrementBy(aPos);
      n++;
    }
    if (n > 0) {
      barycenter.divideBy(n);
      let smoothing = barycenter.minus(vPos);
      let normal = geometry.vertexNormalAngleWeighted(v);
      let sn = smoothing.dot(normal);
      smoothing.decrementBy(normal.times(sn));
      smoothing.scaleBy(0.1);

      // Move vertex to tangential barycenter of neighbors
      geometry.positions[v.index].incrementBy(smoothing);
    }
  }
  scene.updateGeometry(mesh, geometry, colors);
}

function growSteps() {
  for (let i = 0; i < params.nSteps; i++) {
    grow();
  }
}

function meanCurvSmooth() {
  let meanCurvatureFlow = new MeanCurvatureFlow(geometry);
  let h = 0.001;
  meanCurvatureFlow.integrate(h);
  scene.updateGeometry(mesh, geometry, colors);
}

function grow() {
  // raiseEdge();
  growthProcess.growEdges();

  // Store positions before energy minimization
  const positions0 = {};
  for (let v of mesh.vertices) {
    let pos0 = new Vector(
                geometry.positions[v.index].x,
                geometry.positions[v.index].y,
                geometry.positions[v.index].z
                )
    positions0[v.index] = pos0;

    if (params.colorGrowth) {
      // Compute new vertex colors based on growth factors
      colors[v.index] = colormap(growthProcess.growthFactors.get(v.index, 0), 0, 1, coolwarm);
    }
  }

  balanceMesh();


  integrateForces(positions0, geometry.positions);
  smoothMesh();
  scene.updateGeometry(mesh, geometry, colors);
  // scene.drawVectors(mesh, geometry, vectors);

  growCounter++;
  console.log("Grow step: " + growCounter);
  console.log(mesh.vertices.length + " vertices")
}

function integrateForces(X0, X) {
  let shells, collisions;
  if (params.energyMin) {
    shells = new DiscreteShells(
      X0,
      // X,
      mesh,
      params.kb,
      );
  }

  if (params.collisionDetection) {
    collisions = new ParticleCollisions(
      mesh,
      // X,
      params.edgeSize,
      params.ke);
  }

  if (!shells && !collisions)
    return;

  const h2 = params.timeStep * params.timeStep;
  const m = 1;
  const nVertex = mesh.vertices.length;

  for (let it = 0; it < params.nIter; it++) {
    // Compute bending forces
    const bend = shells && it > 0 ? shells.bendingForces(X) : null;
    let bendForce = bend ? bend.force : null;
    let bendDerivative = bend ? bend.derivative : null;

    // if (bendForce) console.log(bendForce.norm(0));

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
    B.scaleBy(params.timeStep / m);

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
      X[i].incrementBy(dVi.times(params.timeStep));
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
