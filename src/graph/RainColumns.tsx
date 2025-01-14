import React from "react";
import { StyleSheet } from "react-native";
import { RoundedRect } from "@shopify/react-native-skia";
import { colors } from "../colors";
import { GraphPoint, PointWithValue } from "./crateGraphPath";

// Helper function moved from Graph.tsx
const getPrecipitationScale = (maxPrecipitation: number) => {
	console.log("maxPrecipitation", maxPrecipitation);
	if (maxPrecipitation <= 1) return 60;

	const safeMax = Math.max(maxPrecipitation, 0.1);
	const baseScale = 75;
	const decayFactor = 1;
	return baseScale / Math.pow(safeMax, 1 / decayFactor);
};

interface RainColumnsProps {
	points: PointWithValue[];
	maxPrecipitation: number;
	graphHeight: number;
	columnWidth: number;
}

export const RainColumns: React.FC<RainColumnsProps> = ({
	points,
	maxPrecipitation,
	graphHeight,
	columnWidth,
}) => {
	return (
		<>
			{points.map(({ percipitation, percipitationSnow, x }) => {
				if (percipitation > 0) {
					const precipitationHeight =
						percipitation * getPrecipitationScale(maxPrecipitation);
					const precipitationSnowHeight =
						percipitationSnow * getPrecipitationScale(maxPrecipitation);
					const columnX = x + StyleSheet.hairlineWidth;
					const width = columnWidth - StyleSheet.hairlineWidth * 2;

					return (
						<React.Fragment key={`${x}-${percipitation}`}>
							<RoundedRect
								x={columnX}
								y={graphHeight - precipitationHeight}
								r={2}
								width={width}
								height={precipitationHeight}
								color={colors.rainColumn}
							/>
							{precipitationSnowHeight > 0 && (
								<RoundedRect
									x={columnX}
									y={graphHeight - precipitationSnowHeight}
									r={2}
									width={width}
									height={precipitationSnowHeight}
									color={colors.snowColumn}
								/>
							)}
						</React.Fragment>
					);
				}
				return null;
			})}
		</>
	);
};
