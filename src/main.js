import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import Mesh from './mesh/Mesh';

import smallDisk from './obj/small_disk.obj';

import './style.css';

const BEIGE = new THREE.Vector3(1.0, 0.9, 0.9);
const ORANGE = new THREE.Vector3(1.0, 0.5, 0.0);
const GREEN = new THREE.Vector3(0.0, 1.0, 0.3);

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
	{ vertexColors: THREE.VertexColors }
	);

// Create THREEjs mesh
let threeMesh = new THREE.Mesh(threeGeometry, threeMaterial);
scene.add(threeMesh);

// Create wireframe
let wireframe = new THREE.WireframeGeometry( threeGeometry );

let line = new THREE.LineSegments( wireframe );
line.material.color = new THREE.Color("#ff0000");
line.material.depthTest = false;
line.material.opacity = 0.5;
line.material.transparent = true;
scene.add(line);


// Render scene
render();

function render() {
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
	}
	
	controls.update();

  renderer.render(scene, camera);
  // Next frame
  requestAnimationFrame(render);
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