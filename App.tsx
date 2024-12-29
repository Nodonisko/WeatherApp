import { SystemBars } from "react-native-edge-to-edge";
import {
	StyleSheet,
	Text,
	View,
	Button,
	useColorScheme,
	Dimensions,
} from "react-native";
import { Graph } from "./Graph";
import { GestureHandlerRootView } from "react-native-gesture-handler";
// import { run as benchmarkClosestColumn } from "./benchmarks/benchmarkClosestColumn";
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

// setTimeout(() => {
// 	benchmarkClosestColumn();
// }, 5000);

export default function App() {
	const handlePress = () => {
		console.log("Button pressed!");
		SystemBars.pushStackEntry({ style: "dark" });
	};
	const colorScheme = useColorScheme();
	const backgroundColor = colorScheme === "dark" ? "#000" : "#fff";

	return (
		<GestureHandlerRootView>
			<View style={[styles.container, { backgroundColor }]}>
				<View
					style={{
						width: screenWidth,
						height: screenHeight * 0.5, // 50% of screen height
						backgroundColor: "white",
					}}
				>
					<Graph width={screenWidth} height={screenHeight * 0.5} />
				</View>
			</View>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center",
	},
});
