<script>
	import Button from './Button.svelte';

	export let exit;

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

	.popup {
		background: #2C2C2C;
		border-radius: 6px;
		padding: 10px 30px;
		color: #DADADA;
		max-width: 600px;
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

	.description {
		font-size: 0.9em;
	}

	.description b {
		color: #4EB2DD;
	}

	.material-icons {
		font-size: inherit;
	}

</style>

<div class="overlay">
	<div class="popup">
		<div class="description">
			<h1>Differential growth simulator</h1>
			<p>
				With this web application you can <b>simulate growth</b> on a 3D surface.
				The surface is like a <b>plant or living organism</b> that follows a set of rules for where new cells
				can be added and how these cells react to each other and their environment. <br/>
				You can <b>control</b> some of these rules to
				customise how the surface grows, and obtain a wide range of <b>different results</b>!
			</p>
			<h3>Tips</h3>
			<ul>
				<li>
					Start and stop the growth simulation by clicking <b><i class="material-icons play-pause">play_circle_outline</i></b>
					or by pressing <b><code>SPACE</code></b> on your keyboard. The simulation can be restarted from the start by clicking
					<b><i class="material-icons play-pause">replay</i></b>
				</li>
				<li>
					<b>Click and drag</b> anywhere on the scene to move the camera around. Zoom in/out by using the <b>scrolling wheel</b>.
				</li>
				<li>
					Use the <b>menus on the sides</b> to customize your growing shape.
				</li>
				<li>
					At any time you can pause the simulation and <b>export your result</b> to an OBJ file.
					Feel free to do so whenever the shape looks nice to you.
				</li>
			</ul>
		</div>
		<div class="actions">
			<div class="button">
				<Button on:click={exit}>
					Got it!
				</Button>
			</div>
		</div>
	</div>
</div>