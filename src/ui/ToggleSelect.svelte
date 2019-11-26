<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function change(selected) {
		value = selected;
		dispatch('change');
	}

	export let options;
	export let value;
</script>

<style>
	.container {
		font-size: 0.8em;
		cursor: pointer;
		user-select: none;
		border-radius: 2px;
		border: solid 1px #DADADA;
		display: flex;
		margin: 5px;
	}

	.option {
		flex: 1;
		text-align: center;
    font-weight: 700;
    padding: 5px;
	}

	.option:not(:last-child) {
		border-right: solid 1px #DADADA;
	}

	.option:hover {
		background: rgba(255, 255, 255, 0.1);
		transition: background-color 0.5s;
	}

	.option:active {
		background: rgba(255, 255, 255, 0.2);
		transition: background-color 0.2s;
	}

	.selected {
		color: #4EB2DD;
	}

</style>

<div class="container">
	{#each options as option}
		<div class="option" class:selected={value === option} on:click={() => change(option)}>
			{option}
		</div>
	{/each}
</div>
