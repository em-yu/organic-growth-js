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

</style>

<ControlsGroup right>
	<Parameter
		label="Starting shape"
		hint="Choose the starting shape to be grown." hintLeftSide>
		<ToggleSelect
			options={inputOptions}
			bind:value={selectedModel}
			on:change={() => { if (growthSteps > 0) { showPopup = true; } else { updateInputModel() } }}
		/>
	</Parameter>
</ControlsGroup>
	

<ControlsGroup right>
	<Parameter
		label="View">
		<ToggleSelect
			options={["Wireframe", "Solid"]}
			bind:value={parameters.material}
			on:change={() => change('wireframe')}
		/>
	</Parameter>
</ControlsGroup>

<ControlsGroup right>
	<Parameter
		label="Export 3D model"
		hint="Export the current 3D model to an OBJ file to download it. <br/>
					OBJ files can be imported in most CAD and 3D modelling software." hintLeftSide>
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