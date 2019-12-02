<script>
	import Button from './Button.svelte';

	export let confirmHandler;
	export let cancelHandler;
</script>

<style>
	.overlay {
		position: fixed;
		background: rgba(10, 10, 10, 0.3);
		height: 100%;
		width: 100%;
		display: flex;
		justify-content: center;
    align-items: center;
    top: 0;
		left: 0;
		z-index: 10;
	}

	.confirm-popup {
		background: #2C2C2C;
		border-radius: 6px;
		padding: 10px;
		color: #DADADA;
	}

	.actions {
		margin-top: 5px;
		display: flex;
    justify-content: flex-end;
	}

	.button {
		font-weight: bold;
		margin: 2px 5px;
	}

</style>

<div class="overlay" on:click={cancelHandler}>
	<div class="confirm-popup" on:click={(e) => {e.stopPropagation()}}>
		<div class="description">
			<slot></slot>
		</div>
		<div class="actions">
			<div class="button">
				<Button on:click={cancelHandler}>
					Cancel
				</Button>
			</div>
			<div class="button">
				<Button on:click={confirmHandler}>
					Confirm
				</Button>
			</div>
		</div>
	</div>
</div>