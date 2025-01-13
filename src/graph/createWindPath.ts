import { Skia, SkPath } from "@shopify/react-native-skia";
import { PointWithValue } from "./crateGraphPath";

const WIND_SPEED_RANGE = {
	min: 0,
	max: 25,
};

interface WindPathConfig {
	points: PointWithValue[];
	height: number;
	width: number;
	paddingTop: number;
	paddingBottom: number;
}

interface ArrowPosition {
	x: number;
	y: number;
	direction: number;
}

interface WindPath {
	speedPath: SkPath;
	arrowPositions: ArrowPosition[];
}

export function createWindPath({
	points,
	height,
	width,
	paddingTop,
	paddingBottom,
}: WindPathConfig): WindPath {
	const drawingHeight = height - paddingTop - paddingBottom;
	const speedPath = Skia.Path.Make();
	const arrowPositions: ArrowPosition[] = [];

	// Dash pattern values (should match the ones used in Graph.tsx)
	const dashLength = 15;
	const gapLength = 10;
	const patternLength = dashLength + gapLength;

	let currentPathLength = 0;
	let lastX = 0;
	let lastY = 0;

	points.forEach((point, index) => {
		const y = Math.min(
			Math.max(
				drawingHeight *
					(1 -
						Math.min(point.windSpeed, WIND_SPEED_RANGE.max) /
							WIND_SPEED_RANGE.max) +
					paddingTop,
				paddingTop,
			),
			height - paddingBottom,
		);
	});

	return {
		speedPath,
		arrowPositions,
	};
}
