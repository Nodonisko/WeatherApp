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
} from "@shopify/react-native-skia";
import { GraphPoint, createGraphPathBase, getYInRange } from "./crateGraphPath";
import { fetchWeather } from "../weatherApi/weatherApi";
import olomouc from "../../fixtures/olomouc.json";
import { Platform, StyleSheet } from "react-native";
import { HourlyLegend } from "./HourlyLegend";
import { roundTo1Decimals } from "./mathHelpers";
// const graphPoints: GraphPoint[] = new Array(100).fill(0).map((_, index) => {
// 	const v = Math.random() * 100;
// 	const value = v > 50 ? v : v * -1;
// 	return {
// 		value,
// 		date: new Date(Date.now() - index * 1000 * 60 * 60 * 24),
// 	};
// });

// olomouc coordinates
//fetchWeather(49.5966, 17.25)
// fetchWeather(49.5459889, 18.4474875)
// 	.then((data) => {
// 		console.log(JSON.stringify(data, null, 2));
// 		console.log(data);
// 	})
// 	.catch((error) => {
// 		console.error(error);
// 	});

// console.log(listFontFamilies());

const colors = {
	cold1: "rgba(37,175,255, 1)",
	cold2: "rgba(37,159,255, 1)",
	cold3: "rgba(37,143,255, 1)",
	cold4: "rgba(37,127,255, 1)",
	cold5: "rgba(37,111,255, 1)",

	cold1Background: "rgba(37,175,255, 0.6)",
	cold2Background: "rgba(37,159,255, 0.6)",
	cold3Background: "rgba(37,143,255, 0.65)",
	cold4Background: "rgba(37,127,255, 0.70)",
	cold5Background: "rgba(37,111,255, 0.75)",

	cold5BackgroundTransparent01: "rgba(37,111,255, 0.1)",
	cold5BackgroundTransparent02: "rgba(37,111,255, 0.2)",
	cold5BackgroundTransparent03: "rgba(37,111,255, 0.3)",
	cold5BackgroundTransparent04: "rgba(37,111,255, 0.4)",
	cold5BackgroundTransparent05: "rgba(37,111,255, 0.5)",

	rainColumn: "rgba(37,175,255, 1)",
	snowColumn: "rgba(255,255,255, 1)",

	warm: "rgba(244,153,57, 1)",
	warmBackground: "rgba(244,153,57, 0.75)",

	background: "#ffffff",
	grid: "rgba(0,0,0,0.1)",

	legendLine: "rgba(0,0,0,0.3)",
};

const pathStrokeWidth = 1;

const LEGEND_HEIGHT = 36;

const olomoucDate = new Date(olomouc.forecastTimeIso);
const graphPoints: GraphPoint[] = olomouc.parameterValues.TEMPERATURE.map(
	(temp, index) => ({
		value: roundTo1Decimals(temp),
		percipitation: roundTo1Decimals(
			olomouc.parameterValues.PRECIPITATION_TOTAL[index]!,
		),
		percipitationSnow: roundTo1Decimals(
			olomouc.parameterValues.PRECIPITATION_SNOW[index]!,
		),
		// every hour from olomoucDate
		date: new Date(olomoucDate.getTime() + index * 1000 * 60 * 60),
	}),
);

console.log(graphPoints);

const getPrecipationScale = (maxPrecipitation: number) => {
	// const safeMax = Math.max(maxPrecipitation, 0.1);
	// const baseScale = 70; // maximum scale for minimal precipitation
	// const decayFactor = 1; // controls how quickly the scale decreases
	// return baseScale / Math.pow(safeMax, 1 / decayFactor);

	if (maxPrecipitation <= 1) return 100;
	if (maxPrecipitation <= 5) return 25;
	if (maxPrecipitation <= 10) return 14;
	if (maxPrecipitation <= 15) return 10;
	if (maxPrecipitation <= 20) return 8;
	if (maxPrecipitation <= 30) return 6;
	if (maxPrecipitation <= 40) return 5;
	if (maxPrecipitation <= 50) return 4;

	return 3;
};

interface GraphProps {
	width?: number;
	height?: number;
}

