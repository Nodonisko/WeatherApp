import React from "react";
import Svg, {
	Defs,
	LinearGradient,
	Stop,
	Pattern,
	Path,
	Rect,
} from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	useSharedValue,
	withTiming,
	useAnimatedStyle,
} from "react-native-reanimated";

interface GraphProps {
	width?: number;
	height?: number;
}

export const Graph: React.FC<GraphProps> = ({ width = 800, height = 400 }) => {
	const currentTranslationX = useSharedValue(0);
	const isPanLineVisible = useSharedValue(true);

	const panGesture = Gesture.Pan()
		.onStart((e) => {
			isPanLineVisible.value = true;
			currentTranslationX.value = e.translationX;
		})
		.onUpdate((e) => {
			currentTranslationX.value = e.translationX;
		})
		.onEnd((e) => {
			isPanLineVisible.value = false;
		});

	return (
		<GestureDetector gesture={panGesture}>
			<Svg width={width} height={height}>
				{/* Define the gradient and patterns */}
				<Defs>
				<LinearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
					<Stop offset="0%" stopColor="#4facfe" stopOpacity="0.8" />
					<Stop offset="100%" stopColor="#00f2fe" stopOpacity="0.2" />
				</LinearGradient>

				<Pattern id="grid" width={80} height={80} patternUnits="userSpaceOnUse">
					<Path
						d="M 80 0 L 0 0 0 80"
						fill="none"
						stroke="#e6e6e6"
						strokeWidth="1"
					/>
				</Pattern>
			</Defs>

			{/* Background */}
			<Rect width="100%" height="100%" fill="#ffffff" />

			{/* Grid */}
			<Rect width="100%" height="100%" fill="url(#grid)" />

			{/* Gradient filled area */}
			<Path
				d="M0,300 
           C200,280 
             300,100 
             400,150 
             S600,250 
               800,200
           L800,400 
           L0,400 
           Z"
				fill="url(#areaGradient)"
			/>

			{/* Curve line only */}
			<Path
				d="M0,300 
           C200,280 
             300,100 
             400,150 
             S600,250 
               800,200"
				fill="none"
				stroke="red"
				strokeWidth="2"
			/>

			{/* Add dashed line in the middle */}
			<Path
				d={`M${width / 2},0 L${width / 2},${height}`}
				stroke="#666666"
				strokeWidth="1"
					strokeDasharray="5,5"
				/>
			</Svg>
		</GestureDetector>
	);
};
