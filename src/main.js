import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';

import Mesh from './mesh/Mesh';

import smallDisk from './obj/small_disk.obj';

import './style.css';

const BEIGE = new THREE.Vector3(1.0, 0.9, 0.9);
const ORANGE = new THREE.Vector3(1.0, 0.5, 0.0);
const GREEN = new THREE.Vector3(0.0, 1.0, 0.3);

// GUI
let sceneState = function() {
  this.growStep = function() { grow() };
  this.growScale = 0.05;
};

let params = new sceneState();
const gui = new dat.GUI();
gui.add( params, 'growStep' );
gui.add( params, 'growScale' );

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

// Build mesh
let mesh = new Mesh();
mesh.buildFromOBJ(smallDisk);

// Create THREE.js geometry object
let threeGeometry = new THREE.BufferGeometry();

console.log(mesh);
// Fill index buffer
let threeIndices = [];
for (let f of mesh.faces) {
  threeIndices.push(...f.getVerticesInd());
}

// Fill positions and colors buffers
let threePositions = [];
let threeColors = [];

for (let v of mesh.vertices) {
  threePositions.push(v.position.x);
  threePositions.push(v.position.y);
  threePositions.push(v.position.z);

  threeColors.push(ORANGE.x);
  threeColors.push(ORANGE.y);
  threeColors.push(ORANGE.z);
}

// Set geometry
threeGeometry.setIndex(threeIndices);
threeGeometry.addAttribute("position", new THREE.Float32BufferAttribute( threePositions, 3 ));
threeGeometry.addAttribute("color", new THREE.Float32BufferAttribute( threeColors, 3 ));

// Create material
let threeMaterial = new THREE.MeshBasicMaterial(
  { vertexColors: THREE.VertexColors,
    wireframe: true }
	);

// Create THREEjs mesh
let threeMesh = new THREE.Mesh(threeGeometry, threeMaterial);
scene.add(threeMesh);

// // Create wireframe
// let wireframe = new THREE.WireframeGeometry( threeGeometry );

// let line = new THREE.LineSegments( wireframe );
// line.material.color = new THREE.Color("#ff0000");
// line.material.depthTest = false;
// line.material.opacity = 0.5;
// line.material.transparent = true;
// scene.add(line);


// Render scene
// grow();
animate();

function grow() {

  for (let e of mesh.edges) {
    // Edge direction
    e.computeProperties();
    let dir = e.direction;
    let growthFactor;
    if (e.isBoundary()) {
      // Grow more than the rest
      growthFactor = 1.0;
      dir.z += Math.random();
    }
    else {
      growthFactor = Math.random();
      dir.z += Math.random() * 0.1;
    }
    dir.multiplyScalar(growthFactor * params.growScale);
    // Move one vertex of the edge
    e.vertices[1].position.add(dir);
    console.log(e.vertices[1].position);
    console.log(mesh.vertices[e.vertices[1].index].position);
  }
  
}

function computeDerivatives() {

  for (let f of mesh.faces) {
    // Compute normal
  }

  for (let e of mesh.edges) {

  }
}

function updateGeometry() {
  for (let i = 0; i < mesh.vertices.length; i++) {
    let v = mesh.vertices[i];
    threeGeometry.attributes.position.setXYZ( i, v.position.x, v.position.y, v.position.z );

    // Update colors if needed
  }

  threeGeometry.attributes.position.needsUpdate = true;
  threeGeometry.computeBoundingSphere();
}


function animate() {

  // if (params.grow)
  //   grow();
  // params.grow = false;
  updateGeometry();

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