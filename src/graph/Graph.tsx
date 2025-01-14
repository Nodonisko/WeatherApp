import React, { useCallback, useMemo } from "react";

import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	useSharedValue,
	withTiming,
	useAnimatedStyle,
	useAnimatedProps,
	useDerivedValue,
} from "react-native-reanimated";
import {
	Skia,
	Canvas,
	Path,
	LinearGradient,
	Rect,
	Line,
	vec,
	DashPathEffect,
	Group,
	Text,
	matchFont,
	rect,
	listFontFamilies,
	TileMode,
	ColorMatrix,
	Shader,
	Turbulence,
	Fill,
	TwoPointConicalGradient,
	Circle,
	RoundedRect,
	rotateY,
} from "@shopify/react-native-skia";
import {
	CLOUDS_HIGH_Y_START,
	CLOUDS_LOW_Y_START,
	CLOUDS_MID_Y_START,
	GraphPoint,
	createGraphPathBase,
	getYInRange,
} from "./crateGraphPath";
import { fetchWeather } from "../weatherApi/weatherApi";
import olomouc from "../../fixtures/olomouc.json";
import { Platform, StyleSheet } from "react-native";
import { HourlyLegend } from "./HourlyLegend";
import { roundTo1Decimals } from "./mathHelpers";
import { CloudLayer } from "./CloudLayer";
import { UnistylesRuntime } from "react-native-unistyles";
import { colors } from "../colors";
import { WindLine } from "./WindLine";
import { RainColumns } from "./RainColumns";

const pathStrokeWidth = 1;

const LEGEND_HEIGHT = 36 + UnistylesRuntime.insets.bottom;
const CLOUD_HEIGHT = 100;

const PADDING_TOP = CLOUD_HEIGHT + 80;
const PADDING_BOTTOM = LEGEND_HEIGHT;

const olomoucDate = new Date(olomouc.forecastTimeIso);
export const graphPoints: GraphPoint[] =
	olomouc.parameterValues.TEMPERATURE.map((temp, index) => ({
		value: roundTo1Decimals(temp),
		percipitation: roundTo1Decimals(
			olomouc.parameterValues.PRECIPITATION_TOTAL[index]!,
		),
		percipitationSnow: roundTo1Decimals(
			olomouc.parameterValues.PRECIPITATION_SNOW[index]!,
		),
		cloudsLow: olomouc.parameterValues.CLOUDS_LOW[index]!,
		cloudsMid: olomouc.parameterValues.CLOUDS_MEDIUM[index]!,
		cloudsHigh: olomouc.parameterValues.CLOUDS_HIGH[index]!,
		windSpeed: olomouc.parameterValues.WIND_SPEED[index]!,
		windDirection: olomouc.parameterValues.WIND_DIRECTION[index]!,
		// every hour from olomoucDate
		date: new Date(olomoucDate.getTime() + index * 1000 * 60 * 60),
	}));

interface GraphProps {
	width?: number;
	height?: number;
}

const fontFamily = Platform.select({
	ios: "Helvetica Neue",
	android: "sans-serif-medium",
});

const font = matchFont({
	fontFamily,
	fontSize: 12,
});
const fontCurrent = matchFont({
	fontFamily,
	fontSize: 18,
});

