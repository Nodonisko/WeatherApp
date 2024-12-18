import React, { useMemo } from "react";

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
} from "@shopify/react-native-skia";
import { GraphPoint, createGraphPathBase } from "./src/graph/crateGraphPath";
import { fetchWeather } from "./src/weatherApi/weatherApi";
import lysa from "./lysa.json";
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

	const currentLineX = useSharedValue(-1000);
	const isPanLineVisible = useSharedValue(true);

	const panGesture = Gesture.Pan()
		.onStart((e) => {
			currentLineX.value = e.x;
		})
		.onUpdate((e) => {
			currentLineX.value = e.x;
		});

	const p2 = useDerivedValue(() => {
		return vec(currentLineX.value, height);
	});

	const p1 = useDerivedValue(() => {
		return vec(currentLineX.value, 0);
	});

	const path = useMemo(() => {
		return Skia.Path.MakeFromSVGString(`
            M0,${height * 0.75} 
           C${width * 0.25},${height * 0.7} 
              ${width * 0.375},${height * 0.25} 
              ${width * 0.5},${height * 0.375} 
             S${width * 0.75},${height * 0.625} 
                ${width},${height * 0.5}
                `)!;
	}, [width, height]);

	return (
		<GestureDetector gesture={panGesture}>
			<Canvas style={{ width: width, height: height }}>
				<Path
					path={graphPath.gradientPath}
					strokeWidth={2}
					style="fill"
					strokeJoin="round"
					strokeCap="round"
				></Path>

				{/* {graphPath.gradientPath && (
					<Path path={graphPath.gradientPath} style="fill">
						<LinearGradient
							start={vec(0, 0)}
							end={vec(0, height)}
							colors={["red", "white"]}
							//positions={positions}
						/>
					</Path>
				)} */}

				{/* Curve line only */}
				{/* <Path path={path} style="stroke" color="red" strokeWidth={2} /> */}

				{/* Pan gesture line */}
				<Line p1={p1} p2={p2} color="#666666" strokeWidth={1} strokeMiter={5}>
					<DashPathEffect intervals={[4, 4]} />
				</Line>
			</Canvas>
		</GestureDetector>
	);
};
