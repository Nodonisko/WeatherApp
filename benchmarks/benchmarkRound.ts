import { Bench } from "./benchmarkLib";

const bench = new Bench();

const roundDecimals1 = (num: number, decimals: number): number => {
	return Math.round(num * 10 ** decimals) / 10 ** decimals;
};

const roundDecimals2 = (num: number, decimals: number): number => {
	return Number(num.toFixed(decimals));
};

const roundDecimals3 = (num: number, decimals: number): number => {
	return +num.toFixed(decimals);
};

const roundTo2Decimals = (num: number): number => {
	return Math.round(num * 100) / 100;
};

bench
	.setIterations(1000000)
	.add("roundDecimals1", () => {
		roundDecimals1(1.23456, 2);
	})
	.add("roundDecimals2", () => {
		roundDecimals2(1.23456, 2);
	})
	.add("roundDecimals3", () => {
		roundDecimals3(1.23456, 2);
	})
	.add("roundTo2Decimals", () => {
		roundTo2Decimals(1.23456);
	});

export const run = async () => {
	await bench.run();
	console.log("Round decimals");
	console.log(bench.table());
};
