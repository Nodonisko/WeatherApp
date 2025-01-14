import { Skia } from "@shopify/react-native-skia";

import { Vector } from "@shopify/react-native-skia";
import { controlPoint } from "./graphMath";

export const curvedWindLine = (points: Vector[], smoothing: number) => {
	"worklet";
	const path = Skia.Path.Make();
	if (points.length === 0) return path;

	path.moveTo(points[0]!.x, points[0]!.y);
	// build the d attributes by looping over the points
	for (let i = 0; i < points.length; i++) {
		if (i === 0) {
			continue;
		}

		const point = points[i]!;
		const next = points[i + 1] || null;
		if (i % 3 !== 0) {
			path.moveTo(point.x, point.y);
			continue;
		}
		const prev = points[i - 1] || null;
		const prevPrev = points[i - 2] || null;
		const cps = controlPoint(prev, prevPrev, point, false, smoothing);
		const cpe = controlPoint(point, prev, next, true, smoothing);

		path.cubicTo(cps.x, cps.y, cpe.x, cpe.y, point.x, point.y);
	}
	return path;
};
