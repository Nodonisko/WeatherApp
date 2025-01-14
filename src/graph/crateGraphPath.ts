import { Skia, SkPath, SkPoint } from "@shopify/react-native-skia";
import { curveLines } from "./graphMath";

export interface GraphPoint {
	value: number;
	date: Date;
	percipitation: number;
	percipitationSnow: number;
	cloudsLow: number;
	cloudsMid: number;
	cloudsHigh: number;
	windSpeed: number;
	windDirection: number;
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
	"worklet";
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
	"worklet";
	return height * getYPositionInRange(value, yRange);
};

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
	paddingTop?: number;
	paddingBottom?: number;
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
	cloudLayerHeight?: number;
};

type WindArrow = {
	point: SkPoint;
	direction: number;
};

type GraphPath = {
	path: SkPath;
	gradientPath: SkPath | null;
	points: PointWithValue[];
	hasAnyNegativeValue: boolean;
	maxPrecipitation: number;

	cloudsLowPath: SkPath;
	cloudsMidPath: SkPath;
	cloudsHighPath: SkPath;
	windSpeedPath: SkPath;
	windSpeedPoints: SkPoint[];
	windArrows: WindArrow[];
};

export type PointWithValue = Omit<GraphPoint, "date"> &
	SkPoint & {
		date: number;
		isTrendChanging: boolean;
	};

const CLOUDS_RANGE = {
	min: 0,
	max: 100,
};

const WIND_SPEED_RANGE = {
	min: 0,
	max: 10,
};

const WIND_PADDING_BOTTOM = 5;

export const CLOUDS_LOW_Y_START = 15;
export const CLOUDS_MID_Y_START = 50;
export const CLOUDS_HIGH_Y_START = 85;

const MIN_TREND_CHANGE_DISTANCE = 1;

const WIND_ARROW_MIN_DISTANCE = 13; // Minimum pixels between arrows

function distributeArrowsAlongPath(
	points: SkPoint[],
	windDirections: number[],
	minDistance: number = WIND_ARROW_MIN_DISTANCE,
): WindArrow[] {
	if (points.length < 2) return [];

	// Pre-allocate arrays with known size
	const pointCount = points.length;
	const segmentLengths = new Array<number>(pointCount - 1);
	const cumulativeLengths = new Array<number>(pointCount - 1);

	// Calculate lengths in a single pass
	let totalLength = 0;
	for (let i = 1; i < pointCount; i++) {
		const prevPoint = points[i - 1]!;
		const currentPoint = points[i]!;

		const dx = currentPoint.x - prevPoint.x;
		const dy = currentPoint.y - prevPoint.y;
		const length = Math.sqrt(dx * dx + dy * dy);

		totalLength += length;
		segmentLengths[i - 1] = length;
		cumulativeLengths[i - 1] = totalLength;
	}

	const numArrows = Math.max(2, Math.floor(totalLength / minDistance));
	const arrows = new Array<{ point: SkPoint; direction: number }>(numArrows);
	const spacing = totalLength / (numArrows - 1);

	// Add first point
	arrows[0] = { point: points[0]!, direction: windDirections[0]! };

	// Binary search helper function
	const findSegmentIndex = (targetDistance: number): number => {
		let left = 0;
		let right = cumulativeLengths.length - 1;

		// Handle edge cases
		if (targetDistance <= 0) return 0;
		if (targetDistance >= totalLength) return right;

		while (left <= right) {
			const mid = (left + right) >>> 1;
			const midValue = cumulativeLengths[mid]!;

			if (midValue < targetDistance) {
				left = mid + 1;
			} else {
				if (mid === 0 || cumulativeLengths[mid - 1]! <= targetDistance) {
					return mid;
				}
				right = mid - 1;
			}
		}

		return Math.min(left, cumulativeLengths.length - 1);
	};

	// Distribute middle arrows
	for (let i = 1; i < numArrows - 1; i++) {
		const targetDistance = i * spacing;
		const segmentIndex = findSegmentIndex(targetDistance);

		// Ensure segmentIndex is within bounds
		if (segmentIndex >= 0 && segmentIndex < pointCount - 1) {
			const segmentStart =
				segmentIndex > 0 ? cumulativeLengths[segmentIndex - 1]! : 0;
			const segmentProgress =
				(targetDistance - segmentStart) / segmentLengths[segmentIndex]!;

			const p1 = points[segmentIndex]!;
			const p2 = points[segmentIndex + 1]!;

			const x = p1.x + (p2.x - p1.x) * segmentProgress;
			const y = p1.y + (p2.y - p1.y) * segmentProgress;

			const d1 = windDirections[segmentIndex]!;
			const d2 = windDirections[segmentIndex + 1]!;
			const direction = d1 + (d2 - d1) * segmentProgress;

			arrows[i] = {
				point: { x, y },
				direction,
			};
		}
	}

	// Add last point
	arrows[numArrows - 1] = {
		point: points[pointCount - 1]!,
		direction: windDirections[pointCount - 1]!,
	};

	return arrows.filter(Boolean); // Remove any undefined entries
}

