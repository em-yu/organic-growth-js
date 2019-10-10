import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';

import Vector from '../geometry-processing-js/node/linear-algebra/vector';
import DenseMatrix from '../geometry-processing-js/node/linear-algebra/dense-matrix';
import { Geometry } from '../geometry-processing-js/node/core/geometry';
import MeshIO from '../geometry-processing-js/node/utils/meshio';
import { Mesh } from '../geometry-processing-js/node/core/mesh';
import HeatMethod from '../geometry-processing-js/node/projects/geodesic-distance/heat-method';
// const Mesh = MeshModule[0]; // Mesh class
// const Geometry = GeometryModule[0]; // Geometry class

import smallDisk from '../geometry-processing-js/input/small_disk.obj';

import DiscreteShells from './discrete-shells';
import ParticleCollisions from './particle-collisions';

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
  this.repulse = function() { repulse() };
  this.nSteps = 10;
  this.growScale = 0.05;
  this.flip = function() { flipEdge() };
  this.collisionDetection = true;
  this.energyMin = true;
  this.kb = 10.0;
  this.timeStep = 0.001;
  this.nIter = 100;
  this.wireframe = false;
  this.edgeSize = 0.25;
};

let params = new sceneState();
const gui = new dat.GUI();
gui.add( params, 'growStep' );
gui.add( params, 'growSteps' );
gui.add( params, 'repulse' );
gui.add( params, 'nSteps' );
gui.add( params, 'growScale' );
gui.add( params, 'flip' );
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

var ambientColor = new THREE.Color( 'rgb(247, 249, 249)' );
var ambientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( ambientLight );

// Render scene
animate();

function computeGeodesics() {
  // initialize geodesics in heat
  let V = mesh.vertices.length;
  // Vector containing sources
  let delta = DenseMatrix.zeros(V, 1);

  // Grow edge vertices
  let boundaryFace = mesh.boundaries[0];
  // Add heat sources at boundary vertices
  for (let v of boundaryFace.adjacentVertices()) {
    delta.set(1, v.index, 0);
  }
  let heatMethod = new HeatMethod(geometry);

  return heatMethod.compute(delta);
}


function splitEdges() {
  // split edge 0
  let edge = mesh.edges[36];
  geometry.split(edge);
  for (let i = 0; i < geometry.indices.length; i++) {
    indices[i] = geometry.indices[i];
  };

  updateGeometry();
}

function flipEdge() {
  let edge = mesh.edges[0];
  // if (geometry.isFlippable(edge))
  geometry.flip(edge);
  updateGeometry();
}

function balanceMesh() {

  const nEdges0 = mesh.edges.length;

  for (let i = 0; i < nEdges0; i++) {
    const e = mesh.edges[i];
    const length = geometry.length(e);
    if (length > params.edgeSize * 2) {
      if (geometry.isFlippable(e)) {
        geometry.flip(e);
        // console.log("flip edge index " + e.index);
      }
      else {
        geometry.split(e);
        // console.log("split edge index " + e.index)
      }
    }
  }

}

function growSteps() {
  for (let i = 0; i < params.nSteps; i++) {
    grow();
  }
}

