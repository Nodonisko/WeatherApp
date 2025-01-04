// Shamelessly copied from (kudos @wcandillon):
// https://github.com/Shopify/react-native-skia/blob/main/apps/paper/src/Examples/Wallet/Math.ts

import type { Vector } from "@shopify/react-native-skia";
import { Skia, cartesian2Polar } from "@shopify/react-native-skia";
import { exhaustiveCheck } from "@shopify/react-native-skia/src/renderer/typeddash";

interface Cubic {
	from: Vector;
	c1: Vector;
	c2: Vector;
	to: Vector;
}

export const controlPoint = (
	current: Vector | null,
	previous: Vector | null,
	next: Vector | null,
	reverse: boolean,
	smoothing: number,
) => {
	"worklet";
	if (!current) return { x: 0, y: 0 };

	const p = previous || current;
	const n = next || current;
	// Properties of the opposed-line
	const lengthX = n.x - p.x;
	const lengthY = n.y - p.y;

	const o = cartesian2Polar({ x: lengthX, y: lengthY });
	// If is end-control-point, add PI to the angle to go backward
	const angle = o.theta + (reverse ? Math.PI : 0);
	const length = o.radius * smoothing;
	// The control point position is relative to the current point
	const x = current.x + Math.cos(angle) * length;
	const y = current.y + Math.sin(angle) * length;
	return { x, y };
};

function getCatmullRomPoint(
	p0: Vector,
	p1: Vector,
	p2: Vector,
	p3: Vector,
	t: number,
) {
	"worklet";
	const tension = 1; // 1 = very smooth,  = linear

	const t2 = t * t;
	const t3 = t2 * t;

	// Catmull-Rom matrix calculations with proper tension application
	const x =
		p1.x +
		0.5 *
			((p2.x - p0.x) * tension * t +
				(2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tension * t2 +
				(3 * p1.x - 3 * p2.x + p3.x - p0.x) * tension * t3);

	const y =
		p1.y +
		0.5 *
			((p2.y - p0.y) * tension * t +
				(2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tension * t2 +
				(3 * p1.y - 3 * p2.y + p3.y - p0.y) * tension * t3);

	return { x, y };
}

export const curveLines = (
	points: Vector[],
	smoothing: number,
	strategy: "complex" | "bezier" | "simple" | "catmullRom",
) => {
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
		const prev = points[i - 1] || null;
		const prevPrev = points[i - 2] || null;
		const cps = controlPoint(prev, prevPrev, point, false, smoothing);
		const cpe = controlPoint(point, prev, next, true, smoothing);
		switch (strategy) {
			case "simple":
				const cp = {
					x: (cps.x + cpe.x) / 2,
					y: (cps.y + cpe.y) / 2,
				};
				path.quadTo(cp.x, cp.y, point.x, point.y);
				break;
			case "bezier":
				const p0 = prevPrev || prev;
				const p1 = prev;
				const cp1x = (2 * p0!.x + p1!.x) / 3;
				const cp1y = (2 * p0!.y + p1!.y) / 3;
				const cp2x = (p0!.x + 2 * p1!.x) / 3;
				const cp2y = (p0!.y + 2 * p1!.y) / 3;
				const cp3x = (p0!.x + 4 * p1!.x + point!.x) / 6;
				const cp3y = (p0!.y + 4 * p1!.y + point!.y) / 6;
				path.cubicTo(cp1x, cp1y, cp2x, cp2y, cp3x, cp3y);
				if (i === points.length - 1) {
					path.cubicTo(
						points[points.length - 1]!.x,
						points[points.length - 1]!.y,
						points[points.length - 1]!.x,
						points[points.length - 1]!.y,
						points[points.length - 1]!.x,
						points[points.length - 1]!.y,
					);
				}
				break;
			case "complex":
				path.cubicTo(cps.x, cps.y, cpe.x, cpe.y, point.x, point.y);
				break;
			case "catmullRom":
				const point0 = points[Math.max(i - 1, 0)];
				const point1 = point;
				const point2 = next;
				const point3 = points[Math.min(i + 2, points.length - 1)];

				if (!point0 || !point1 || !point2 || !point3) continue;

				if (i === 0) path.moveTo(point1.x, point1.y);

				// Add intermediate points for smoother curve
				const steps = 5;
				for (let step = 1; step <= steps; step++) {
					const t = step / steps;
					const point = getCatmullRomPoint(point0, point1, point2, point3, t);
					path.lineTo(point.x, point.y);
				}
				break;
			default:
				exhaustiveCheck(strategy);
		}
	}
	return path;
};
