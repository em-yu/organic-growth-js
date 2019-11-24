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
		gravity: 2.0,
		g_dir: new Vector(0.0, -1.0, 0.0), // Hardcoded
		colorGrowth: true,
		wireframe: false,
		model: "disk",
	};
	let sceneEditMode = true;

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
		let vec = parameters.g_dir.times(parameters.gravity);
		renderer.removeGravityArrow();
		renderer.drawGravityArrow(vec.x, vec.y, vec.z);
	}

	function updateParameters(event) {
		if (event.detail.updatedParam == 'growthZone')
			onGrowthParamsChange();
		if (event.detail.updatedParam == 'gravity' || event.detail.updatedParam == 'g_dir') {
			renderer.removeGravityArrow();
			let vec = parameters.g_dir.times(parameters.gravity);
			renderer.drawGravityArrow(vec.x, vec.y, vec.z);
		}
	}

	function onGrowthParamsChange() {
		if (!parameters.colorGrowth)
			return;
		updateGrowthColors(parameters);
		renderer.updateGeometry(sceneGeometry);
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