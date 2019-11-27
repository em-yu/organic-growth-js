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

	export let parameters = {};
	export let exportModel;
	export let resetHandler;
	export let growthSteps;

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

	.controls {
		background: #2C2C2C;
    border-radius: 0 6px 6px 0;
    margin: 5px 0;
		padding: 5px 0px;
		overflow: hidden;
		color: #DADADA;
		display: flex;
		flex-direction: column;
	}

	.done-container {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	/* .hint {
		padding: 5px;
		color: #DADADA;
	} */

	.single-button {
		width: 50px;
		height: 50px;
		padding: 0;
	}
</style>

<div class="side-container">

	{#if sceneEditMode}
		<div class="done-container">
			<div class="controls single-button">
					<IconButton on:click={() => { switchMode() }}>
						<i class="material-icons">arrow_back</i>
					</IconButton>
			</div>
			<!-- <div class="hint">
				Click here to start simulation
			</div> -->
		</div>
	{:else}
		<div class="controls single-button">
			<IconButton on:click={() => { growthSteps > 0 ? showPopup = true : switchMode(); }}>
				<i class="material-icons">category</i>
			</IconButton>
		</div>
	{/if}

	{#if sceneEditMode}
		<SceneParams 
			bind:parameters={parameters}
			on:change={change}
		/>
	{:else}
		<SimulationParams
			bind:parameters={parameters}
			on:change={change}
			exportModel={exportModel}
		/>
	{/if}


</div>

{#if showPopup}
	<Popup confirmHandler={() => { switchMode(); showPopup = false;}} cancelHandler={() => { showPopup = false; }}>
		<h3>Go back to scene edit mode?</h3>
		<p>By going back to scene edit mode, all current growth progress will be lost.</p>
	</Popup>
{/if}