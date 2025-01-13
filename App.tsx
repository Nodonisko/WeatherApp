import { SystemBars } from "react-native-edge-to-edge";
import {
	StyleSheet,
	Text,
	View,
	Button,
	useColorScheme,
	Dimensions,
} from "react-native";
import { Graph } from "./src/graph/Graph";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useState } from "react";
// import { run as benchmarkClosestColumn } from "./benchmarks/benchmarkClosestColumn";
// import { run as benchmarkRound } from "./benchmarks/benchmarkRound";
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

// setTimeout(() => {
// 	// benchmarkClosestColumn();
// 	benchmarkRound();
// }, 5000);

export default function App() {
	const [render, setRender] = useState(0);
	return (
		<GestureHandlerRootView style={[styles.container]}>
			{/* <Button title="Render" onPress={() => setRender(render + 1)} /> */}

			<Graph width={screenWidth} height={screenHeight * 0.7} />
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "flex-end",
	},
});
