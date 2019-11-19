<script>
	import MainControls from './MainControls.svelte';

	import Renderer from './renderer.js';
	import { sceneGeometry, grow, init as simInit } from './simulation.js';

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

		renderer.render(false);
		if (playGrowth) {
			growthStep();
		}

		// Next frame
		requestAnimationFrame(animate);
	}

	function growthStep() {
		grow();
		renderer.updateGeometry(sceneGeometry);
	}

	function init() {
		simInit();
		renderer.updateGeometry(sceneGeometry);
	}


</script>

<MainControls bind:playGrowth={playGrowth} stepHandler={growthStep} resetHandler={init}/>