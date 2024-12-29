type Task = {
	name: string;
	fn: () => void;
};

type TaskResult = {
	name: string;
	latencyAverageNs: number;
	latencyMedianNs: number;
	throughputAverageOps: number;
	throughputMedianOps: number;
	samples: number;
	latencyArrayNs: number[];
};

function median(arr: number[]): number {
	const sorted = [...arr].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	if (sorted.length % 2 !== 0) {
		return sorted[mid]!;
	}
	return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function average(arr: number[]): number {
	return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export class Bench {
	private tasks: Task[] = [];
	private iterations: number = 100;
	private results: TaskResult[] = [];
	private pauseDuration: number = 100; // milliseconds

	setIterations(iterations: number) {
		this.iterations = iterations;
		return this;
	}

	setPauseDuration(ms: number) {
		this.pauseDuration = ms;
		return this;
	}

	add(name: string, fn: () => void) {
		this.tasks.push({ name, fn });
		return this;
	}

	async run() {
		this.results = [];
		for (const task of this.tasks) {
			const latenciesNs: number[] = [];

			for (let i = 0; i < this.iterations; i++) {
				const start = performance.now();
				task.fn();
				const end = performance.now();
				const diffMs = end - start; // milliseconds
				const diffNs = diffMs * 1e6; // convert ms to ns
				latenciesNs.push(diffNs);
			}

			const latencyAvg = average(latenciesNs);
			const latencyMed = median(latenciesNs);

			// Convert latency (ns) to throughput (ops/s)
			// latencyAvg ns -> seconds = latencyAvg * 1e-9
			const throughputAvg = 1 / (latencyAvg * 1e-9);
			const throughputMed = 1 / (latencyMed * 1e-9);

			this.results.push({
				name: task.name,
				latencyAverageNs: latencyAvg,
				latencyMedianNs: latencyMed,
				throughputAverageOps: throughputAvg,
				throughputMedianOps: throughputMed,
				samples: latenciesNs.length,
				latencyArrayNs: latenciesNs,
			});

			// Pause to allow GC or system to settle
			if (this.pauseDuration > 0) {
				await new Promise((resolve) => setTimeout(resolve, this.pauseDuration));
			}
		}
	}

	table() {
		return this.results.map((r, index) => {
			// Compute standard deviation for average latency
			const avg = r.latencyAverageNs;
			const variance =
				r.latencyArrayNs.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) /
				r.latencyArrayNs.length;
			const stdDev = Math.sqrt(variance);
			const stdDevPercent = (stdDev / avg) * 100;

			// Compute standard deviation for throughput
			const throughputs = r.latencyArrayNs.map((l) => 1 / (l * 1e-9));
			const thrAvg = r.throughputAverageOps;
			const thrVar =
				throughputs.reduce((acc, val) => acc + Math.pow(val - thrAvg, 2), 0) /
				throughputs.length;
			const thrStdDev = Math.sqrt(thrVar);
			const thrStdDevPercent = (thrStdDev / thrAvg) * 100;

			return {
				"#": index,
				"Task name": r.name,
				"Latency average (ns)": `${r.latencyAverageNs.toFixed(2)} ± ${stdDevPercent.toFixed(2)}%`,
				"Latency median (ns)": r.latencyMedianNs.toFixed(2),
				"Throughput average (ops/s)": `${r.throughputAverageOps.toFixed(2)} ± ${thrStdDevPercent.toFixed(2)}%`,
				"Throughput median (ops/s)": r.throughputMedianOps.toFixed(2),
				Samples: r.samples,
			};
		});
	}
}
