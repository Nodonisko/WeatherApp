import { Bench } from "./benchmarkLib";
import { createGraphPathBase } from "../src/graph/crateGraphPath";
import { graphPoints } from "../src/graph/Graph";

const config = {
	pointsInRange: graphPoints,
	range: {
		x: {
			min: graphPoints[0]!.date,
			max: graphPoints[graphPoints.length - 1]!.date,
		},
		y: { min: -10, max: 15 },
	},
	horizontalPadding: 0,
	paddingTop: 10,
	paddingBottom: 30,
	canvasHeight: 800,
	canvasWidth: 400,
};

const bench = new Bench();

bench.setIterations(10000).add("createGraphPath", () => {
	createGraphPathBase(config);
});

export const run = async () => {
	await bench.run();
	console.log("Round decimals");
	console.log(bench.table());
};
