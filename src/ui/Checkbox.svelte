<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function change() {
		dispatch('change');
	}

	export let label;
	export let value;
</script>

<style>
	.container {
		display: flex;
		flex-direction: row;
		align-items: baseline;
    justify-content: space-between;
	}

	.label {
		font-size: 0.8em;
	}

	.checkbox {
		margin: 0;
	}
</style>

<div class="container">
	<div class="label">
		{label}
	</div>
	<input type="checkbox"
		class="checkbox"
		bind:checked={value}
		on:change={change}
	/>
</div>
