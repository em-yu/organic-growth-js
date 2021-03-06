<script>
	import Vector from '../../libs/geometry-processing-js/node/linear-algebra/vector';
	import MainControls from './MainControls.svelte';
	import Controls from './Controls.svelte';
	import Logger from './Logger.svelte';
	import Tutorial from './Tutorial.svelte';
	import IconButton from './IconButton.svelte';

	import Renderer from '../renderer.js';
	import { sceneGeometry, grow, init as simInit, handleGrowthZoneUpdate, handleSourcesUpdate } from '../simulation.js';
	import { exportOBJ } from '../output.js';

	let steps = 0;
	let nVertices = 0;
	let parameters = {
		smoothness: 0.75,
		growthZone: 0.45,
		gravity: {
			basis: ["x", "y", "z"],
			phi: 0,
			theta: 0,
			norm: 2.0,
			vector: undefined,
		},
		colorGrowth: true,
		material: "Solid",
		model: "disk",
		sources: 0,
		orbitModel: false,
	};
	let showTutorial = true;

	const MAX_POINTS = 100000; // Is defined twice (simulation.js)

	// Initialize THREE.js scene
	const renderer = new Renderer(MAX_POINTS);
	renderer.init();

	let stats = [];

	// Initialize simulation
	init();

	// Render scene
	let playGrowth = false;
	animate();

	function animate() {
		let t0 = performance.now();
		renderer.render(parameters.material === 'Wireframe');

		if (playGrowth) {
			// Stop orbit
			parameters.orbitModel = false;
			onOrbitChange();
			// Hide gravity arrow
			renderer.removeGravityArrow();
			growthStep();
		}
		let t1 = performance.now();
		let delta = t1 - t0;
		stats.push(
			{"vertices": sceneGeometry.nVertices(),
			"time": delta});
			
		// Next frame
		requestAnimationFrame(animate);
	}

	function growthStep() {
		let growthInfo = grow(parameters);
		steps++;
		nVertices = sceneGeometry.nVertices();
		renderer.updateGeometry(sceneGeometry);
	}

	function init() {
		simInit(parameters);
		steps = 0;
		nVertices = sceneGeometry.nVertices();
		renderer.updateGeometry(sceneGeometry);
		onGravityChange();
	}

	function updateParameters(event) {
		switch(event.detail.updatedParam) {
			case 'growthZone':
				onGrowthParamsChange();
				break;
			case 'gravity':
				onGravityChange();
				break;
			case 'model':
				// Change gravity basis (for spherical coords) depending on model (to simplify user customisation of gravity direction)
				// The 3rd axis of gravity basis should be aligned with the axis of symmetry of the model
				switch(parameters.model) {
					case 'disk':
					case 'square':
						parameters.gravity.basis = ["x", "y", "z"]; // z is the axis of symmetry
						renderer.updateCameraUp("z"); // Update camera and orbit controls
						break;
					case 'cylinder':
						parameters.gravity.basis = ["x", "z", "y"]; // y is the axis of symmetry
						renderer.updateCameraUp("y"); // Update camera and orbit controls
						break;
				}
				init();
				break;
			case 'sources':
				// init();
				onSourcesChange();
				break;
			case 'orbit':
				onOrbitChange();
				break;
		}
	}

	// This ensures visual feedback: color of the model is updated to represent the growth zone change
	function onGrowthParamsChange() {
		if (!parameters.colorGrowth)
			return;
		handleGrowthZoneUpdate(parameters);
		renderer.updateGeometry(sceneGeometry);
	}

	function onGravityChange() {
		const { norm, theta, phi, basis } = parameters.gravity;
		let g = new Vector();
		g[basis[0]] = norm * Math.sin(theta) * Math.cos(phi);
		g[basis[1]] = norm * Math.sin(theta) * Math.sin(phi);
		g[basis[2]] = norm * Math.cos(theta);
		parameters.gravity.vector = g;
		renderer.removeGravityArrow();
		renderer.drawGravityArrow(g.x, g.y, g.z);
	}

	function onSourcesChange() {
		// If sources are changed at step 0 for disk model, the mesh may need to be reloaded
		if (steps === 0 && parameters.model === 'disk') {
			init();
		}
		else {
			handleSourcesUpdate(parameters);
			renderer.updateGeometry(sceneGeometry);
		}
	}

	function onOrbitChange() {
		renderer.controls.autoRotate = parameters.orbitModel;
		renderer.controls.update();
	}

	// function onModelChange() {
	// 	init();
	// }

	function exportModel() {
		console.log(stats);
		exportOBJ(sceneGeometry);
	}


</script>

<style>
	.tutorial-button {
		position: fixed;
		bottom: 0;
		right: 0;
		color: #DADADA;
    padding: 10px;
	}

	.tutorial-button .material-icons {
		font-size: 30px;
	}
</style>


{#if showTutorial}
	<Tutorial exit={() => showTutorial = false} />
{/if}

<Controls 
	bind:parameters={parameters}
	bind:growthSteps={steps}
	on:change={updateParameters}
	exportModel={exportModel}
	resetHandler={init}
/>


<MainControls
	bind:playGrowth={playGrowth}
	stepHandler={growthStep}
	resetHandler={() => {playGrowth = false; init()}}
	bind:growthSteps={steps}/>

<Logger>
	{#if playGrowth}
		Growing...<br/>
	{:else}
		Growth steps: {steps} <br/>
	{/if}
	Vertices: {nVertices}
</Logger>

<div class="tutorial-button">
	<IconButton on:click={() => {showTutorial = true;}} >
		<i class="material-icons">
			help
		</i>
	</IconButton>
</div>