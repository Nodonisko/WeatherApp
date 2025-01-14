import { Skia, Path, Group, SkPath } from "@shopify/react-native-skia";
import React from "react";
import { WindArrow } from "./crateGraphPath";
import { colors } from "../colors";

export const WIND_ARROW_HEIGHT = 12;
export const WIND_ARROW_WIDTH = 8;

const drawWindArrow = () => {
	const path = Skia.Path.Make();

	path.moveTo(WIND_ARROW_WIDTH / 2, 0);
	path.lineTo(0, WIND_ARROW_HEIGHT);
	path.lineTo(WIND_ARROW_WIDTH / 2, WIND_ARROW_HEIGHT * 0.65);
	path.lineTo(WIND_ARROW_WIDTH, WIND_ARROW_HEIGHT);
	path.close();

	return path;
};

export const windArrowPath = drawWindArrow();

interface WindLineProps {
	windSpeedPath?: SkPath;
	windSpeedClipPath?: SkPath;
	windArrows: WindArrow[];
}

export const WindLine: React.FC<WindLineProps> = ({
	windSpeedPath,
	windSpeedClipPath,
	windArrows,
}) => {
	return (
		<Group>
			{windSpeedPath && (
				<Group clip={windSpeedClipPath} invertClip>
					<Path
						path={windSpeedPath}
						strokeWidth={1}
						style="stroke"
						strokeJoin="round"
						strokeCap="round"
						color={colors.windLine}
					/>
				</Group>
			)}
			{windArrows
				.filter((_, index) => index % 3 !== 0 && index % 3 !== 1)
				.map((arrow, index) => (
					<Group
						key={`wind-arrow-${index}`}
						transform={[
							{ translateX: arrow.point.x },
							{ translateY: arrow.point.y },
							{ rotate: arrow.direction },
							{ translateX: -WIND_ARROW_WIDTH / 2 },
							{ translateY: -WIND_ARROW_HEIGHT / 2 },
						]}
					>
						<Path path={windArrowPath} color={colors.windArrow} style="fill" />
					</Group>
				))}
		</Group>
	);
};
