/** @typedef {import('three').Vector3} Vector3 */

class Vertex {
	constructor(index, position) {
		/** @type {number} */
		this.index = index;
		/** @type {Vector3} */
		this.position = position;
	}
}

export default Vertex;