export function createGraphPathBase({
	pointsInRange: graphData,
	range,
	horizontalPadding,
	paddingTop = 0,
	paddingBottom = 0,
	cloudLayerHeight = 15,
	canvasHeight: height,
	canvasWidth: width,
}: GraphPathConfig): GraphPath {
	// Canvas width substracted by the horizontal padding => Actual drawing width
	const drawingWidth = width - 2 * horizontalPadding;
	// Canvas height substracted by the vertical padding => Actual drawing height
	const drawingHeight = height - paddingTop - paddingBottom;

	const windSpeedHeight = drawingHeight * 0.5;
	const windSpeedYStart =
		height - paddingBottom - windSpeedHeight - WIND_PADDING_BOTTOM;
	console.log("windSpeedYStart", windSpeedYStart);
	console.log("windSpeedHeight", windSpeedHeight);
	let hasAnyNegativeValue = false;

	const cloudLowPoints = [];
	const cloudMidPoints = [];
	const cloudHighPoints = [];
	const windSpeedPoints: SkPoint[] = [];

	if (graphData[0] == null)
		return {
			path: Skia.Path.Make(),
			cloudsLowPath: Skia.Path.Make(),
			cloudsMidPath: Skia.Path.Make(),
			cloudsHighPath: Skia.Path.Make(),
			windSpeedPath: Skia.Path.Make(),
			windSpeedPoints: [],
			gradientPath: null,
			points: [],
			hasAnyNegativeValue,
			maxPrecipitation: 0,
			windArrows: [],
		};

	const points: PointWithValue[] = [];

	let isTrendChanging = false;
	let lastTrendChangeIndex = 0;
	let maxPrecipitation = 0;

	// Collect wind directions along with points
	const windDirections: number[] = [];

	for (let index = 0; index < graphData.length; index++) {
		const { value, date, percipitation, ...rest } = graphData[index]!;
		if (value < 0) hasAnyNegativeValue = true;
		if (percipitation > maxPrecipitation) maxPrecipitation = percipitation;
		const prev = graphData[index - 1]?.value;
		const next = graphData[index + 1]?.value;

		if (prev && next) {
			const isGoingDown =
				(value <= prev && value < next) || (value < prev && value <= next);
			const isGoingUp =
				(value >= prev && value > next) || (value > prev && value >= next);
			const lastChangeDistance = index - lastTrendChangeIndex;
			isTrendChanging =
				(isGoingDown || isGoingUp) &&
				lastChangeDistance > MIN_TREND_CHANGE_DISTANCE;
			if (isTrendChanging) lastTrendChangeIndex = index;
		}
		// Simply multiply by height and add padding
		const y = getYInRange(drawingHeight, value, range.y) + paddingTop;

		const x =
			getXInRange(drawingWidth, graphData[index]!.date, range.x) +
			horizontalPadding;

		points.push({
			...rest,
			x,
			y,
			value,
			date: date.getTime(),
			percipitation,
			isTrendChanging,
		});
		cloudLowPoints.push({
			x,
			y:
				getYInRange(cloudLayerHeight, rest.cloudsLow * 100, CLOUDS_RANGE) +
				CLOUDS_LOW_Y_START,
		});
		cloudMidPoints.push({
			x,
			y:
				getYInRange(cloudLayerHeight, rest.cloudsMid * 100, CLOUDS_RANGE) +
				CLOUDS_MID_Y_START,
		});
		cloudHighPoints.push({
			x,
			y:
				getYInRange(cloudLayerHeight, rest.cloudsHigh * 100, CLOUDS_RANGE) +
				CLOUDS_HIGH_Y_START,
		});

		const windSpeedY =
			getYInRange(windSpeedHeight, rest.windSpeed, WIND_SPEED_RANGE) +
			windSpeedYStart;
		windSpeedPoints.push({
			x,
			y: windSpeedY,
		});

		windDirections.push(rest.windDirection);
	}

	const path = curveLines(points, 0.3, "bezier");
	const cloudsLowPath = curveLines(cloudLowPoints, 0.3, "bezier");
	cloudsLowPath.lineTo(width, CLOUDS_LOW_Y_START);
	cloudsLowPath.lineTo(0, CLOUDS_LOW_Y_START);
	const cloudsMidPath = curveLines(cloudMidPoints, 0.3, "bezier");
	cloudsMidPath.lineTo(width, CLOUDS_MID_Y_START);
	cloudsMidPath.lineTo(0, CLOUDS_MID_Y_START);
	const cloudsHighPath = curveLines(cloudHighPoints, 0.3, "bezier");
	cloudsHighPath.lineTo(width, CLOUDS_HIGH_Y_START);
	cloudsHighPath.lineTo(0, CLOUDS_HIGH_Y_START);

	const gradientPath = path.copy();
	gradientPath.lineTo(points[points.length - 1]!.x, height - paddingBottom);
	gradientPath.lineTo(0 + horizontalPadding, height - paddingBottom);

	const windSpeedPath = curveLines(windSpeedPoints, 0.3, "simple");

	// Distribute arrows along the wind speed path
	const windArrows = distributeArrowsAlongPath(windSpeedPoints, windDirections);

	return {
		path,
		gradientPath,
		points,
		hasAnyNegativeValue,
		maxPrecipitation,
		cloudsLowPath,
		cloudsMidPath,
		cloudsHighPath,
		windSpeedPath,
		windSpeedPoints,
		windArrows,
	};
}
