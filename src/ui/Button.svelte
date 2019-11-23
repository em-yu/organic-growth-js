<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function click() {
		dispatch('click');
	}
</script>

<style>

	button {
		color: inherit;
		background: transparent;
		font-weight: inherit;
		padding: 0;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border: none;
		padding: 0 5px;
	}

	button:hover {
		background: rgba(255, 255, 255, 0.1);
		transition: background-color 0.5s;
	}

	button:active {
		background: rgba(255, 255, 255, 0.2);
		transition: background-color 0.2s;
	}

</style>

<button on:click={click}>
	<slot></slot>
</button>