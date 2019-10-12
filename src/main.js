import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';

import Vector from '../geometry-processing-js/node/linear-algebra/vector';
import { Geometry } from '../geometry-processing-js/node/core/geometry';
import MeshIO from '../geometry-processing-js/node/utils/meshio';
import { Mesh } from '../geometry-processing-js/node/core/mesh';

import smallDisk from '../geometry-processing-js/input/small_disk.obj';

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
  this.growStep = function() { grow() };
  this.growSteps = function() { growSteps() };
  this.nSteps = 10;
  this.growScale = 0.05;
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
gui.add( params, 'growStep' );
gui.add( params, 'growSteps' );
gui.add( params, 'nSteps' );
gui.add( params, 'growScale' );
gui.add( params, 'collisionDetection' );
gui.add( params, 'energyMin' );
gui.add( params, 'kb' );
gui.add( params, 'timeStep' );
gui.add( params, 'nIter' );
gui.add( params, 'wireframe' );
gui.add( params, 'edgeSize' );

// Init THREE.js scene
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

var renderer = new THREE.WebGLRenderer({
  canvas
});

var scene = new THREE.Scene();
const fov = 45.0;
const aspect = canvas.clientWidth / canvas.clientHeight;
const near = 0.1;
const far = 100;
const eyeZ = 3.5;

var camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = eyeZ;
var controls = new OrbitControls( camera, renderer.domElement );
controls.update();


// Build mesh from polygon soup
let polygonSoup = MeshIO.readOBJ(smallDisk);
let mesh = new Mesh();
mesh.build(polygonSoup);
console.log(mesh);

// Create geometry object
let geometry = new Geometry(mesh, polygonSoup["v"], MAX_POINTS);
raiseEdge(0.1);

// Add colors
let colors = new Array(mesh.vertices.length);
colors.fill(BEIGE);

// Create THREE.js geometry object
let threeGeometry = new THREE.BufferGeometry();

// Fill position and color buffers
// let V = mesh.vertices.length;
let threePositions = new Float32Array(MAX_POINTS * 3);
let threeNormals = new Float32Array(MAX_POINTS * 3);
// let threeColors = new Float32Array(MAX_POINTS * 3);
for (let v of mesh.vertices) {
	let i = v.index;

	let position = geometry.positions[i];
	threePositions[3 * i + 0] = position.x;
	threePositions[3 * i + 1] = position.y;
  threePositions[3 * i + 2] = position.z;

  // Angle weighted normals
  let normal = geometry.vertexNormalAngleWeighted(v);
	threeNormals[3 * i + 0] = normal.x;
	threeNormals[3 * i + 1] = normal.y;
  threeNormals[3 * i + 2] = normal.z;
  
  // let color = colors[i];
  // threeColors[3 * i + 0] = color.x;
  // threeColors[3 * i + 1] = color.y;
  // threeColors[3 * i + 2] = color.z;
};

let indices = new Uint32Array(MAX_POINTS * 3);
console.log(geometry.positions)

for (let i = 0; i < geometry.indices.length; i++) {
  indices[i] = geometry.indices[i];
};

// Set geometry
threeGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
threeGeometry.addAttribute('position', new THREE.BufferAttribute(threePositions, 3));
threeGeometry.addAttribute('normal', new THREE.BufferAttribute(threeNormals, 3));
// threeGeometry.addAttribute("color", new THREE.BufferAttribute(threeColors, 3));

// Create material
let threeMaterial = new THREE.MeshBasicMaterial(
  {
    wireframe: true,
    side: THREE.DoubleSide,
  }
);

let normalMat = new THREE.MeshPhongMaterial( {
  side: THREE.DoubleSide,
  wireframe: params.wireframe,
} );

// Create THREEjs mesh
let threeMesh = new THREE.Mesh(threeGeometry, normalMat);
scene.add(threeMesh);

// let pointColor = new THREE.Color( 'rgb(231, 76, 60)' );
var pointLight = new THREE.PointLight( 0xff0000, 1, 100 );
pointLight.position.set( 20, 20, 20 );
scene.add( pointLight );

var ambientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( ambientLight );

let sources = getGrowthSources(5);
console.log(sources);

let GrowthProcess = new EdgeBasedGrowth(geometry, 1.5, 8.0, params.edgeSize * 2.0);

// Render scene
animate();

function raiseEdge(z) {
  let boundaryFace = mesh.boundaries[0];
  for (let v of boundaryFace.adjacentVertices()) {
    let up;
    if (z !== undefined)
      up = z;
    else
      up = 2 * (Math.random() - 0.5) / 50;
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

  GrowthProcess.growEdges();

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
  
  updateGeometry();

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


function updateGeometry() {
  for (let v of mesh.vertices) {
    let i = v.index;
    let position = geometry.positions[i];
    threeGeometry.attributes.position.setXYZ( i, position.x, position.y, position.z );

    // Angle weighted normals
    let normal = geometry.vertexNormalAngleWeighted(v);
    threeGeometry.attributes.normal.setXYZ(i, normal.x, normal.y, normal.z);
  };
  // This needs to be done only if there was edge splitting
  for (let i = 0; i < geometry.indices.length; i++) {
    indices[i] = geometry.indices[i];
  };

  threeGeometry.index.set(indices);
  threeGeometry.attributes.position.needsUpdate = true;
  threeGeometry.attributes.normal.needsUpdate = true;
  threeGeometry.index.needsUpdate = true;
  threeGeometry.computeBoundingSphere();
}

function animate() {

  // grow();

  render();

  // Next frame
  requestAnimationFrame(animate);
}

function render() {
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
	}
	
  controls.update();
  
  // Set wireframe mode
  threeMesh.material.wireframe = params.wireframe;

  renderer.render(scene, camera);

}


// Responsive canvas
function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}