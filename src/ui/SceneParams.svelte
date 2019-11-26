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
		<!-- <div class="labeled-slider">
			<div class="label">x</div>
			<Slider
				min = "0.0" max = "1.0" {step}
				on:change={updateGravity("x")}
			/>
		</div>
		<div class="labeled-slider">
			<div class="label">y</div>
			<Slider
				min = "0.0" max = "1.0" {step}
				on:change={updateGravity("y")}
			/>
		</div>
		<div class="labeled-slider">
			<div class="label">z</div>
			<Slider
				min = "0.0" max = "1.0" {step}
				on:change={updateGravity("z")}
			/>
		</div> -->
	</Parameter>
</ControlsGroup>

<ControlsGroup>
	<Parameter label="Material">
		<Checkbox
			label="Wireframe"
			bind:checked={parameters.wireframe}
			on:change={() => change('wireframe')}
		/>
	</Parameter>
</ControlsGroup>