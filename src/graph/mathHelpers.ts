export const roundTo2Decimals = (num: number): number => {
	return Math.round(num * 100) / 100;
};

export const roundTo1Decimals = (num: number): number => {
	return Math.round(num * 10) / 10;
};
