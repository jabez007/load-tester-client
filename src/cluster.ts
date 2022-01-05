import cluster from "cluster";
import os from "os";
import yargs from "yargs";
import { axiosCommand } from "./axios";
import { mergeStats, statsDisplay } from "./stats";

export function clusterArgv(yargs: yargs.Argv): yargs.Argv {
    return yargs
        .option('workers', {
            alias: 'w',
            describe: 'Number of worker processes to spin up',
            global: true,
            array: true,
            number: true,
            default: [ os.cpus().length ** 2 ],
        })
        .option('run', {
            alias: 'r',
            describe: 'Minimum number of minutes to keep the workers running',
            global: true,
            number: true,
            default: 0,
        })
        .option('delay', {
            alias: 'd',
            describe: 'Number of seconds between attempts by each worker',
            global: true,
            number: true,
            default: 0,
        })
}

const { stdin, stdout } = process;

let restart = true;

function prompt(question: string, resolving = 'resolving...'): Promise<string> {
    return new Promise((resolve, reject): void => {
        stdin.resume();
        stdout.write(`${question}\n`);
        stdin.on('data', (data): void => {
            stdout.write(`${resolving}\n`);
            resolve(data.toString().trim());
        });
        stdin.on('error', (err): void => reject(err));
    });
}

function runCluster(argv: yargs.Arguments, numWorkers: number): Promise<void> {
    console.log(`Cluster master is setting up ${numWorkers} worker${ numWorkers > 1 ? 's' : '' }...`);
    return new Promise((resolve): void => {
        let workers = 0;

        const start = (new Date()).getTime();
        cluster.on('exit', (): void => {
            if (restart && ((argv.run as number) < 0 || ((new Date()).getTime() - start) < ((argv.run as number) * 60000))) {
                setTimeout((): void => {
                    cluster.fork().on('message', mergeStats);
                }, (argv.delay as number) * 1000)
            } else {
                workers -= 1;
            }
                
            if (workers < 1) {
                resolve();
            }
        });
    
        for(let i = 0; i < numWorkers; i += 1) {
            workers++;
            cluster.fork().on('message', mergeStats);
        }
    })
}

async function clusterMaster(argv: yargs.Arguments, stages: number[], isSingle = false): Promise<void> {
    const popStages = stages.reverse();

    if (!isSingle) {
        prompt("Press enter to stop...")
            .then((): void => {
                restart = false;
            });
    }

    while (restart && popStages.length > 0) {
        await runCluster(argv, popStages.pop() as number);
        stdout.write('\n');  
    }

    if (isSingle) {
        process.exit()
    } else {
        statsDisplay(argv);
    }
}

export function loadTest(argv: yargs.Arguments): void {
    const stages = (argv.workers as number[])
        .filter((n): boolean => !Number.isNaN(n))
    const isSingle = stages.length === 1 && stages[0] === 1 && argv.run === 0;
    if (cluster.isMaster) {
        clusterMaster(argv, stages, isSingle);
    } else {
        axiosCommand(argv, isSingle);
    }
}