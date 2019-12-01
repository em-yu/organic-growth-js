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
	};

	export let parameters = {};
	export let exportModel;

	let step = 0.01;
	let showPopup = false;

</script>

<style>
	.material-icons {
		font-size: 1.2em;
	}

</style>
	

<ControlsGroup right>
	<Parameter
		label="View">
		<ToggleSelect
			options={["Wireframe", "Solid"]}
			bind:value={parameters.material}
			on:change={() => change('wireframe')}
		/>
	</Parameter>
	<Parameter
		label="Orbit around model">
		<Button
			on:click={() => {parameters.orbitModel = !parameters.orbitModel; change('orbit')}}
		>
			{#if parameters.orbitModel}
				<i class="material-icons">pause</i>
			{:else}
				<i class="material-icons">play_arrow</i>
			{/if}
		</Button>
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