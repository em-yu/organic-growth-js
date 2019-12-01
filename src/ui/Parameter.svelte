<script>
	export let label = '';
	export let hint;
	export let hintLeftSide = false;

	let showHint = false;
	let hintPosTop = "20px";
	let hintPosLeft = "100px";

	function handleMouseMove(e) {
		hintPosTop = (e.clientY + 5) + "px";
		if (!hintLeftSide) {
			hintPosLeft = (e.clientX + 5) + "px";
		}
		else {
			hintPosLeft = Math.max(e.clientX + 5 - 300, 0) + "px";
		}
	}
</script>

<style>
	.parameter {
		padding: 5px 20px;
	}

	.label{
		padding-bottom: 5px;
		font-size: 0.8em;
		font-weight: 600;
		display: flex;
    align-items: center;
	}

	.label .material-icons {
		font-size: 1.1em;
		padding: 0 10px;
		cursor: help;
	}

	.hint {
		position: fixed;
		z-index: 10;
		top: var(--pos-top);
		left: var(--pos-left);
    background: rgba(10, 10, 10, 0.7);
    padding: 5px;
    border-radius: 6px;
		width: 300px;
	}

</style>

<svelte:window on:mousemove={handleMouseMove}/>

<div class="parameter">
	<div class="label"
		
		on:mouseleave={() => {showHint = false;} }>
		{label}
		{#if hint}
			<i class="material-icons"  on:mouseover={() => {showHint = true;}} >
				help
			</i>
		{/if}
	</div>
	<slot></slot>
</div>

{#if hint && showHint}
	<div class="hint" style="--pos-left: {hintPosLeft}; --pos-top: {hintPosTop};">
		{@html hint}
	</div>
{/if}