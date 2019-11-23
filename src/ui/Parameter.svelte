<script>
	export let label = '';
</script>

<style>
	.parameter {
		padding: 5px 20px;
	}

	.label{
		padding-bottom: 5px;
		font-size: 0.8em;
		font-weight: 600;
	}
</style>

<div class="parameter">
	<div class="label">
		{label}
	</div>
	<slot></slot>
</div>