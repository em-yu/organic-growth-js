import Vector from '../libs/geometry-processing-js/node/linear-algebra/vector';

const K = 100;

class RepulsivePlane {
	constructor(n, p0) {
		this.n = n.unit();
		this.p0 = p0;
	}

	repulse(x) {
		let d = x.minus(this.p0).dot(this.n);
		if (d < 0) {
			let f = this.n.times(- K * d);
			return f;
		}
		else {
			return new Vector();
		}
	}

	isColliding(x) {
		return x.minus(this.p0).dot(this.n) < 0;
	}

}

export default RepulsivePlane;