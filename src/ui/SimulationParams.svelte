<script>
	import Parameter from './Parameter.svelte';
	import ControlsGroup from './ControlsGroup.svelte';
	import Slider from './Slider.svelte';
	import Checkbox from './Checkbox.svelte';
	import ToggleSelect from './ToggleSelect.svelte';
	import Button from './Button.svelte';
	import Popup from './Popup.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function change(param) {
		dispatch('change', {
			updatedParam: param
		});
	};

	function updateGravity() {
		change('gravity');
	}

	function updateInputModel() {
		parameters.model = selectedModel;
		change('model');
	}

	export let parameters = {};
	export let growthSteps;

	let step = 0.01;
	let showPopup = false;
	let selectedModel = parameters.model;

	let axisOptions = ["x", "y", "z"];
	let sourcesOptions = [
		{label: "all", value: 0},
		3,
		4,
		5,
		6
	];
	let inputOptions = [
		"disk",
		"cylinder",
		"square"
	];

</script>

<style>
	.labeled-slider {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.labeled-slider .label {
		font-size: 0.8em;
		padding: 5px;
		padding-right: 20px;
	}
</style>

<ControlsGroup>
	<Parameter
		label="Starting shape"
		hint="Choose the starting shape. Different starting shapes will give very different results.">
		<ToggleSelect
			options={inputOptions}
			bind:value={selectedModel}
			on:change={() => { if (growthSteps > 0) { showPopup = true; } else { updateInputModel() } }}
		/>
	</Parameter>
</ControlsGroup>
	
<ControlsGroup>
	<Parameter
		label="Smoothness"
		hint="Control how much the surface resists wrinkling and how smooth the final result will be."
		>
		<Slider
			bind:value={parameters.smoothness}
			min = "0.5" max = "1.0" {step}
			on:change={() => change('smoothness')}
		/>
	</Parameter>

	<Parameter
		label="Growth zone"
		hint="Control the size of the growth zone. <br/>
					The <span style='background-color: #aa0c27'>growth zone</span> is where new cells are added."
		>
		<Slider
			bind:value={parameters.growthZone}
			min = "0.1" max = "0.8" {step}
			on:change={() => change('growthZone')}
		/>
	</Parameter>

	<Parameter
		label="Growth sources"
		hint="Choose a number of growth sources on the edge of the mesh. <br/>
				You can visualize where the sources are on the mesh (<span style='background-color: #aa0c27'>red zones</span>). <br/>
				This setting can be changed during the simulation too! Try to see what happens if you do."
		>
		<ToggleSelect
			options={sourcesOptions}
			bind:value={parameters.sources}
			on:change={() => { change('sources') }}
		/>
	</Parameter>


</ControlsGroup>

<ControlsGroup>
	<Parameter
		label="Gravity"
		hint="Control the direction and strength of the gravity
					<i class='material-icons' style='color: #ff0; font-size:inherit'>call_made</i>
					applied to cells in the growth zone."
		>
		<div class="labeled-slider">
			<div class="label">Norm</div>
			<Slider
				bind:value={parameters.gravity.norm}
				min = "0.0" max = "10.0" {step}
				on:change={() => change('gravity')}
			/>
		</div>
		<div class="labeled-slider">
			<div class="label">Direction</div>
			<Slider
				bind:value={parameters.gravity.theta}
				min = "0.0" max = "3.14" {step}
				on:change={() => change('gravity')}
			/>
		</div>
		<!-- <div class="labeled-slider">
			<div class="label">Azimuth</div>
			<Slider
				bind:value={parameters.gravity.phi}
				min = "-3.15" max = "3.14" {step}
				on:change={() => change('gravity')}
			/>
		</div> -->
	</Parameter>
</ControlsGroup>

{#if showPopup}
	<Popup
		confirmHandler={() => { updateInputModel(); showPopup = false;}}
		cancelHandler={() => { showPopup = false; selectedModel = parameters.model }}>
		<h3>Change starting shape?</h3>
		<p>By changing starting shape, all current growth progress will be lost.</p>
	</Popup>
{/if}