//import "events-polyfill";
import { Bench } from "./benchmarkLib";

const graphPath = {
	points: [
		{
			x: 0,
			y: 193.8095,
			value: 1.13,
		},
		{
			x: 8,
			y: 190.969,
			value: 1.26,
		},
		{
			x: 17,
			y: 199.4905,
			value: 0.87,
		},
		{
			x: 25,
			y: 208.886,
			value: 0.44,
		},
		{
			x: 34,
			y: 213.0375,
			value: 0.25,
		},
		{
			x: 42,
			y: 204.2975,
			value: 0.65,
		},
		{
			x: 51,
			y: 214.567,
			value: 0.18,
		},
		{
			x: 59,
			y: 195.339,
			value: 1.06,
		},
		{
			x: 68,
			y: 203.42350000000002,
			value: 0.69,
		},
		{
			x: 76,
			y: 234.23200000000003,
			value: -0.72,
		},
		{
			x: 85,
			y: 202.54950000000002,
			value: 0.73,
		},
		{
			x: 94,
			y: 202.9865,
			value: 0.71,
		},
		{
			x: 102,
			y: 202.331,
			value: 0.74,
		},
		{
			x: 111,
			y: 207.13799999999998,
			value: 0.52,
		},
		{
			x: 119,
			y: 234.45049999999998,
			value: -0.73,
		},
		{
			x: 128,
			y: 238.82049999999998,
			value: -0.93,
		},
		{
			x: 136,
			y: 236.63549999999998,
			value: -0.83,
		},
		{
			x: 145,
			y: 235.10600000000002,
			value: -0.76,
		},
		{
			x: 153,
			y: 213.69299999999998,
			value: 0.22,
		},
		{
			x: 162,
			y: 183.54,
			value: 1.6,
		},
		{
			x: 171,
			y: 163.875,
			value: 2.5,
		},
		{
			x: 179,
			y: 150.32799999999997,
			value: 3.12,
		},
		{
			x: 188,
			y: 147.269,
			value: 3.26,
		},
		{
			x: 196,
			y: 148.57999999999998,
			value: 3.2,
		},
		{
			x: 205,
			y: 165.8415,
			value: 2.41,
		},
		{
			x: 213,
			y: 190.095,
			value: 1.3,
		},
		{
			x: 222,
			y: 201.457,
			value: 0.78,
		},
		{
			x: 230,
			y: 212.1635,
			value: 0.29,
		},
		{
			x: 239,
			y: 205.60850000000002,
			value: 0.59,
		},
		{
			x: 248,
			y: 190.7505,
			value: 1.27,
		},
		{
			x: 256,
			y: 187.2545,
			value: 1.43,
		},
		{
			x: 265,
			y: 195.5575,
			value: 1.05,
		},
		{
			x: 273,
			y: 207.35649999999998,
			value: 0.51,
		},
		{
			x: 282,
			y: 209.9785,
			value: 0.39,
		},
		{
			x: 290,
			y: 207.35649999999998,
			value: 0.51,
		},
		{
			x: 299,
			y: 212.1635,
			value: 0.29,
		},
		{
			x: 307,
			y: 216.315,
			value: 0.1,
		},
		{
			x: 316,
			y: 215.878,
			value: 0.12,
		},
		{
			x: 325,
			y: 217.8445,
			value: 0.03,
		},
		{
			x: 333,
			y: 252.58600000000004,
			value: -1.56,
		},
		{
			x: 342,
			y: 255.4265,
			value: -1.69,
		},
		{
			x: 350,
			y: 249.96399999999997,
			value: -1.44,
		},
		{
			x: 359,
			y: 242.53500000000003,
			value: -1.1,
		},
		{
			x: 367,
			y: 239.6945,
			value: -0.97,
		},
		{
			x: 376,
			y: 240.787,
			value: -1.02,
		},
		{
			x: 384,
			y: 244.72000000000003,
			value: -1.2,
		},
		{
			x: 393,
			y: 241.4425,
			value: -1.05,
		},
		{
			x: 402,
			y: 241.8795,
			value: -1.07,
		},
	],
};

const bench = new Bench({ name: "simple benchmark", time: 100 });

