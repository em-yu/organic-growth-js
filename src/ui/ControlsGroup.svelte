<script>
	export let right;
</script>

<style>
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

	.right {
		border-radius: 6px 0 0 6px;
	}
</style>

<div class="controls" class:right>
	<slot></slot>
</div>