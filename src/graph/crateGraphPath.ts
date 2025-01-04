import { Skia, SkPath, SkPoint } from "@shopify/react-native-skia";
import { curveLines } from "./graphMath";

export interface GraphPoint {
	value: number;
	date: Date;
	percipitation: number;
	percipitationSnow: number;
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

type GraphPath = {
	path: SkPath;
	gradientPath: null;
	points: PointWithValue[];
	hasAnyNegativeValue: boolean;
	maxPrecipitation: number;
};
type GraphPathWithGradient = {
	gradientPath: SkPath;
} & Omit<GraphPath, "gradientPath">;

export type PointWithValue = Omit<GraphPoint, "date"> &
	SkPoint & {
		date: number;
		isTrendChanging: boolean;
	};

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
	// Canvas width substracted by the horizontal padding => Actual drawing width
	const drawingWidth = width - 2 * horizontalPadding;
	// Canvas height substracted by the vertical padding => Actual drawing height
	const drawingHeight = height - 2 * verticalPadding;
	let hasAnyNegativeValue = false;

	if (graphData[0] == null)
		return {
			path: Skia.Path.Make(),
			gradientPath: null,
			points: [],
			hasAnyNegativeValue,
			maxPrecipitation: 0,
		};

	const points: PointWithValue[] = [];

	let isTrendChanging = false;
	let maxPrecipitation = 0;
	for (let index = 0; index < graphData.length; index++) {
		const { value, date, percipitation, ...rest } = graphData[index]!;
		if (value < 0) hasAnyNegativeValue = true;
		if (percipitation > maxPrecipitation) maxPrecipitation = percipitation;
		const prev = graphData[index - 1]?.value;
		const next = graphData[index + 1]?.value;

		if (prev && next) {
			const isNegativeTrend = value < prev && value < next;
			const isPositiveTrend = value > prev && value > next;
			isTrendChanging = isNegativeTrend || isPositiveTrend;
		}
		// Simply multiply by height and add padding
		const y = getYInRange(drawingHeight, value, range.y) + verticalPadding;

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
	}

	const path = curveLines(points, 0.3, "simple");

	const gradientPath = path.copy();
	gradientPath.lineTo(points[points.length - 1]!.x, height + verticalPadding);
	gradientPath.lineTo(0 + horizontalPadding, height + verticalPadding);

	return {
		path,
		gradientPath,
		points,
		hasAnyNegativeValue,
		maxPrecipitation,
	};
}
