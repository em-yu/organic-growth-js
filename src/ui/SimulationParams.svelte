<script>
	import Parameter from './Parameter.svelte';
	import ControlsGroup from './ControlsGroup.svelte';
	import Slider from './Slider.svelte';
	import Checkbox from './Checkbox.svelte';
	import ToggleSelect from './ToggleSelect.svelte';
	import Button from './Button.svelte';
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

	export let parameters = {};

	let step = 0.01;
	let axisOptions = ["x", "y", "z"];
	let sourcesOptions = [
		{label: "all", value: 0},
		3,
		4,
		5,
		6
	];

</script>

<style>

</style>
	
	
<ControlsGroup>
	<Parameter label="Smoothness">
		<Slider
			bind:value={parameters.smoothness}
			min = "0.5" max = "1.0" {step}
			on:change={() => change('smoothness')}
		/>
	</Parameter>

	<Parameter label="Growth zone">
		<Slider
			bind:value={parameters.growthZone}
			min = "0.1" max = "0.8" {step}
			on:change={() => change('growthZone')}
		/>
	</Parameter>

	<Parameter label="Growth sources">
		<ToggleSelect
			options={sourcesOptions}
			bind:value={parameters.sources}
			on:change={() => { change('sources') }}
		/>
	</Parameter>


</ControlsGroup>

<ControlsGroup>
	<Parameter label="Gravity">
		<Slider
			bind:value={parameters.gravity.magnitude}
			min = "0.0" max = "5.0" {step}
			on:change={() => change('gravity')}
		/>
	</Parameter>
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