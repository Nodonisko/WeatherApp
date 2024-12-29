import { SkPath, Skia, SkPoint, PathCommand } from "@shopify/react-native-skia";
import { PixelRatio } from "react-native";

export interface GraphPoint {
	value: number;
	date: Date;
}

export interface GraphXRange {
	min: Date;
	max: Date;
}

export interface GraphYRange {
	min: number;
	max: number;
}

export interface GraphPathRange {
	x: GraphXRange;
	y: GraphYRange;
}

type GraphPathConfig = {
	/**
	 * Graph Points to use for the Path. Will be normalized and centered.
	 */
	pointsInRange: GraphPoint[];
	/**
	 * Optional Padding (left, right) for the Graph to correctly round the Path.
	 */
	horizontalPadding: number;
	/**
	 * Optional Padding (top, bottom) for the Graph to correctly round the Path.
	 */
	verticalPadding: number;
	/**
	 * Height of the Canvas (Measured with onLayout)
	 */
	canvasHeight: number;
	/**
	 * Width of the Canvas (Measured with onLayout)
	 */
	canvasWidth: number;
	/**
	 * Range of the graph's x and y-axis
	 */
	range: GraphPathRange;
};

type GraphPathConfigWithGradient = GraphPathConfig & {
	shouldFillGradient: true;
};
type GraphPathConfigWithoutGradient = GraphPathConfig & {
	shouldFillGradient: false;
};

export const getXPositionInRange = (
	date: Date,
	xRange: GraphXRange,
): number => {
	const diff = xRange.max.getTime() - xRange.min.getTime();
	const x = date.getTime();

	return (x - xRange.min.getTime()) / diff;
};

export const getXInRange = (
	width: number,
	date: Date,
	xRange: GraphXRange,
): number => Math.floor(width * getXPositionInRange(date, xRange));

export const getYPositionInRange = (
	value: number,
	yRange: GraphYRange,
): number => {
	if (yRange.min === yRange.max) return 0.5; // Prevent division by zero (NaN)

	const diff = yRange.max - yRange.min;
	// Normalize the value to be between 0 and 1
	// where 0 represents yRange.min and 1 represents yRange.max
	return 1 - (value - yRange.min) / diff;
};

export const getYInRange = (
	height: number,
	value: number,
	yRange: GraphYRange,
): number => {
	return (height / 2) * getYPositionInRange(value, yRange);
};

type GraphPath = {
	path: SkPath;
	gradientPath: null;
	points: PointWithValue[];
};
type GraphPathWithGradient = {
	path: SkPath;
	gradientPath: SkPath;
	points: PointWithValue[];
};

type PointWithValue = SkPoint & { value: number };

