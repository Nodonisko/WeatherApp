import React from "react";
import { Platform, StyleSheet } from "react-native";
import { Line, Text, vec, matchFont } from "@shopify/react-native-skia";
import { GraphPoint, PointWithValue } from "./crateGraphPath";

interface HourlyLegendProps {
	points: PointWithValue[];
	width: number;
	graphEndY: number;
	height: number;
	colors: {
		legendLine: string;
	};
}

const LEGEND_SMALL_LINE_HEIGHT = 8;
const LEGENT_MEDIUM_LINE_HEIGHT = 16;
const LEGENT_LARGE_LINE_HEIGHT = 36;
const LEGEND_FONT_SIZE = 12;

const fontFamily = Platform.select({
	ios: "Helvetica Neue",
	android: "sans-serif-medium",
});

const fontLegend = matchFont({
	fontFamily,
	fontSize: LEGEND_FONT_SIZE,
});

export const HourlyLegend = ({
	points,
	width,
	graphEndY,
	height,
	colors,
}: HourlyLegendProps) => {
	return (
		<>
			<Line
				p1={vec(0, graphEndY)}
				p2={vec(width, graphEndY)}
				color={colors.legendLine}
				strokeWidth={StyleSheet.hairlineWidth}
			/>
			{points.map((point) => {
				const pointDate = new Date(point.date);
				const pointHours = pointDate.getHours();
				const isMidnight = pointHours === 0;
				const isQuater = pointHours % 6 === 0;

				let hourText = null;
				let extraText = null;
				let lineHeight = LEGEND_SMALL_LINE_HEIGHT;
				let lineWidth = StyleSheet.hairlineWidth;
				if (isMidnight) {
					lineHeight = LEGENT_LARGE_LINE_HEIGHT;
					hourText = pointHours.toString();
					lineWidth = 1;
					extraText = pointDate.toDateString().split(" ")[0];
				} else if (isQuater) {
					lineHeight = LEGENT_MEDIUM_LINE_HEIGHT;
					hourText = pointHours.toString();
				}

				return (
					<React.Fragment key={`${point.x}-${point.y}-${point.date}`}>
						<Line
							p1={vec(point.x, graphEndY)}
							p2={vec(point.x, graphEndY + lineHeight)}
							color={colors.legendLine}
							strokeWidth={lineWidth}
						/>
						{hourText && (
							<Text
								x={point.x + 3}
								y={graphEndY + LEGEND_SMALL_LINE_HEIGHT + LEGEND_FONT_SIZE}
								color="black"
								font={fontLegend}
								text={hourText}
							/>
						)}
						{extraText && (
							<Text
								x={point.x + 3}
								y={graphEndY + LEGEND_SMALL_LINE_HEIGHT + LEGEND_FONT_SIZE * 2}
								color="black"
								font={fontLegend}
								text={extraText}
							/>
						)}
					</React.Fragment>
				);
			})}
			<Line
				p1={vec(0, height - 1)}
				p2={vec(width, height - 1)}
				color={colors.legendLine}
				strokeWidth={StyleSheet.hairlineWidth}
			/>
		</>
	);
};
