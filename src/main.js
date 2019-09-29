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

import './style.css';

const BEIGE = new Vector(1.0, 0.9, 0.9);
const ORANGE = new Vector(1.0, 0.5, 0.0);
const GREEN = new Vector(0.0, 1.0, 0.3);

const MAX_POINTS = 10000;

// GUI
let sceneState = function() {
  this.growStep = function() { grow() };
  this.growScale = 0.05;
  // this.split = function() { splitEdges() };
  this.energyMin = true;
  this.kb = 10.0;
  this.timeStep = 0.001;
  this.nIter = 100;
  this.wireframe = false;
};

let params = new sceneState();
const gui = new dat.GUI();
gui.add( params, 'growStep' );
gui.add( params, 'growScale' );
// gui.add( params, 'split' );
gui.add( params, 'energyMin' );
gui.add( params, 'kb' );
gui.add( params, 'timeStep' );
gui.add( params, 'nIter' );
gui.add( params, 'wireframe' );

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

var pointLight = new THREE.PointLight( 0xff0000, 1, 100 );
pointLight.position.set( 20, 20, 20 );
scene.add( pointLight );

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

function balanceMesh() {
  for (let e of mesh.edges) {
    const length = geometry.length(e);
    if (length > 0.5) {
      geometry.split(e);

      console.log("split edge index " + e.index)
    }
  }

}

function grow() {

  // Store positions before growth
  const positions0 = Object.assign({}, geometry.positions);

  let geodesicInfo = computeGeodesics();
  let phi = geodesicInfo.distance;
  let grad = geodesicInfo.gradient;
  let maxPhi = 0;
  for (let i = 0; i < phi.nRows(); i++) {
    maxPhi = Math.max(phi.get(i, 0), maxPhi);
  }

  for (let v of mesh.vertices) {
    // Compute the gradient of distance field at the vertex
    let gradV = new Vector();
    let nF = 0;
    for (let f of v.adjacentFaces()) {
      gradV.incrementBy(grad[f.index]);
      nF++;
    }
    let growthDir = gradV.over(-nF);
    // Grow towards the up direction
    let up = new Vector(0, 0, Math.random());
    growthDir = growthDir.plus(up);
    growthDir.normalize();

    // Scale growth depending on geodesic distance
    const alpha = 1;
    let dist = phi.get(v.index, 0);
    let geodesicScale = Math.pow(maxPhi - dist, alpha);
    growthDir.scaleBy(geodesicScale * params.growScale);
    geometry.positions[v.index] = geometry.positions[v.index].plus(growthDir);
  }

  if (params.energyMin) {
    const shells = new DiscreteShells(
      positions0,
      geometry.positions,
      mesh,
      params.kb,
      params.timeStep,
      params.nIter,
      );
    shells.minimizeBend();
  }

  balanceMesh();
  
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