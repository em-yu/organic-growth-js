<script>
	import IconButton from './IconButton.svelte';
	import Popup from './Popup.svelte';
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

	export let right;

	let step = 0.01;

	export let sceneEditMode;
	let showPopup = false;

</script>

<style>
	.side-container {
		position: fixed;
		left: 0px;
		top: 0px;
		height: 100%;
		padding: 5px 0;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
	}

	.right {
		left: inherit;
		right: 0px;
	}

</style>

<div class="side-container" class:right>

	<slot></slot>

</div>