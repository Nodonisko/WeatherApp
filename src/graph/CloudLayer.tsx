import React from "react";
import { Group, Path, SkPath } from "@shopify/react-native-skia";

interface CloudLayerProps {
	path: SkPath;
	color: string;
	yStart: number;
}

export const CloudLayer: React.FC<CloudLayerProps> = ({
	path,
	color,
	yStart,
}) => {
	return (
		<>
			<Path path={path} color={color} strokeWidth={1} />
			<Group origin={{ x: 0, y: yStart }} transform={[{ rotateX: Math.PI }]}>
				<Path path={path} color={color} strokeWidth={1} />
			</Group>
		</>
	);
};