export const Graph: React.FC<GraphProps> = ({ width = 800, height = 600 }) => {
	const graphHeight = height - LEGEND_HEIGHT;
	const graphStartY = 0;
	const graphEndY = graphHeight;
	// console.log("Graph dimensions:", {
	// 	width,
	// 	height,
	// 	graphHeight,
	// 	graphStartY,
	// 	graphEndY,
	// });

	const perf = performance.now();
	const range = useMemo(() => {
		return {
			x: {
				min: graphPoints[0]!.date,
				max: graphPoints[graphPoints.length - 1]!.date,
			},
			y: { min: -15, max: 20 },
		};
	}, [graphPoints]);

	const graphPath = useMemo(() => {
		return createGraphPathBase({
			pointsInRange: graphPoints,
			range,
			horizontalPadding: 0,
			verticalPadding: 0,
			canvasHeight: graphHeight,
			canvasWidth: width,
			shouldFillGradient: true,
		});
	}, [width, graphHeight, range]);

	console.log("maxPrecipitation", graphPath.maxPrecipitation);

	const zeroLineY = useDerivedValue(() => {
		return getYInRange(graphHeight, 0, range.y);
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

	const onLongPress = Gesture.LongPress()
		.minDuration(100)
		.onStart((e) => {
			currentFingerX.value = e.x;
		});

	const currentPoint = useDerivedValue(() => {
		const collumIndex = findClosestCollum(currentFingerX.value);
		//console.log("currentValue", collumIndex, graphPath.points[collumIndex]);
		return graphPath.points[collumIndex] ?? null;
	});

	const currentDate = useDerivedValue(() => {
		const collumIndex = findClosestCollum(currentFingerX.value);
		return new Date(graphPath.points[collumIndex]!.date).toISOString();
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
				<Group clip={graphPath.gradientPath}>
					<Rect
						x={0}
						y={0}
						width={width}
						height={graphPath.hasAnyNegativeValue ? zeroLineY : graphHeight}
						color={colors.warmBackground}
					></Rect>
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
							colors={[colors.cold5BackgroundTransparent01, "#ffffff00"]}
							positions={[0, 0.25]}
						/>
					</Fill>
				</Group>

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

				{/* <Line
					p1={zeroLineP1}
					p2={zeroLineP2}
					color="#666666"
					strokeWidth={StyleSheet.hairlineWidth}
				>
					<DashPathEffect intervals={[4, 4]} />
				</Line> */}

				{graphPath.points
					.filter(({ isTrendChanging }) => isTrendChanging)
					.map((point) => (
						<Text
							key={`${point.x}-${point.y}`}
							x={point.x - 13}
							y={point.y - 8}
							color="black"
							font={font}
							text={point.value.toFixed(1).toString()}
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
					y={50}
					font={fontCurrent}
					text={currentText}
				/>
				<Text
					color="black"
					x={width / 2 - 100}
					y={70}
					font={fontCurrent}
					text={currentDate}
				/>
				<Rect x={0} y={0} width={width} height={graphHeight}>
					<TwoPointConicalGradient
						start={vec(128, 200)}
						startR={60}
						end={vec(128, 16)}
						endR={60}
						colors={["#ffffff00", "#ffff0085"]}
					/>
				</Rect>

				{graphPath.points.map(
					({ percipitation, percipitationSnow, ...point }) => {
						if (percipitation > 0) {
							const percipitationHeight =
								percipitation * getPrecipationScale(graphPath.maxPrecipitation);
							const percipitationSnowHeight =
								percipitationSnow *
								getPrecipationScale(graphPath.maxPrecipitation);
							return (
								<React.Fragment key={`${point.x}-${point.y}-${percipitation}`}>
									<RoundedRect
										x={point.x}
										y={graphHeight - percipitationHeight}
										r={2}
										width={collumWidth - 1}
										height={percipitationHeight}
										color={colors.rainColumn}
									/>
									{percipitationSnow > 0 && (
										<RoundedRect
											x={point.x}
											y={graphHeight - percipitationSnowHeight}
											r={2}
											width={collumWidth - 1}
											height={percipitationSnowHeight}
											color={colors.snowColumn}
										/>
									)}
								</React.Fragment>
							);
						}
						return null;
					},
				)}

				<HourlyLegend
					points={graphPath.points}
					width={width}
					graphEndY={graphEndY}
					height={height}
					colors={colors}
				/>

				<Line p1={p1} p2={p2} color="#666666" strokeWidth={1} strokeMiter={5}>
					<DashPathEffect intervals={[4, 4]} />
				</Line>
			</Canvas>
		</GestureDetector>
	);
};
