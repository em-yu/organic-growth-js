<script>
	import Parameter from './Parameter.svelte';
	import ControlsGroup from './ControlsGroup.svelte';
	import Slider from './Slider.svelte';
	import Checkbox from './Checkbox.svelte';
	import Button from './Button.svelte';
	import ToggleSelect from './ToggleSelect.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function change(param) {
		dispatch('change', {
			updatedParam: param
		});
	}

	function updateGravity() {
		change('gravity');
	}

	export let parameters = {};

	let step = 0.01;

	let inputOptions = [
		"disk",
		"cylinder",
		"square"
	];
	let sourcesOptions = [
		{label: "all", value: 0},
		3,
		4,
		5,
		6
	]
	let axisOptions = ["x", "y", "z"];

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

<ControlsGroup>
	<Parameter label="Input 3D model">
		<ToggleSelect
			options={inputOptions}
			bind:value={parameters.model}
			on:change={() => { change('model') }}
		/>
	</Parameter>
	<Parameter label="Sources">
		<ToggleSelect
			options={sourcesOptions}
			bind:value={parameters.sources}
			on:change={() => { change('sources') }}
		/>
	</Parameter>
</ControlsGroup>
	
<ControlsGroup>
	<Parameter label="Gravity direction">
		<ToggleSelect
			options={axisOptions}
			bind:value={parameters.gravity.axis}
			on:change={updateGravity}
		/>
		<ToggleSelect
			options={["+", "-"]}
			bind:value={parameters.gravity.orientation}
			on:change={updateGravity}
		/>
	</Parameter>
</ControlsGroup>