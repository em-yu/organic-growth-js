import Vector from '../geometry-processing-js/node/linear-algebra/vector';

export default class Grid {
	constructor(resolution) {
		this.resolution = resolution;
		this._grid = new Map();
	}

	/**
	 * Add value in a cell of the grid, depending on position
	 * @method
	 * @param {Vector} position 
	 * @param {Number} value 
	 */
	add(position, value) {
		let key = this.getKeyFromPos(position);
		let gridValue = this._grid.get(key);
		if (gridValue === undefined) {
			this._grid.set(key, [value]);
		}
		else {
			gridValue.push(value);
			this._grid.set(key, gridValue);
		}
	}

	getNeighbors(position) {
		const gridIndex = this.getIndex(position);
		let allNeighbors = [];
		for (let dx = -1; dx <=1; dx++) {
			for (let dy = -1; dy <=1; dy++) {
				for (let dz = -1; dz <=1; dz++) {
					let neighborKey = this.getKeyFromIndex(gridIndex.plus(new Vector(dx, dy, dz)));
					let neighbors = this._grid.get(neighborKey);
					if (neighbors !== undefined) {
						allNeighbors = allNeighbors.concat(neighbors);
					}
				}
			}
		}
		return allNeighbors;
	}

	/**
	 * 
	 * @param {Vector} pos 
	 */
	getKeyFromPos(pos) {
		let gx = pos.x > 0 ? Math.floor(pos.x/this.resolution) : Math.ceil(pos.x/this.resolution);
		let gy = pos.x > 0 ? Math.floor(pos.y/this.resolution) : Math.ceil(pos.y/this.resolution);
		let gz = pos.x > 0 ? Math.floor(pos.z/this.resolution) : Math.ceil(pos.z/this.resolution);

		return [gx,gy,gz].join(',');
	}

	/**
	 * 
	 * @param {Vector} gridIndex 
	 * @return {string}
	 */
	getKeyFromIndex(gridIndex) {
		return [gridIndex.x, gridIndex.y, gridIndex.z].join(',');
	}

	/**
	 * 
	 * @param {Vector} pos
	 * @return {Vector} 
	 */
	getIndex(pos) {
		let indexStringArray = this.getKeyFromPos(pos).split(',');
		let index = new Vector(
			parseInt(indexStringArray[0]),
			parseInt(indexStringArray[1]),
			parseInt(indexStringArray[2]),
		);
		return index;
	}
}