import { SystemBars } from "react-native-edge-to-edge";
import { StyleSheet, Text, View, Button, useColorScheme } from "react-native";
import { Graph } from "./Graph";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  const handlePress = () => {
    console.log("Button pressed!");
    SystemBars.pushStackEntry({style:"dark"});
  }
  const colorScheme = useColorScheme();
const backgroundColor = colorScheme === "dark" ? "#000" : "#fff";

	return (
		<GestureHandlerRootView>
			<View style={[styles.container, {backgroundColor}]  }>
				<Graph />
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
