<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function change(selected) {
		value = getValue(selected);
		dispatch('change');
	}

	function getValue(option) {
		return option.value === undefined ? option : option.value;
	}

	function getLabel(option) {
		return option.label === undefined ? option : option.label;
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
		margin: 0 0 0.5em 0;
	}

	.option {
		flex: 1;
		text-align: center;
    padding: 5px;
		font-weight: 700;
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
		<div class="option" class:selected={value === getValue(option)} on:click={() => change(option)}>
			{getLabel(option)}
		</div>
	{/each}
</div>
