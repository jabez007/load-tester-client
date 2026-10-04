import fs from "fs";
import type { Argv, Arguments } from "yargs";

export function outputArgv(cli: Argv): Argv {
    return cli
        .option('output', {
            alias: 'o',
            describe: 'Filename to write response statistics to. Defaults to hostname from service URL',
            global: true,
        })
}

const stats = {
    success: new Array<number>(),
    failure: new Array<number>(),
};

export function pushSuccess(item: number): number {
    return stats.success.push(item);
}

export function pushFailure(item: number): number {
    return stats.failure.push(item);
}

export function sendStats(): void {
    // Workers report to the primary over IPC
    process.send?.(stats);
}

export function mergeStats(message: typeof stats): number {
    return stats.success.push(...message.success) + stats.failure.push(...message.failure);
}

function displayStat(stat: number[]): void {
    function average(values: number[]): number {
        return values.reduce((acc, item): number => acc + item, 0) / values.length
    }
    function median(values: number[]): number {
        if(values.length === 0) {
            return 0;
        }
      
        values.sort((a, b): number => a-b);
      
        const half = Math.floor(values.length / 2);
        if (values.length % 2) {
            return values[half];
        }
        return (values[half - 1] + values[half]) / 2.0;
    }
    console.log(`\tMax Response Time: ${Math.max(...stat)}`);
    console.log(`\tMean Response Time: ${average(stat)}`);
    console.log(`\tMedian Response Time: ${median(stat)}`);
    console.log(`\tMin Response Time: ${Math.min(...stat)}`);
}

export function statsDisplay(argv: Arguments): void {
    fs.writeFile(
        (argv.output as string) || `${(new URL(argv._[1] as string)).hostname}.json`, 
        JSON.stringify(stats, null, 2), 
        (): void => {
            // console.clear();
            console.log(`Total: ${stats.success.length + stats.failure.length}`);
            if (stats.success.length > 0) {
                console.log(`Successes: ${stats.success.length}`);
                displayStat(stats.success);
            }
            if (stats.failure.length > 0) {
                console.log(`Failures: ${stats.failure.length}`);
                displayStat(stats.failure);
            }
            process.exit();
        });
}