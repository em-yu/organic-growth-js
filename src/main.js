import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import Vector from '../geometry-processing-js/node/linear-algebra/vector';
import { Geometry } from '../geometry-processing-js/node/core/geometry';
import MeshIO from '../geometry-processing-js/node/utils/meshio';
import { Mesh } from '../geometry-processing-js/node/core/mesh';
// const Mesh = MeshModule[0]; // Mesh class
// const Geometry = GeometryModule[0]; // Geometry class

import smallDisk from '../geometry-processing-js/input/small_disk.obj';

import './style.css';

const BEIGE = new Vector(1.0, 0.9, 0.9);
const ORANGE = new Vector(1.0, 0.5, 0.0);
const GREEN = new Vector(0.0, 1.0, 0.3);

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

// Create geometry object
let geometry = new Geometry(mesh, polygonSoup["v"]);

// Add colors
let colors = new Array(mesh.vertices.length);
colors.fill(BEIGE);

// Grow edge vertices
let boundaryFace = mesh.boundaries[0];

for (let v of boundaryFace.adjacentVertices()) {
  colors[v.index] = ORANGE;
  // Find an inner edge
  let innerEdge;
  for (let e of v.adjacentEdges()) {
    innerEdge = e.halfedge;
    if (!innerEdge.onBoundary && !innerEdge.twin.onBoundary)
      break;
  }
  let innerVertex = innerEdge.vertex;
  if (innerVertex.index == v.index) {
    innerVertex = innerEdge.twin.vertex;
  };
  colors[innerVertex.index] = GREEN;

  // Translate edge vertex along inner edge
  let vPos = geometry.positions[v.index];
  let iPos = geometry.positions[innerVertex.index];
  let dir = vPos.minus(iPos);
  dir.normalize();
  dir.scaleBy(0.1);
  geometry.positions[v.index] = vPos.plus(dir);
}

// Create THREE.js geometry object
let threeGeometry = new THREE.BufferGeometry();

// Fill position and color buffers
let V = mesh.vertices.length;
let threePositions = new Float32Array(V * 3);
let threeColors = new Float32Array(V * 3);
for (let v of mesh.vertices) {
	let i = v.index;

	let position = geometry.positions[i];
	threePositions[3 * i + 0] = position.x;
	threePositions[3 * i + 1] = position.y;
  threePositions[3 * i + 2] = position.z;
  
  let color = colors[i];
  threeColors[3 * i + 0] = color.x;
  threeColors[3 * i + 1] = color.y;
  threeColors[3 * i + 2] = color.z;
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
threeGeometry.addAttribute("position", new THREE.BufferAttribute(threePositions, 3));
threeGeometry.addAttribute("color", new THREE.BufferAttribute(threeColors, 3));

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