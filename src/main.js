import * as dat from 'dat.gui';

import Vector from '../geometry-processing-js/node/linear-algebra/vector';
import { Geometry } from '../geometry-processing-js/node/core/geometry';
import MeshIO from '../geometry-processing-js/node/utils/meshio';
import { Mesh } from '../geometry-processing-js/node/core/mesh';

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
  this.kb = 5.0;
  this.timeStep = 0.001;
  this.nIter = 100;
  this.wireframe = false;
  this.edgeSize = 0.25;
};

let params = new sceneState();
const gui = new dat.GUI();
gui.add( params, 'playGrowth');
gui.add( params, 'wireframe' );

if (process.env.NODE_ENV === 'development') {
  gui.add( params, 'growStep' );
  gui.add( params, 'growSteps' );
  gui.add( params, 'nSteps' );
  // gui.add( params, 'growScale' );
  gui.add( params, 'collisionDetection' );
  gui.add( params, 'energyMin' );
  gui.add( params, 'kb' );
  gui.add( params, 'timeStep' );
  gui.add( params, 'nIter' );

  gui.add( params, 'edgeSize' );
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

// let sources = getGrowthSources(4);

let growthProcess = new EdgeBasedGrowth(geometry, 1.5, 4.0, params.edgeSize * 2.0);

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

function growSteps() {
  for (let i = 0; i < params.nSteps; i++) {
    grow();
  }
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
  }

  integrateForces(positions0, geometry.positions);

  balanceMesh();
  
  scene.updateGeometry(mesh, geometry);

  growCounter++;
  console.log("Grow step: " + growCounter)
}

function integrateForces(X0, X) {
  let shells, collisions;
  if (params.energyMin) {
    shells = new DiscreteShells(
      X0,
      // X,
      mesh,
      params.kb,
      params.timeStep,
      params.nIter,
      );
  }

  if (params.collisionDetection) {
    collisions = new ParticleCollisions(
      mesh,
      // X,
      params.edgeSize,
      200.0);
  }

  if (!shells && !collisions)
    return;

  const h2 = params.timeStep * params.timeStep;
  const nVertex = mesh.vertices.length;
  const nullForce = Array(nVertex).fill(new Vector());

  for (let it = 0; it < params.nIter; it++) {
    // Compute bending forces
    const bend = shells ? shells.bendingForces(X) : nullForce;

    // Compute collision forces
    if (collisions)
      collisions.buildGrid(X); // Is it necessary to recompute grid every time?
    const repulse = collisions ? collisions.repulsiveForces(X) : nullForce;

    // Explicit Euler integration
    // Compute new positions for vertices
    for (let i = 0; i < nVertex; i++) {
      let totalForce = bend[i].negated().plus(repulse[i])
      let update = totalForce.times(h2);
      X[i].incrementBy(update);
    }
  }
}

function animate() {

  if (params.playGrowth)
    grow();

  scene.render(params);

  // Next frame
  requestAnimationFrame(animate);
}
