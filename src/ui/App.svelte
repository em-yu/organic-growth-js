<script>
	import Vector from '../../geometry-processing-js/node/linear-algebra/vector';
	import MainControls from './MainControls.svelte';
	import Controls from './Controls.svelte';
	import Logger from './Logger.svelte';

	import Renderer from '../renderer.js';
	import { sceneGeometry, grow, init as simInit, handleGrowthZoneUpdate, handleSourcesUpdate } from '../simulation.js';
	import { exportOBJ } from '../output.js';

	let steps = 0;
	let nVertices = 0;
	let parameters = {
		smoothness: 0.75,
		growthZone: 0.5,
		gravity: {
			axis: "z",
			orientation: "+",
			magnitude: 2.0,
			vector: undefined,
		},
		colorGrowth: true,
		material: "Solid",
		model: "disk",
		sources: 0,
	};
	let sceneEditMode = false;

	const MAX_POINTS = 100000; // Is defined twice (simulation.js)

	// Initialize THREE.js scene
	const renderer = new Renderer(MAX_POINTS);
	renderer.init();

	// Initialize simulation
	init();

	// Render scene
	let playGrowth = false;
	animate();

	function animate() {

		renderer.render(parameters.material === 'Wireframe');
		if (playGrowth) {
			renderer.removeGravityArrow();
			growthStep();
		}

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
				// Automatically change gravity based on model
				switch(parameters.model) {
					case 'disk':
					case 'square':
						parameters.gravity.axis = 'z';
						parameters.gravity.orientation = '+';
						break;
					case 'cylinder':
						parameters.gravity.axis = 'y';
						parameters.gravity.orientation = '-';
						break;
				}
				init();
				break;
			case 'sources':
				// init();
				onSourcesChange();
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
		let gravity = new Vector();
		for (let axis of ["x", "y", "z"]) {
			let orientation = parameters.gravity.orientation === "+" ? 1 : -1;
			gravity[axis] = axis === parameters.gravity.axis ? orientation * parameters.gravity.magnitude : 0;
		}
		parameters.gravity.vector = gravity;
		renderer.removeGravityArrow();
		renderer.drawGravityArrow(gravity.x, gravity.y, gravity.z);
	}

	function onSourcesChange() {
		handleSourcesUpdate(parameters);
		renderer.updateGeometry(sceneGeometry);
	}

	// function onModelChange() {
	// 	init();
	// }

	function exportModel() {
		exportOBJ(sceneGeometry);
	}


</script>


<Controls 
	bind:parameters={parameters}
	bind:sceneEditMode={sceneEditMode}
	bind:growthSteps={steps}
	on:change={updateParameters}
	exportModel={exportModel}
	resetHandler={init}
/>

{#if !sceneEditMode}
	<MainControls bind:playGrowth={playGrowth} stepHandler={growthStep} resetHandler={init}/>

	<Logger>
		{#if playGrowth}
			Growing...<br/>
		{:else}
			Growth steps: {steps} <br/>
		{/if}
		Vertices: {nVertices}
	</Logger>
{/if}