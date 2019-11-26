<script>
	import Vector from '../../geometry-processing-js/node/linear-algebra/vector';
	import MainControls from './MainControls.svelte';
	import SideControls from './SideControls.svelte';
	import Logger from './Logger.svelte';

	import Renderer from '../renderer.js';
	import { sceneGeometry, grow, init as simInit, updateGrowthColors } from '../simulation.js';
	import { exportOBJ } from '../output.js';

	let logs = "";
	let parameters = {
		smoothness: 0.75,
		growthZone: 0.5,
		// gravity: 2.0,
		gravity: {
			axis: "z",
			orientation: "+",
			magnitude: 2.0,
			vector: new Vector(0.0, 0.0, 2.0)
		},
		colorGrowth: true,
		wireframe: false,
		model: "disk",
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

		renderer.render(parameters.wireframe);
		if (playGrowth) {
			renderer.removeGravityArrow();
			growthStep();
		}

		// Next frame
		requestAnimationFrame(animate);
	}

	function growthStep() {
		logs = grow(parameters);
		renderer.updateGeometry(sceneGeometry);
	}

	function init() {
		simInit(parameters);
		logs = "Simulation initialized. Vertices: " + sceneGeometry.nVertices();
		renderer.updateGeometry(sceneGeometry);
		onGravityChange();
	}

	function updateParameters(event) {
		if (event.detail.updatedParam == 'growthZone')
			onGrowthParamsChange();
		if (event.detail.updatedParam == 'gravity' || event.detail.updatedParam == 'g_dir') {
			let gravity = new Vector();
			for (let axis of ["x", "y", "z"]) {
				let orientation = parameters.gravity.orientation === "+" ? 1 : -1;
				gravity[axis] = axis === parameters.gravity.axis ? orientation * parameters.gravity.magnitude : 0;
			}
			parameters.gravity.vector = gravity;
			onGravityChange();
		}
	}

	function onGrowthParamsChange() {
		if (!parameters.colorGrowth)
			return;
		updateGrowthColors(parameters);
		renderer.updateGeometry(sceneGeometry);
	}

	function onGravityChange() {
		renderer.removeGravityArrow();
		let gravity = parameters.gravity.vector;
		renderer.drawGravityArrow(gravity.x, gravity.y, gravity.z);
	}

	function exportModel() {
		exportOBJ(sceneGeometry);
	}


</script>

<SideControls
	bind:parameters={parameters}
	bind:sceneEditMode={sceneEditMode}
	on:change={updateParameters}
	exportModel={exportModel}
	resetHandler={init} />

{#if !sceneEditMode}
	<MainControls bind:playGrowth={playGrowth} stepHandler={growthStep} resetHandler={init}/>

	<Logger>
		{#if playGrowth}
			Growing...<br/>
		{/if}
		{logs}
	</Logger>
{/if}