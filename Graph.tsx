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
} from "@shopify/react-native-skia";
import { GraphPoint, createGraphPathBase } from "./src/graph/crateGraphPath";
import { fetchWeather } from "./src/weatherApi/weatherApi";
import lysa from "./lysa.json";
import { Platform, StyleSheet } from "react-native";
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

import { listFontFamilies } from "@shopify/react-native-skia";

console.log(listFontFamilies());

const graphPoints: GraphPoint[] = lysa.hourly.map((hour) => ({
	value: hour.temp,
	date: new Date(hour.dt * 1000),
}));

console.log(graphPoints);

interface GraphProps {
	width?: number;
	height?: number;
}
export const Graph: React.FC<GraphProps> = ({ width = 800, height = 400 }) => {
	console.log("Graph dimensions:", { width, height });

	const perf = performance.now();
	const graphPath = useMemo(() => {
		return createGraphPathBase({
			pointsInRange: graphPoints,
			range: {
				x: {
					min: graphPoints[0].date,
					max: graphPoints[graphPoints.length - 1].date,
				},
				y: { min: 0, max: 100 },
			},
			horizontalPadding: 0,
			verticalPadding: 0,
			canvasHeight: height,
			canvasWidth: width,
			shouldFillGradient: true,
		});
	}, [width, height]);
	console.log("Graph path created in", performance.now() - perf, "ms");

	const currentFingerX = useSharedValue(-1000);
	const isPanLineVisible = useSharedValue(true);

	const collumWidth = graphPath.points[1] ? graphPath.points[1].x : 1;
	console.log(graphPath.points[1]);
	console.log("collumWidth", collumWidth);

	console.log(JSON.stringify(graphPath.points, null, 2));

	const collumsX = useDerivedValue(() => {
		return graphPath.points.map((point) => point.x);
	});

	const findClosestCollum = (x: number) => {
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
	};

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

	const currentValue = useDerivedValue(() => {
		const collumIndex = findClosestCollum(currentFingerX.value);
		//console.log("currentValue", collumIndex, graphPath.points[collumIndex]);
		return graphPath.points[collumIndex]?.value.toFixed(1) ?? "N/A";
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
		default: "serif",
	});

	const font = matchFont({
		fontFamily,
		fontSize: 6,
	});
	const fontCurrent = matchFont({
		fontFamily: "Helvetica",
		fontSize: 18,
	});

	return (
		<GestureDetector gesture={gesture}>
			<Canvas style={{ width: width, height: height }}>
				{/* <Path
					path={graphPath.pathPositive}
					strokeWidth={1}
					style="stroke"
					strokeJoin="round"
					strokeCap="round"
					color="red"
				/>

				<Path
					path={graphPath.pathNegative}
					strokeWidth={1}
					style="stroke"
					strokeJoin="round"
					strokeCap="round"
					color="blue"
				/> */}

				<Group clip={graphPath.pathPositiveGradient}>
					<Rect x={100} y={100} width={50} height={50}>
						<LinearGradient
							start={vec(0, 0)}
							end={vec(0, height)}
							colors={["red", "white"]}
							positions={[0.5, 1]}
						/>
					</Rect>
				</Group>

				{graphPath.pathPositiveGradient && (
					<Path path={graphPath.pathPositiveGradient} style="fill">
						<LinearGradient
							start={vec(0, 0)}
							end={vec(0, height)}
							colors={["red", "white"]}
							positions={[0.5, 1]}
						/>
					</Path>
				)}

				{graphPath.pathNegativeGradient && (
					<Path
						path={graphPath.pathNegativeGradient}
						style="fill"
						color="#25afff"
						antiAlias={true}
						dither={true}
					>
						<LinearGradient
							start={vec(0, 0)}
							end={vec(0, height)}
							colors={["#25afff", "white"]}
							positions={[0.5, 1]}
						/>
					</Path>
				)}

				<Line
					p1={vec(0, height / 2)}
					p2={vec(width, height / 2)}
					color="#666666"
					strokeWidth={StyleSheet.hairlineWidth}
				>
					<DashPathEffect intervals={[4, 4]} />
				</Line>

				{graphPath.points.map((point) => (
					<Text
						key={`${point.x}-${point.y}`}
						x={point.x}
						y={point.y - 5}
						color="black"
						font={font}
						text={point.value.toFixed(1).toString()}
					/>
				))}

				{graphPath.points.map((point) => (
					<Line
						key={`${point.x}-${point.y}`}
						p1={vec(point.x, 0)}
						p2={vec(point.x, height)}
						color="rgba(0,0,0,0.1)"
						strokeWidth={StyleSheet.hairlineWidth}
					/>
				))}

				<Line p1={p1} p2={p2} color="#666666" strokeWidth={1} strokeMiter={5}>
					<DashPathEffect intervals={[4, 4]} />
				</Line>
				<Text
					color="black"
					x={width / 2}
					y={50}
					font={fontCurrent}
					text={currentValue}
				/>
			</Canvas>
		</GestureDetector>
	);
};
