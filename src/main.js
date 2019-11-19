
import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
	}
});


window.app = app;

export default app;


function onGrowthParamsChange() {
  if (!params.colorGrowth)
    return;
  let factors = growthProcess.computeGrowthFactors(params.growthFade, 1 - params.growthZone);
  // Update colors based on growth factors
  sceneGeometry.setColors(factors, -1, 1);
  renderer.updateGeometry(sceneGeometry);
}