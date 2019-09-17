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

import './style.css';

const BEIGE = new Vector(1.0, 0.9, 0.9);
const ORANGE = new Vector(1.0, 0.5, 0.0);
const GREEN = new Vector(0.0, 1.0, 0.3);

const MAX_POINTS = 1000;

// GUI
let sceneState = function() {
  this.growStep = function() { grow() };
  this.growScale = 0.05;
  this.split = function() { splitEdges() };
};

let params = new sceneState();
const gui = new dat.GUI();
gui.add( params, 'growStep' );
gui.add( params, 'growScale' );
gui.add( params, 'split' );

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
// let threeColors = new Float32Array(MAX_POINTS * 3);
for (let v of mesh.vertices) {
	let i = v.index;

	let position = geometry.positions[i];
	threePositions[3 * i + 0] = position.x;
	threePositions[3 * i + 1] = position.y;
  threePositions[3 * i + 2] = position.z;
  
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
threeGeometry.addAttribute("position", new THREE.BufferAttribute(threePositions, 3));
// threeGeometry.addAttribute("color", new THREE.BufferAttribute(threeColors, 3));

// Create material
let threeMaterial = new THREE.MeshBasicMaterial(
  {
    wireframe: true,
  }
);

// Create THREEjs mesh
let threeMesh = new THREE.Mesh(threeGeometry, threeMaterial);
scene.add(threeMesh);


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

function minimizeBend() {
  // Compute 
}

function splitEdges() {
  // split edge 0
  let edge = mesh.edges[5];
  geometry.split(edge);
  for (let i = 0; i < geometry.indices.length; i++) {
    indices[i] = geometry.indices[i];
  };

  updateGeometry();
}

function balanceMesh() {
  for (let e of mesh.edges) {
    const length = geometry.length(e);
    if (length > 1.0) {
      geometry.split(e);

      // console.log("split edge index " + e.index)
    }
  }

}

function grow() {

  // Store positions before growth
  const initialState = Object.assign({}, geometry.positions);

  let phi = computeGeodesics();
  let maxPhi = 0;
  for (let i = 0; i < phi.nRows(); i++) {
    maxPhi = Math.max(phi.get(i, 0), maxPhi);
  }

  for (let e of mesh.edges) {
    if (e.onBoundary())
      continue;
    let vA = e.halfedge.vertex;
    let vB = e.halfedge.twin.vertex;
    let phiA = phi.get(vA.index, 0);
    let phiB = phi.get(vB.index, 0);
    // console.log(e.index);
    // console.log(vA, vB);
    // console.log(phiA, phiB);

    // Grow along edge towards smaller phi
    if (phiA < phiB) {
      [vA, vB] = [vB, vA];
    }
    let growthDir = geometry.positions[vB.index].minus(geometry.positions[vA.index]);

    // Grow towards the up direction
    let up = new Vector(0, 0, Math.random());
    growthDir = growthDir.plus(up);
    growthDir.normalize();

    // Divide by number of non boundary edges incident on vertices
    // TODO: Make this more efficient (remove loop)
    let nE = 0;
    for (let e of vB.adjacentEdges()) {
      if (!e.onBoundary())
        nE++;
    }

    let normalizingFactor = nE > 0 ? 1/nE : 1;

    // Scale growth depending on geodesic distance
    let geodesicScale = maxPhi - (phiA + phiB) / 2;
    growthDir.scaleBy(geodesicScale * params.growScale * normalizingFactor);
    geometry.positions[vB.index] = geometry.positions[vB.index].plus(growthDir);
  }

  minimizeBend(initialState);

  balanceMesh();
  
  updateGeometry();
}

function updateGeometry() {
  for (let v of mesh.vertices) {
    let i = v.index;
    let position = geometry.positions[i];
    threeGeometry.attributes.position.setXYZ( i, position.x, position.y, position.z );
  };
  // This needs to be done only if there was edge splitting
  for (let i = 0; i < geometry.indices.length; i++) {
    indices[i] = geometry.indices[i];
  };

  threeGeometry.index.set(indices);
  threeGeometry.attributes.position.needsUpdate = true;
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