const findClosestCollum = (x: number) => {
	const points = graphPath.points;
	const totalPoints = points.length;

	// Handle edge cases
	if (x <= points[0].x) return 0;
	if (x >= points[totalPoints - 1].x) return totalPoints - 1;

	// Estimate index based on x position
	const xRange = points[totalPoints - 1].x - points[0].x;
	const estimatedIndex = Math.floor(
		((x - points[0].x) / xRange) * (totalPoints - 1),
	);

	// Define search window (you can adjust the window size if needed)
	const windowSize = 2;
	const start = Math.max(0, estimatedIndex - windowSize);
	const end = Math.min(totalPoints - 1, estimatedIndex + windowSize);

	// Find closest point within the window
	let closestIndex = estimatedIndex;
	let minDistance = Math.abs(points[estimatedIndex].x - x);

	for (let i = start; i <= end; i++) {
		const distance = Math.abs(points[i].x - x);
		if (distance < minDistance) {
			minDistance = distance;
			closestIndex = i;
		}
	}

	return closestIndex;
};

const findClosestCollumBinary1 = (x: number) => {
	let left = 0;
	let right = graphPath.points.length - 1;

	// Handle edge cases
	if (x <= graphPath.points[left].x) return left;
	if (x >= graphPath.points[right].x) return right;

	// Binary search
	while (left <= right) {
		const mid = Math.floor((left + right) / 2);

		// If we found exact match
		if (graphPath.points[mid].x === x) {
			return mid;
		}

		// If we're between two points, return the closer one
		if (
			mid > 0 &&
			graphPath.points[mid - 1].x <= x &&
			x <= graphPath.points[mid].x
		) {
			return x - graphPath.points[mid - 1].x < graphPath.points[mid].x - x
				? mid - 1
				: mid;
		}

		if (graphPath.points[mid].x < x) {
			left = mid + 1;
		} else {
			right = mid - 1;
		}
	}

	return left;
};

const findClosestCollumBinary2 = (x: number) => {
	const points = graphPath.points;
	let left = 0;
	let right = points.length - 1;

	// Early exit for edge cases
	if (x <= points[left].x) return left;
	if (x >= points[right].x) return right;

	// Binary search with interpolation hint
	while (right - left > 1) {
		// Simplified termination condition
		// Can optionally use interpolation for initial guess
		// const mid = left + ((x - points[left].x) * (right - left)) / (points[right].x - points[left].x) | 0;
		const mid = (left + right) >>> 1; // Faster integer division by 2

		if (points[mid].x <= x) {
			left = mid;
		} else {
			right = mid;
		}
	}

	// Direct comparison of two remaining points
	return x - points[left].x <= points[right].x - x ? left : right;
};

const findClosestCollumBinary3 = (x: number) => {
	const points = graphPath.points;
	let left = 0;
	let right = points.length - 1;

	// Early exit for edge cases
	if (x <= points[0].x) return 0;
	if (x >= points[right].x) return right;

	// Initial interpolation guess for potentially faster convergence
	let mid =
		(left +
			((x - points[left].x) * (right - left)) /
				(points[right].x - points[left].x)) |
		0;

	// Ensure mid stays within bounds
	mid = mid < left ? left : mid > right ? right : mid;

	// Adjust search space based on initial guess
	if (points[mid].x <= x) {
		left = mid;
	} else {
		right = mid;
	}

	// Fast binary search with minimal operations
	while (right - left > 1) {
		mid = (left + right) >>> 1;
		points[mid].x <= x ? (left = mid) : (right = mid);
	}

	// Final comparison using subtraction instead of abs()
	return x - points[left].x <= points[right].x - x ? left : right;
};

bench
	.setIterations(100000)
	.add("findClosestCollum", () => {
		findClosestCollum(200);
	})
	.add("findClosestCollumBinary1", () => {
		findClosestCollumBinary1(200);
	})
	.add("findClosestCollumBinary2", () => {
		// fastests 🚀
		findClosestCollumBinary2(200);
	})
	.add("findClosestCollumBinary3", () => {
		findClosestCollumBinary3(200);
	});

export const run = async () => {
	await bench.run();
	console.log(bench.name);
	console.table(bench.table());
};
