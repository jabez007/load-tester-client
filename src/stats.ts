import fs from "fs";
import yargs from "yargs";

export function outputArgv(yargs: yargs.Argv): yargs.Argv {
    return yargs
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
    // @ts-ignore
    process.send(stats);
}

export function mergeStats(message: typeof stats): number {
    return stats.success.push(...message.success) + stats.failure.push(...message.failure);
}

function displayStat(stat: number[]): void {
    function average(stats: number[]): number {
        return stats.reduce((acc, item): number => acc + item, 0) / stats.length
    }
    function median(stats: number[]): number {
        if(stats.length === 0) {
            return 0;
        }
      
        stats.sort((a, b): number => a-b);
      
        const half = Math.floor(stats.length / 2);
        if (stats.length % 2) {
            return stats[half];
        }
        return (stats[half - 1] + stats[half]) / 2.0;
    }
    console.log(`\tMax Response Time: ${Math.max(...stat)}`);
    console.log(`\tMean Response Time: ${average(stat)}`);
    console.log(`\tMedian Response Time: ${median(stat)}`);
    console.log(`\tMin Response Time: ${Math.min(...stat)}`);
}

export function statsDisplay(argv: yargs.Arguments): void {
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