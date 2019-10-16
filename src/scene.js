import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


export default class Scene {
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
		const canvas = document.createElement('canvas');
		document.body.appendChild(canvas);

		this.renderer = new THREE.WebGLRenderer({
			canvas
		});

		this.scene = new THREE.Scene();
		let fov = 45.0;
		let aspect = canvas.clientWidth / canvas.clientHeight;
		let near = 0.1;
		let far = 100;
		let eyeZ = 3.5;

		this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		this.camera.position.z = eyeZ;
		this.controls = new OrbitControls( this.camera, canvas );
		this.controls.update();

		// Create THREE.js geometry object
		this.bufferGeometry = new THREE.BufferGeometry();

		// Initialize Buffers
		let threePositions = new Float32Array(this.MAX_POINTS * 3);
		let threeNormals = new Float32Array(this.MAX_POINTS * 3);
		let indices = new Uint32Array(this.MAX_POINTS * 3);

		// Set geometry
		this.bufferGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
		this.bufferGeometry.addAttribute('position', new THREE.BufferAttribute(threePositions, 3));
		this.bufferGeometry.addAttribute('normal', new THREE.BufferAttribute(threeNormals, 3));

		// Create material
		const material = new THREE.MeshPhongMaterial( {
			side: THREE.DoubleSide,
			wireframe: false,
		} );

		// Create THREEjs mesh
		this.renderedMesh = new THREE.Mesh(this.bufferGeometry, material);
		this.scene.add(this.renderedMesh);

		// Lights
		let pointLight = new THREE.PointLight( 0xfff9ed, 1, 100 );
		pointLight.position.set( 20, 20, 20 );
		this.scene.add( pointLight );

		let ambientLight = new THREE.AmbientLight( 0xd15e3b ); // soft white light
		this.scene.add( ambientLight );
	}

	updateGeometry(mesh, geometry) {
		for (let v of mesh.vertices) {
			let i = v.index;
			let position = geometry.positions[i];
			this.bufferGeometry.attributes.position.setXYZ( i, position.x, position.y, position.z );
	
			// Angle weighted normals
			let normal = geometry.vertexNormalAngleWeighted(v);
			this.bufferGeometry.attributes.normal.setXYZ(i, normal.x, normal.y, normal.z);
		};
		// This needs to be done only if there was edge splitting
		let indices = new Uint32Array(this.MAX_POINTS * 3);
		for (let i = 0; i < geometry.indices.length; i++) {
			indices[i] = geometry.indices[i];
		};
	
		this.bufferGeometry.index.set(indices);
		this.bufferGeometry.attributes.position.needsUpdate = true;
		this.bufferGeometry.attributes.normal.needsUpdate = true;
		this.bufferGeometry.index.needsUpdate = true;
		this.bufferGeometry.computeBoundingSphere();
	}

	render(params) {
		if (this.resizeRendererToDisplaySize()) {
			const canvas = this.renderer.domElement;
			this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
			this.camera.updateProjectionMatrix();
		}
		
		this.controls.update();
		
		// Set wireframe mode
		this.renderedMesh.material.wireframe = params.wireframe;
	
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