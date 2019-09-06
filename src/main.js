import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import GeometryModule from '../geometry-processing-js/node/core/geometry';
import MeshIO from '../geometry-processing-js/node/utils/meshio';
import MeshModule from '../geometry-processing-js/node/core/mesh';
const Mesh = MeshModule[0]; // Mesh class
const Geometry = GeometryModule[0]; // Geometry class

import smallDisk from '../geometry-processing-js/input/bunny.obj';

import './style.css';

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

// Build polygon soup (vertices and index of faces)
// let vertices = [];
// vertices.push(new Vector(0.0, 0.0, 0.0));
// vertices.push(new Vector(1.0, 0.0, 0.0));
// vertices.push(new Vector(1.0, 0.8, 0.0));
// console.log(vertices);

// let faces = [0, 1, 2];

// let polygonSoup = {
// 	v: vertices,
// 	f: faces
// }

let polygonSoup = MeshIO.readOBJ(smallDisk);

// Build mesh from polygon soup
let mesh = new Mesh();
mesh.build(polygonSoup);

// Create geometry object
let geometry = new Geometry(mesh, polygonSoup["v"]);

// Create THREE.js geometry object
let threeGeometry = new THREE.BufferGeometry();

// Fill position buffer
let V = mesh.vertices.length;
let positions = new Float32Array(V * 3);
for (let v of mesh.vertices) {
	let i = v.index;

	let position = geometry.positions[v];
	positions[3 * i + 0] = position.x;
	positions[3 * i + 1] = position.y;
	positions[3 * i + 2] = position.z;
};

// Fill index buffer
let F = mesh.faces.length;
let indices = new Uint32Array(F * 3);
for (let f of mesh.faces) {
	let i = 0;
	for (let v of f.adjacentVertices()) {
		indices[3 * f.index + i++] = v.index;
	}
};

// Set geometry
threeGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
threeGeometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));

// Create material
let threeMaterial = new THREE.MeshBasicMaterial(
	{ color: 0xffffff }
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