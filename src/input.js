import Vector from '../libs/geometry-processing-js/node/linear-algebra/vector';
import MeshIO from '../libs/geometry-processing-js/node/utils/meshio';

import smallDisk18 from './obj/small_disk_18.obj';
import smallDisk20 from './obj/small_disk_20.obj';
import smallDisk12 from './obj/small_disk_12_2.obj';

export function initMesh(shape) {
	switch (shape) {
		case "disk":
			// return MeshIO.readOBJ(smallDisk12);
			return disk(10);
		case "disk12":
			// return MeshIO.readOBJ(smallDisk18);
			return disk(12);
		case "disk20":
			return MeshIO.readOBJ(smallDisk20);
		case "square":
		 	return planeGeometry(3, 3, 6, 6);
		case "cylinder":
			return CylinderBufferGeometry(4, 4, 4, 20, 6, false);
		default:
			console.error("Shape " + shape + " is not supported.");
	}
}

/**
 * Adapted from Three.js
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 */
function planeGeometry(width, height, widthSegments, heightSegments) {

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

/**
 * Adapted from Three.js
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 */
function CylinderBufferGeometry( radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength ) {

	radiusTop = radiusTop !== undefined ? radiusTop : 1;
	radiusBottom = radiusBottom !== undefined ? radiusBottom : 1;
	height = height || 1;

	radialSegments = Math.floor( radialSegments ) || 8;
	heightSegments = Math.floor( heightSegments ) || 1;

	openEnded = openEnded !== undefined ? openEnded : false;
	thetaStart = thetaStart !== undefined ? thetaStart : 0.0;
	thetaLength = thetaLength !== undefined ? thetaLength : Math.PI * 2;

	// buffers
	var indices = [];
	var vertices = [];

	// helper variables

	var index = 0;
	var indexArray = [];
	var halfHeight = height / 2;

	var x, y;
	// var vertex = new Vector();

	// generate vertices, normals and uvs

	for ( y = 0; y <= heightSegments; y ++ ) {

		var indexRow = [];

		var v = y / heightSegments;

		// calculate the radius of the current row

		var radius = v * ( radiusBottom - radiusTop ) + radiusTop;

		for ( x = 0; x < radialSegments; x ++ ) {

			var u = x / radialSegments;

			var theta = u * thetaLength + thetaStart;

			var sinTheta = Math.sin( theta );
			var cosTheta = Math.cos( theta );

			// vertex
			vertices.push( new Vector(radius * sinTheta, - v * height + halfHeight, radius * cosTheta) );


			// save index of vertex in respective row
			indexRow.push( index ++ );

		}

		// now save vertices of the row in our index array

		indexArray.push( indexRow );

	}

	// generate indices

	for ( x = 0; x < radialSegments; x ++ ) {

		for ( y = 0; y < heightSegments; y ++ ) {

			// we use the index array to access the correct indices

			var a = indexArray[ y ][ x ];
			var b = indexArray[ y + 1 ][ x ];
			var c = indexArray[ y + 1 ][ (x + 1) % radialSegments ];
			var d = indexArray[ y ][ (x + 1) % radialSegments ];

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

function disk(n) {
	let vertices = [];
	let indices = [];

	let innerRadius = 1.0;

	let center = new Vector(0, 0, 0);
	vertices.push(center);

	let innerAngle = 2 * Math.PI / n;
	
	for (let i = 0; i < n; i++) {
		vertices.push(new Vector(innerRadius * Math.cos(innerAngle * i), innerRadius * Math.sin(innerAngle * i), 0));
		indices.push(0);
		indices.push((n - 1 + i) % n + 1);
		indices.push(i + 1);
	}

	return {
		"f": indices,
		"v": vertices
	}

}