function getCatmullRomPoint(
	p0: PointWithValue,
	p1: PointWithValue,
	p2: PointWithValue,
	p3: PointWithValue,
	t: number,
) {
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

console.log(PixelRatio.getPixelSizeForLayoutSize(2));
const GRADIENT_OVERLAP = 3 * PixelRatio.get();

export function createGraphPathBase(
	props: GraphPathConfigWithGradient,
): GraphPathWithGradient;

export function createGraphPathBase({
	pointsInRange: graphData,
	range,
	horizontalPadding,
	verticalPadding,
	canvasHeight: height,
	canvasWidth: width,
	shouldFillGradient,
}: GraphPathConfigWithGradient | GraphPathConfigWithoutGradient):
	| GraphPath
	| GraphPathWithGradient {
	const path = Skia.Path.Make();

	// Canvas width substracted by the horizontal padding => Actual drawing width
	const drawingWidth = width - 2 * horizontalPadding;
	// Canvas height substracted by the vertical padding => Actual drawing height
	const drawingHeight = height - 2 * verticalPadding;

	if (graphData[0] == null) return { path, gradientPath: null, points: [] };

	const points: (SkPoint & { value: number })[] = [];

	const startX =
		getXInRange(drawingWidth, graphData[0]!.date, range.x) + horizontalPadding;
	const endX =
		getXInRange(drawingWidth, graphData[graphData.length - 1]!.date, range.x) +
		horizontalPadding;

	for (let index = 0; index < graphData.length; index++) {
		const { value } = graphData[index]!;
		// Simply multiply by height and add padding
		const y = getYInRange(drawingHeight, value * 10, range.y) + verticalPadding;

		const x =
			getXInRange(drawingWidth, graphData[index]!.date, range.x) +
			horizontalPadding;

		points.push({ x, y, value });
	}

	for (let i = 0; i < points.length; i++) {
		const p0 = points[Math.max(i - 1, 0)];
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = points[Math.min(i + 2, points.length - 1)];

		if (p0 == null || p1 == null || p2 == null || p3 == null) continue;

		if (i === 0) path.moveTo(p1.x, p1.y);

		// Add intermediate points for smoother curve
		const steps = 5;
		for (let step = 1; step <= steps; step++) {
			const t = step / steps;
			const point = getCatmullRomPoint(p0, p1, p2, p3, t);
			path.lineTo(point.x, point.y);
		}
	}

	const pathCmds = path.toCmds();
	const negativeThreshold = height / 2;
	const zeroY = getYInRange(drawingHeight, 0, range.y) + verticalPadding;

	let pathNegativeCmds: PathCommand[] = [];
	let pathPositiveCmds: PathCommand[] = [];
	let pathNegativeGradientCmds: PathCommand[] = [];
	let pathPositiveGradientCmds: PathCommand[] = [];

	let segmentStart: { x: number; isNegative: boolean } | null = null;

	for (let i = 0; i < pathCmds.length; i++) {
		const cmd = pathCmds[i];
		if (!cmd) continue;

		const [cmdType, x, y, ...rest] = cmd;
		if (y == null || x == null) continue;
		const isNegative = y > negativeThreshold;

		// Start new segment if needed
		if (!segmentStart) {
			segmentStart = { x, isNegative };
			if (isNegative) {
				pathNegativeGradientCmds.push([0, x, y]); // moveTo start of segment
			} else {
				pathPositiveGradientCmds.push([0, x, y]); // moveTo start of segment
			}
		}

		// When crossing the threshold, add an intersection point
		if (i > 0) {
			const prevCmd = pathCmds[i - 1]!;
			const prevY = prevCmd[2];
			if (prevY == null) continue;
			const prevIsNegative = prevY > negativeThreshold;

			if (isNegative !== prevIsNegative) {
				// Calculate intersection point with threshold line
				const prevX = prevCmd[1];
				if (prevX == null) continue;
				const t = (negativeThreshold - prevY) / (y - prevY);
				const intersectX = prevX + t * (x - prevX);

				// Close the current segment
				if (segmentStart) {
					if (segmentStart.isNegative) {
						pathNegativeGradientCmds.push([1, intersectX, y]);
						pathNegativeGradientCmds.push([1, intersectX, height]);
						pathNegativeGradientCmds.push([1, segmentStart.x, height]);
						pathNegativeGradientCmds.push([1, segmentStart.x, y]);
					} else {
						pathPositiveGradientCmds.push([1, intersectX, y]);
						pathPositiveGradientCmds.push([1, intersectX, height]);
						pathPositiveGradientCmds.push([1, segmentStart.x, height]);
						pathPositiveGradientCmds.push([1, segmentStart.x, y]);
					}
				}

				// Start new segment
				segmentStart = { x: intersectX, isNegative };

				// Start new path segment with moveTo
				if (isNegative) {
					pathNegativeGradientCmds.push([0, intersectX, negativeThreshold]); // moveTo
				} else {
					pathPositiveGradientCmds.push([0, intersectX, negativeThreshold]); // moveTo
				}

				// Add intersection point to both paths
				pathNegativeCmds.push([1, intersectX, negativeThreshold, ...rest]);
				pathPositiveCmds.push([1, intersectX, negativeThreshold, ...rest]);
			}
		}

		// Add point to appropriate path
		if (isNegative) {
			pathPositiveCmds.push([0, x, y, ...rest]);
			pathNegativeCmds.push(cmd);
			pathNegativeGradientCmds.push([1, x, y]); // lineTo for gradient
		} else {
			pathPositiveCmds.push(cmd);
			pathNegativeCmds.push([0, x, y, ...rest]);
			pathPositiveGradientCmds.push([1, x, y]); // lineTo for gradient
		}
	}

	// Close the final segment
	if (segmentStart) {
		const lastX = pathCmds[pathCmds.length - 1]?.[1];
		const lastY = pathCmds[pathCmds.length - 1]?.[2];
		if (lastX != null && lastY != null) {
			if (segmentStart.isNegative) {
				pathNegativeGradientCmds.push([1, lastX, lastY]);
				pathNegativeGradientCmds.push([1, lastX, height]);
				pathNegativeGradientCmds.push([1, segmentStart.x, height]);
				pathNegativeGradientCmds.push([1, segmentStart.x, lastY]);
			} else {
				pathPositiveGradientCmds.push([1, lastX, lastY]);
				pathPositiveGradientCmds.push([1, lastX, height]);
				pathPositiveGradientCmds.push([1, segmentStart.x, height]);
				pathPositiveGradientCmds.push([1, segmentStart.x, lastY]);
			}
		}
	}

	const pathNegative = Skia.Path.MakeFromCmds(pathNegativeCmds);
	const pathPositive = Skia.Path.MakeFromCmds(pathPositiveCmds);
	const pathNegativeGradient = Skia.Path.MakeFromCmds(pathNegativeGradientCmds);
	const pathPositiveGradient = Skia.Path.MakeFromCmds(pathPositiveGradientCmds);

	if (!shouldFillGradient)
		return {
			path,
			pathNegative,
			pathNegativeGradient,
			pathPositive,
			pathPositiveGradient,
			gradientPath: null,
			points,
		};

	return {
		path,
		pathNegative,
		pathNegativeGradient,
		pathPositive,
		pathPositiveGradient,
		gradientPath: null,
		points,
	};
}
