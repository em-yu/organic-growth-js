<script>

	import Popup from './Popup.svelte';
	import IconButton from './IconButton.svelte';

	export let stepHandler;
	export let resetHandler;
	export let playGrowth = false;
	export let growthSteps;

	let showPopup = false;

	function handleKeydown(e) {
		if (e.keyCode === 32) {
			playGrowth = !playGrowth;
			e.preventDefault();
		}
	}

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

	.main-controls .material-icons {
		font-size: 40px;
		padding: 0 10px;
	}

	.main-controls .play-pause {
		color: #4EB2DD;
		font-size: 60px;
	}

</style>

<svelte:window on:keydown={handleKeydown}/>

<div class="bottom-container">
	<div class="main-controls">
		<IconButton disabled={growthSteps === 0} on:click={() => { if(growthSteps > 0) showPopup = true; }}>
			<i class="material-icons">replay</i>
		</IconButton>

		<IconButton on:click={() => { playGrowth = !playGrowth; }}>
			{#if playGrowth}
				<i class="material-icons play-pause">pause_circle_outline</i>
			{:else}
				<i class="material-icons play-pause">play_circle_outline</i>
			{/if}
		</IconButton>

		<IconButton on:click={stepHandler}>
			<i class="material-icons">skip_next</i>
		</IconButton>

	</div>
</div>
{#if showPopup}
	<Popup confirmHandler={() => { resetHandler(); showPopup = false;}} cancelHandler={() => { showPopup = false; }}>
		<h3>Reset the scene?</h3>
		<p>By resetting the scene, all current growth progress will be lost.</p>
	</Popup>
{/if}