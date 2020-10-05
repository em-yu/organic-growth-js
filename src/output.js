import MeshIO from '../libs/geometry-processing-js/node/utils/meshio';

export function exportOBJ(sceneGeometry) {

	const geometry = sceneGeometry.geometry;
	const mesh = sceneGeometry.mesh;

  let positions = new Array(mesh.vertices.length * 3);
  let normals = new Array(mesh.vertices.length * 3);

  for (let v of mesh.vertices) {
    let i = v.index;

    let position = geometry.positions[v];
    positions[3 * i + 0] = position.x;
    positions[3 * i + 1] = position.y;
    positions[3 * i + 2] = position.z;

    let normal = geometry.vertexNormalEquallyWeighted(v);
    normals[3 * i + 0] = normal.x;
    normals[3 * i + 1] = normal.y;
    normals[3 * i + 2] = normal.z;
  }

  let text = MeshIO.writeOBJ({
    "v": positions,
    "vt": undefined,
    "vn": normals,
    "f": geometry.indices
  });

  let fileName = "growth-simulator-" + (new Date()).toISOString() + ".obj";

  let element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
  element.setAttribute("download", fileName);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}