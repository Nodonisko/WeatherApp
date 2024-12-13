import { SystemBars } from "react-native-edge-to-edge";
import { StyleSheet, Text, View, Button, useColorScheme } from "react-native";

export default function App() {
  const handlePress = () => {
    console.log("Button pressed!");
    SystemBars.pushStackEntry({style:"dark"});
  }
  const colorScheme = useColorScheme();
const backgroundColor = colorScheme === "dark" ? "#000" : "#fff";

	return (
		<View style={[styles.container, {backgroundColor}]  }>
			<Text>Open up App.tsx to start working on your app!</Text>
			<SystemBars style="auto" />
			<Button title="Press me" onPress={handlePress} />
		</View>
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
