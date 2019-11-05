import Vector from '../geometry-processing-js/node/linear-algebra/vector';

/**
 * Adapted from Three.js
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 */
export function planeGeometry(width, height, widthSegments, heightSegments) {

	var width_half = width / 2;
	var height_half = height / 2;

	var gridX = Math.floor( widthSegments );
	var gridY = Math.floor( heightSegments );

	var gridX1 = gridX + 1;
	var gridY1 = gridY + 1;

	var segment_width = width / gridX;
	var segment_height = height / gridY;

	var ix, iy;

	// buffers

	var indices = [];
	var vertices = [];

	// generate vertices

	for ( iy = 0; iy < gridY1; iy ++ ) {

		var y = iy * segment_height - height_half;

		for ( ix = 0; ix < gridX1; ix ++ ) {

			var x = ix * segment_width - width_half;

			vertices.push( new Vector(x, - y, 0 ) );
		}

	}

	// indices

	for ( iy = 0; iy < gridY; iy ++ ) {

		for ( ix = 0; ix < gridX; ix ++ ) {

			var a = ix + gridX1 * iy;
			var b = ix + gridX1 * ( iy + 1 );
			var c = ( ix + 1 ) + gridX1 * ( iy + 1 );
			var d = ( ix + 1 ) + gridX1 * iy;

			// faces

			indices.push( a, b, d );
			indices.push( b, c, d );

		}
	
	}

	return {
		"f": indices,
		"v": vertices
	}
}