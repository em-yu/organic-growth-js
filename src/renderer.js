import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import Vector from '../geometry-processing-js/node/linear-algebra/vector';

const DEFAULT = new Vector(1.0, 0.3, 0.3);
const EDGE_COLOR = new Vector(1.0, 1.0, 1.0);

let canvas;

let gravity_arrow;

export default class Renderer {
	constructor(MAX_POINTS) {
		this.bufferGeometry = undefined;
		this.renderer = undefined;
		this.scene = undefined;
		this.camera = undefined;
		this.controls = undefined;
		this.renderedMesh = undefined;
		this.MAX_POINTS = MAX_POINTS;
	}


	init() {
		// Init THREE.js scene
		canvas = document.createElement('canvas');
		document.body.appendChild(canvas);

		this.renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true
		});

		this.scene = new THREE.Scene();
		let fov = 45.0;
		let aspect = canvas.clientWidth / canvas.clientHeight;
		let near = 0.1;
		let far = 100;
		let eyeZ = 10.0;

		this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		this.camera.position.z = eyeZ;
		this.camera.up = new THREE.Vector3(0, 0, 1);
		this.controls = new OrbitControls( this.camera, canvas );
		this.controls.update();

		// Create THREE.js geometry object
		this.bufferGeometry = new THREE.BufferGeometry();

		// Initialize Buffers
		let threePositions = new Float32Array(this.MAX_POINTS * 3);
		let threeNormals = new Float32Array(this.MAX_POINTS * 3);
		let threeColors = new Float32Array(this.MAX_POINTS * 3);
		let indices = new Uint32Array(this.MAX_POINTS * 3);

		// Set geometry
		this.bufferGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
		this.bufferGeometry.addAttribute('position', new THREE.BufferAttribute(threePositions, 3));
		this.bufferGeometry.addAttribute('normal', new THREE.BufferAttribute(threeNormals, 3));
		this.bufferGeometry.addAttribute('color', new THREE.BufferAttribute(threeColors, 3));

		// Create material
		const material = new THREE.MeshPhongMaterial( {
			vertexColors: THREE.VertexColors,
			side: THREE.DoubleSide,
			wireframe: false,
		} );

		// Create THREEjs mesh
		this.renderedMesh = new THREE.Mesh(this.bufferGeometry, material);
		this.scene.add(this.renderedMesh);

		// Lights
		let pointLight = new THREE.PointLight( new THREE.Color("rgb(255, 230, 230)"), 1.0, 100 );
		pointLight.position.set( 20, 40, 20 );
		this.scene.add( pointLight );

		let pointLight2 = new THREE.PointLight( new THREE.Color("rgb(255, 230, 230)"), 1.0, 100 );
		pointLight2.position.set( -20, -40, -20 );
		this.scene.add( pointLight2 );

		let ambientLight = new THREE.AmbientLight( new THREE.Color("rgb(179, 179, 179)") ); // soft white light
		this.scene.add( ambientLight );
	}

	updateGeometry(sceneGeometry) {
		const vertices = sceneGeometry.mesh.vertices;
		const geometry = sceneGeometry.geometry;
		const colors = sceneGeometry.colors;
		for (let v of vertices) {
			let i = v.index;
			let position = geometry.positions[i];
			this.bufferGeometry.attributes.position.setXYZ( i, position.x, position.y, position.z );
	
			// Angle weighted normals
			let normal = geometry.vertexNormalAngleWeighted(v);
			this.bufferGeometry.attributes.normal.setXYZ(i, normal.x, normal.y, normal.z);

			// Colors
			let color;
			if (colors && colors[i]) {
				color = colors[i];
			}
			else {
				color = DEFAULT;
			}
			this.bufferGeometry.attributes.color.setXYZ(i, color.x, color.y, color.z);
		};
		// This needs to be done only if there was edge splitting
		let indices = new Uint32Array(this.MAX_POINTS * 3);
		for (let i = 0; i < geometry.indices.length; i++) {
			indices[i] = geometry.indices[i];
		};
	
		this.bufferGeometry.index.set(indices);
		this.bufferGeometry.attributes.position.needsUpdate = true;
		this.bufferGeometry.attributes.normal.needsUpdate = true;
		this.bufferGeometry.attributes.color.needsUpdate = true;
		this.bufferGeometry.index.needsUpdate = true;
		this.bufferGeometry.computeBoundingSphere();
	}

	drawGravityArrow(x, y, z) {
		let dir = new THREE.Vector3(x, y, z);
		var origin = new THREE.Vector3( 0, 0, 0 );
		var length = dir.length() + 0.01;
		dir = dir.normalize();
		gravity_arrow = new THREE.ArrowHelper( dir, origin, length, 0xffff00 );
		this.scene.add( gravity_arrow );
	}

	removeGravityArrow() {
		this.scene.remove( gravity_arrow );
	}

	drawVectors(mesh, geometry, vectors) {
		for (let v of mesh.vertices) {
			let i = v.index;
			let dir = new THREE.Vector3(vectors[i].x, vectors[i].y, vectors[i].z);
			var origin = new THREE.Vector3( geometry.positions[i].x, geometry.positions[i].y, geometry.positions[i].z );
			var length = dir.length() + 0.01;
			dir.normalize();
			var hex = 0xffff00;

			var arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
			this.scene.add( arrowHelper );
		}
	}

	updateCameraUp(axis) {
		switch(axis) {
			case "x":
				this.camera.up.set(1,0,0);
				break;
			case "y":
				this.camera.up.set(0,1,0);
				this.camera.position.y = 10;
				this.camera.position.z = 0;
				break;
			case "z":
			this.camera.up.set(0,0,1);
				this.camera.position.z = 10;
				this.camera.position.y = 0;
				break;
		}
		this.controls.dispose();
		this.controls = new OrbitControls( this.camera, canvas );
	}

	render(wireframeMode) {
		if (this.resizeRendererToDisplaySize()) {
			const canvas = this.renderer.domElement;
			this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
			this.camera.updateProjectionMatrix();
		}
		
		this.controls.update();
		
		// Set wireframe mode
		this.renderedMesh.material.wireframe = wireframeMode;
	
		this.renderer.render(this.scene, this.camera);
	
	}
	
	
	// Responsive canvas
	resizeRendererToDisplaySize() {
		const canvas = this.renderer.domElement;
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		const needResize = canvas.width !== width || canvas.height !== height;
		if (needResize) {
			this.renderer.setSize(width, height, false);
		}
		return needResize;
	}
}