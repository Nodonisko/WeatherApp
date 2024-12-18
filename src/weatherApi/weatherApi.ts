const exclude = "minutely";

const apiKey = process.env.EXPO_PUBLIC_OPEN_WEATHER_API_KEY;
const units = "metric";

export const fetchWeather = async (lat: number, lon: number) => {
	const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=${exclude}&appid=${apiKey}&units=${units}`;
	console.log(url);
	const response = await fetch(url);
	const data = await response.json();
	return data;
};
