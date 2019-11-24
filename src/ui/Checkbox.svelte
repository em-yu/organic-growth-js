<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function change() {
		checked = !checked;
		dispatch('change');
	}

	export let label;
	export let checked;
</script>

<style>
	.container {
		font-size: 0.8em;
		text-decoration: line-through;
		cursor: pointer;
		user-select: none;
	}


	.checked {
		text-decoration: none;
	}
</style>

<div class="container"
		class:checked
		on:click={change}>
		{label}
</div>