export const Graph: React.FC<GraphProps> = ({ width = 800, height = 600 }) => {
	const graphHeight = height - LEGEND_HEIGHT;
	const graphEndY = graphHeight;
	// console.log("Graph dimensions:", {
	// 	width,
	// 	height,
	// 	graphHeight,
	// 	graphStartY,
	// 	graphEndY,
	// });

	const range = useMemo(() => {
		return {
			x: {
				min: graphPoints[0]!.date,
				max: graphPoints[graphPoints.length - 1]!.date,
			},
			y: { min: -10, max: 15 },
		};
	}, [graphPoints]);

	const graphPath = useMemo(() => {
		const perf = performance.now();
		const result = createGraphPathBase({
			pointsInRange: graphPoints,
			range,
			horizontalPadding: 0,
			paddingTop: PADDING_TOP,
			paddingBottom: PADDING_BOTTOM,
			canvasHeight: height,
			canvasWidth: width,
		});
		console.log("createGraphPathBase", performance.now() - perf);
		return result;
	}, [width, graphHeight, range]);

	const zeroLineY = useDerivedValue(() => {
		return (
			getYInRange(height - PADDING_BOTTOM - PADDING_TOP, 0, range.y) +
			PADDING_TOP
		);
	});

	const currentFingerX = useSharedValue(-1000);

	const collumWidth = graphPath.points[1] ? graphPath.points[1].x : 1;

	//console.log(JSON.stringify(graphPath.points, null, 2));

	const findClosestCollum = useCallback(
		(x: number) => {
			"worklet";
			const points = graphPath.points;
			let left = 0;
			let right = points.length - 1;

			// Early exit for edge cases
			if (x <= points[left]!.x) return left;
			if (x >= points[right]!.x) return right;

			// Binary search with interpolation hint
			while (right - left > 1) {
				// Simplified termination condition
				// Can optionally use interpolation for initial guess
				// const mid = left + ((x - points[left].x) * (right - left)) / (points[right].x - points[left].x) | 0;
				const mid = (left + right) >>> 1; // Faster integer division by 2

				if (points[mid]!.x <= x) {
					left = mid;
				} else {
					right = mid;
				}
			}

			// Direct comparison of two remaining points
			return x - points[left]!.x <= points[right]!.x - x ? left : right;
		},
		[graphPath.points],
	);

	const panGesture = Gesture.Pan()
		.onStart((e) => {
			currentFingerX.value = e.x;
		})
		.onUpdate((e) => {
			currentFingerX.value = e.x;
		});

	const onLongPress = useMemo(() => {
		return Gesture.LongPress()
			.minDuration(100)
			.onStart((e) => {
				currentFingerX.value = e.x;
			});
	}, []);

	const currentPoint = useDerivedValue(() => {
		const collumIndex = findClosestCollum(currentFingerX.value);
		//console.log("currentValue", collumIndex, graphPath.points[collumIndex]);
		return graphPath.points[collumIndex] ?? null;
	});

	const currentDate = useDerivedValue(() => {
		const collumIndex = findClosestCollum(currentFingerX.value);
		const date = new Date(graphPath.points[collumIndex]!.date);
		return date.toDateString() + " " + date.toTimeString();
	});

	const currentLineX = useDerivedValue(() => {
		const collumIndex = findClosestCollum(currentFingerX.value);
		return graphPath.points[collumIndex]!.x;
	});

	const gesture = Gesture.Simultaneous(panGesture, onLongPress);

	const p2 = useDerivedValue(() => {
		return vec(currentLineX.value, height);
	});

	const p1 = useDerivedValue(() => {
		return vec(currentLineX.value, 0);
	});

	const warmRectPath = useDerivedValue(() => {
		return rect(0, 0, width, zeroLineY.value);
	});

	const coldRectPath = useDerivedValue(() => {
		return rect(0, zeroLineY.value, width, graphHeight);
	});

	const gradientColdStart = useDerivedValue(() => {
		return vec(0, zeroLineY.value);
	});

	const gradientColdEnd = useDerivedValue(() => {
		return vec(0, graphHeight);
	});

	const currentText = useDerivedValue(() => {
		const point = currentPoint.value;
		if (!point) return "";
		return `TEMP: ${point.value}°C RAIN: ${point.percipitation}mm SNOW: ${point.percipitationSnow}mm`;
	});

	return (
		<GestureDetector gesture={gesture}>
			<Canvas style={{ width: width, height: height }}>
				<Fill color={colors.background}></Fill>
				{graphPath.gradientPath && (
					<Group clip={graphPath.gradientPath}>
						<Rect
							x={0}
							y={0}
							width={width}
							height={graphPath.hasAnyNegativeValue ? zeroLineY : graphHeight}
							color={colors.warmBackground}
						/>
						{graphPath.hasAnyNegativeValue && (
							<Rect x={0} y={zeroLineY} width={width} height={graphHeight}>
								<LinearGradient
									start={gradientColdStart}
									end={gradientColdEnd}
									colors={[
										colors.cold1Background,
										colors.cold2Background,
										colors.cold3Background,
										colors.cold4Background,
										colors.cold5Background,
									]}
								/>
							</Rect>
						)}

						<Fill>
							<LinearGradient
								start={gradientColdEnd}
								end={vec(0, 0)}
								colors={["rgba(255,255,255, 0.5)", "#ffffff00"]}
								positions={[0, 0.2]}
							/>
						</Fill>
					</Group>
				)}

				<CloudLayer
					path={graphPath.cloudsHighPath}
					color={colors.cloudsHigh}
					yStart={CLOUDS_HIGH_Y_START}
				/>
				<CloudLayer
					path={graphPath.cloudsMidPath}
					color={colors.cloudsMid}
					yStart={CLOUDS_MID_Y_START}
				/>
				<CloudLayer
					path={graphPath.cloudsLowPath}
					color={colors.cloudsLow}
					yStart={CLOUDS_LOW_Y_START}
				/>

				<Group clip={warmRectPath}>
					<Path
						path={graphPath.path}
						strokeWidth={pathStrokeWidth}
						style="stroke"
						strokeJoin="round"
						strokeCap="round"
						color={colors.warm}
					/>
				</Group>

				<Group clip={coldRectPath}>
					<Path
						path={graphPath.path}
						strokeWidth={pathStrokeWidth}
						style="stroke"
						strokeJoin="round"
						strokeCap="round"
						color={colors.cold1}
					/>
				</Group>

				{graphPath.points
					.filter(({ isTrendChanging }) => isTrendChanging)
					.map((point) => (
						<Text
							key={`${point.x}-${point.y}`}
							x={point.x - 8.5}
							y={point.y - 8}
							color="black"
							font={font}
							text={point.value.toString()}
						/>
					))}

				{graphPath.points.map((point) => (
					<Line
						key={`${point.x}-${point.y}`}
						p1={vec(point.x, 0)}
						p2={vec(point.x, graphHeight)}
						color={colors.grid}
						strokeWidth={StyleSheet.hairlineWidth}
					/>
				))}

				<Text
					color="black"
					x={50}
					y={120}
					font={fontCurrent}
					text={currentText}
				/>
				<Text
					color="black"
					x={width / 2 - 100}
					y={140}
					font={fontCurrent}
					text={currentDate}
				/>
				{/* <Rect x={0} y={0} width={width} height={graphHeight}>
					<TwoPointConicalGradient
						start={vec(128, 200)}
						startR={60}
						end={vec(128, 16)}
						endR={60}
						colors={["#ffffff00", "#ffff0085"]}
					/>
				</Rect> */}

				<RainColumns
					points={graphPath.points}
					maxPrecipitation={graphPath.maxPrecipitation}
					graphHeight={graphHeight}
					columnWidth={collumWidth}
				/>

				<HourlyLegend
					points={graphPath.points}
					width={width}
					graphEndY={graphEndY}
					height={height}
				/>

				<Line p1={p1} p2={p2} color="#666666" strokeWidth={1} strokeMiter={5}>
					<DashPathEffect intervals={[4, 4]} />
				</Line>

				<WindLine
					windSpeedPath={graphPath.windSpeedPath}
					windSpeedClipPath={graphPath.windSpeedClipPath}
					windArrows={graphPath.windArrows}
				/>
			</Canvas>
		</GestureDetector>
	);
};
