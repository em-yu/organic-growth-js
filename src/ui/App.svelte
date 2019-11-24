<script>
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
		gravity: 1.0,
		colorGrowth: true,
		wireframe: false,
	};

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
		renderer.updateGeometry(sceneGeometry);
	}

	function updateParameters(event) {
		if (event.detail.updatedParam == 'growthZone')
			onGrowthParamsChange();
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

<MainControls bind:playGrowth={playGrowth} stepHandler={growthStep} resetHandler={init}/>

<SideControls bind:parameters={parameters} on:change={updateParameters} exportModel={exportModel} />

<Logger>
	{#if playGrowth}
		Growing...<br/>
	{/if}
	{logs}
</Logger>