<script>
	import Parameter from './Parameter.svelte';
	import ControlsGroup from './ControlsGroup.svelte';
	import Slider from './Slider.svelte';
	import Checkbox from './Checkbox.svelte';
	import Button from './Button.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function change(param) {
		dispatch('change', {
			updatedParam: param
		});
	}

	export let parameters = {};
	export let exportModel;
	let step = 0.01;

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

	<Parameter label="Gravity">
		<Slider
			bind:value={parameters.gravity.magnitude}
			min = "0.0" max = "5.0" {step}
			on:change={() => change('gravity')}
		/>
	</Parameter>
</ControlsGroup>

<ControlsGroup>
	<Parameter label="View">
		<Checkbox
			label="Wireframe"
			bind:checked={parameters.wireframe}
			on:change={() => change('wireframe')}
		/>
	</Parameter>
</ControlsGroup>

<ControlsGroup>
	<Parameter label="Export 3D model">
		<Button
			on:click={exportModel}
		>
		Export to OBJ
		</Button>
	</Parameter>
</ControlsGroup>