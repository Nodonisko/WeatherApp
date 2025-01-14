import React from "react";
import { Platform, StyleSheet } from "react-native";
import { Line, Text, vec, matchFont, Path } from "@shopify/react-native-skia";
import { PointWithValue } from "./crateGraphPath";
import { colors } from "../colors";

interface HourlyLegendProps {
	points: PointWithValue[];
	width: number;
	graphEndY: number;
	height: number;
}

const LEGEND_SMALL_LINE_HEIGHT = 8;
const LEGENT_MEDIUM_LINE_HEIGHT = 16;
const LEGENT_LARGE_LINE_HEIGHT = 36;
const LEGEND_FONT_SIZE = 12;
const NOW_MARKER_SIZE = 8;

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
				const now = new Date();
				const pointDate = new Date(point.date);
				const pointHours = pointDate.getHours();
				const isMidnight = pointHours === 0;
				const isQuater = pointHours % 6 === 0;
				const isNow =
					pointDate.getUTCHours() === now.getUTCHours() &&
					pointDate.getUTCDate() === now.getUTCDate();

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
						{isNow && (
							<Path
								path={`M ${point.x} ${graphEndY} L ${
									point.x - NOW_MARKER_SIZE / 2
								} ${graphEndY + NOW_MARKER_SIZE} L ${
									point.x + NOW_MARKER_SIZE / 2
								} ${graphEndY + NOW_MARKER_SIZE} Z`}
								color={colors.legendLineNow}
							/>
						)}
					</React.Fragment>
				);
			})}
		</>
	);
};
