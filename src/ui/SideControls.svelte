<script>
	import Parameter from './Parameter.svelte';
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
</style>

<div class="side-container">
	<div class="controls">
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
				bind:value={parameters.gravity}
				min = "0.0" max = "10.0" {step}
				on:change={() => change('gravity')}
			/>
		</Parameter>
	</div>

	<div class="controls">
		<Parameter label="Material">
			<Checkbox
				label="Wireframe"
				bind:checked={parameters.wireframe}
				on:change={() => change('wireframe')}
			/>
		</Parameter>
	</div>

	<div class="controls">
		<Parameter label="Export 3D model">
			<Button
				on:click={exportModel}
			>
			Export to OBJ
			</Button>
		</Parameter>
	</div>
</div>