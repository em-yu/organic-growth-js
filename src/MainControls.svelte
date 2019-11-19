<script>

	export let stepHandler;
	export let resetHandler;
	export let playGrowth = false;

</script>

<style>

	.bottom-container {
		position: fixed;
		bottom: 10px;
		width: 100%;
		display: flex;
		justify-content: center;
	}

	.main-controls {
		background: #2C2C2C;
		border-radius: 10px;
		overflow: hidden;
		color: #DADADA;
		display: flex;
		flex-direction: row;
	}

	button {
		color: inherit;
		background: transparent;
		padding: 0;
		height: 100%;
		width: 70px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border: none;
	}

	button:hover {
		background: rgba(255, 255, 255, 0.1);
		transition: background-color 0.5s;
	}

	button:active {
		background: rgba(255, 255, 255, 0.2);
		transition: background-color 0.2s;
	}

	.main-controls .material-icons {
		font-size: 40px;
	}

	.main-controls .play-pause {
		color: #4EB2DD;
		font-size: 60px;
	}
</style>

<div class="bottom-container">
	<div class="main-controls">
		<button on:click={resetHandler}>
			<i class="material-icons">replay</i>
		</button>


		<button on:click={() => { playGrowth = !playGrowth; }}>
			{#if playGrowth}
				<i class="material-icons play-pause">pause_circle_outline</i>
			{:else}
				<i class="material-icons play-pause">play_circle_outline</i>
			{/if}
		</button>


		<button on:click={stepHandler}>
			<i class="material-icons">skip_next</i>
		</button>
	</div>
</div>