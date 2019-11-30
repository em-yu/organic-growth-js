<script>
	import Parameter from './Parameter.svelte';
	import ControlsGroup from './ControlsGroup.svelte';
	import Slider from './Slider.svelte';
	import Checkbox from './Checkbox.svelte';
	import Button from './Button.svelte';
	import ToggleSelect from './ToggleSelect.svelte';
	import Popup from './Popup.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function change(param) {
		dispatch('change', {
			updatedParam: param
		});
	};

	function updateInputModel() {
		parameters.model = selectedModel;
		change('model');
	}

	export let parameters = {};
	export let growthSteps;
	export let exportModel;

	let step = 0.01;
	let showPopup = false;
	let selectedModel = parameters.model;

	let inputOptions = [
		"disk",
		"cylinder",
		"square"
	];



</script>

<style>

	/* .labeled-slider {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.labeled-slider .label {
		font-size: 0.9em;
		padding: 5px;
		padding-right: 20px;
	} */

</style>

<ControlsGroup right>
	<Parameter label="Input 3D model">
		<ToggleSelect
			options={inputOptions}
			bind:value={selectedModel}
			on:change={() => { if (growthSteps > 0) { showPopup = true; } else { updateInputModel() } }}
		/>
	</Parameter>
</ControlsGroup>
	

<ControlsGroup right>
	<Parameter label="View">
		<ToggleSelect
			options={["Wireframe", "Solid"]}
			bind:value={parameters.material}
			on:change={() => change('wireframe')}
		/>
	</Parameter>
</ControlsGroup>

<ControlsGroup right>
	<Parameter label="Export 3D model">
		<Button
			on:click={exportModel}
		>
		Export to OBJ
		</Button>
	</Parameter>
</ControlsGroup>

{#if showPopup}
	<Popup
		confirmHandler={() => { updateInputModel(); showPopup = false;}}
		cancelHandler={() => { showPopup = false; selectedModel = parameters.model }}>
		<h3>Change input mesh?</h3>
		<p>By changing input mesh, all current growth progress will be lost.</p>
	</Popup>
{/if}