function grow() {

  // Store positions before growth
  const positions0 = Object.assign({}, geometry.positions);

  let geodesicInfo = computeGeodesics();
  let phi = geodesicInfo.distance;
  let grad = geodesicInfo.gradient;
  console.log(grad);
  let maxPhi = 0;
  for (let i = 0; i < phi.nRows(); i++) {
    maxPhi = Math.max(phi.get(i, 0), maxPhi);
  }
  const alpha = 10.0;
  const scaleNormalizer = Math.pow(maxPhi, alpha);

  let boundaryFace = mesh.boundaries[0];
  // Add heat sources at boundary vertices
  for (let v of boundaryFace.adjacentVertices()) {
    phi.set(0, v.index, 0);
  }

  for (let v of mesh.vertices) {
    // Compute the gradient of distance field at the vertex
    let gradV = new Vector();
    let nF = 0;
    for (let f of v.adjacentFaces()) {
      gradV.incrementBy(grad[f.index]);
      nF++;
    };
    // let growthDir = gradV.over(-nF);
    let outerDir = gradV.over(-nF);
    // let outerDir = v.halfedge.face ? grad[v.halfedge.face.index] : grad[v.halfedge.twin.face.index];
    let normal = geometry.vertexNormalAngleWeighted(v);
    // let growthDir = outerDir.cross(normal).plus(outerDir.times(2.0));
    let growthDir = outerDir;
    // let growthDir = normal.negated();
    // Grow towards the up direction
    let up = new Vector(0, 0, 0.5);
    growthDir = growthDir.plus(up);
    // let growthDir = new Vector(0, 0, 0.5);

    growthDir.normalize();

    // Scale growth depending on geodesic distance
    let dist = phi.get(v.index, 0);
    let geodesicScale = Math.pow(maxPhi - dist, alpha) / scaleNormalizer;
    growthDir.scaleBy(geodesicScale * params.growScale);
    geometry.positions[v.index] = geometry.positions[v.index].plus(growthDir);
  }

  updateGeometry();


  // if (params.energyMin) {
  //   shells = new DiscreteShells(
  //     positions0,
  //     geometry.positions,
  //     mesh,
  //     params.kb,
  //     params.timeStep,
  //     params.nIter,
  //     );
  //   // shells.minimizeBend();
  // }

  // if (params.collisionDetection) {
  //   collisions = new ParticleCollisions(
  //     mesh,
  //     geometry.positions,
  //     0.1,
  //     1.0);
  //   // collisions.buildGrid();
  //   // collisions.collisionForces();
  // }
  // console.log(geometry.positions);
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
      X,
      mesh,
      params.kb,
      params.timeStep,
      params.nIter,
      );
    // shells.minimizeBend();
  }

  if (params.collisionDetection) {
    collisions = new ParticleCollisions(
      mesh,
      X,
      // 0.5,
      params.edgeSize,
      1000.0);
    // collisions.buildGrid();
    // collisions.collisionForces();
  }

  if (!shells && !collisions)
    return;

  const h2 = params.timeStep * params.timeStep;
  const nVertex = mesh.vertices.length;
  const nullForce = Array(nVertex).fill(new Vector());

  for (let it = 0; it < params.nIter; it++) {
    // Compute bending forces
    const bendForces = shells ? shells.hingeGradient() : nullForce;
    // console.log(bendForces);

    // Compute collision forces
    if (collisions)
      collisions.buildGrid();
    const repulsiveForces = collisions ? collisions.collisionForces() : nullForce;
    console.log(repulsiveForces);

    // Explicit Euler integration
    // Compute new positions for vertices
    for (let i = 0; i < nVertex; i++) {
      let totalForce = bendForces[i].negated().plus(repulsiveForces[i])
      let update = totalForce.times(h2);
      // let update = repulsiveForces[i].times(h2);
      // X[i] = X[i].plus(update);
      X[i].incrementBy(update);
    }
    // updateGeometry();
  }
}

function repulse() {
	
  for (let it = 0; it < params.nIter; it++) {
    // Compute collision forces
    const collisions = new ParticleCollisions(
      mesh,
      geometry.positions,
      0.2,
      50.0);
    collisions.buildGrid();
    const repulsiveForces = collisions.collisionForces();
    // Explicit Euler integration
    // Compute new positions for vertices
    const nVertex = mesh.vertices.length;
    for (let i = 0; i < nVertex; i++) {
      // let update = hingeGrad[i].plus(repulsiveForces[i]).times(-this.h2);
      let update = repulsiveForces[i].times(params.timeStep * params.timeStep);
      geometry.positions[i].incrementBy(update);
      
    }
  }
  updateGeometry();
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