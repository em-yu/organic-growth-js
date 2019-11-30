<script>
	import SideControls from './SideControls.svelte';
	import SimulationParams from './SimulationParams.svelte';
	import SceneParams from './SceneParams.svelte';

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function change(e) {
		dispatch('change', e.detail);
	}

	function switchMode() {
		sceneEditMode = !sceneEditMode;
		resetHandler();
	}

	export let parameters = {};
	export let exportModel;
	export let resetHandler;
	export let growthSteps;

	let step = 0.01;

	export let sceneEditMode;
	let showPopup = false;

</script>

<style>

</style>

<SideControls>
		<SimulationParams
			bind:parameters={parameters}
			on:change={change}
		/>
</SideControls>

<SideControls right>
		<SceneParams 
			bind:parameters={parameters}
			bind:growthSteps={growthSteps}
			on:change={change}
			exportModel={exportModel}
		/>
</SideControls>