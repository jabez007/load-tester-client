import axios, { AxiosResponse } from "axios";
import type { Argv, Arguments } from "yargs";
import { pushSuccess, pushFailure, sendStats } from "./stats.js";

export function commonArgv(cli: Argv): Argv {
    return cli
        .option('headers', {
            alias: 'h',
            describe: 'Headers to send with every request. Use dot notation, i.e. --h.content-type=application/json'
        })
        .option('username', {
            alias: 'u',
            describe: 'Username for Basic HTTP Authentication'
        })
        .option('password', {
            alias: 'p',
            describe: 'Password for Basic HTTP Authentication'
        })
        .option('params', {
            alias: 'q',
            describe: 'Query parameters to send with every request. Use dot notation, i.e. --q.page=3'
        });
}

export function withBodyArgv(cli: Argv): Argv {
    return commonArgv(cli)
        .option('body', {
            alias: 'b',
            describe: 'The body to send in the POST request',
        });
}

const { stdout } = process;

export function axiosCommand(argv: Arguments, isSingle = false): void {
    const auth =
        argv.username && argv.password
            ? {
                username: `${argv.username}`,
                password: `${argv.password}`,
            }
            : undefined;

    const start = (new Date()).getTime();
    /*
    axios.interceptors.request.use((config): AxiosRequestConfig => {
        stdout.write(isSingle 
            ? `${JSON.stringify(config.headers, null, 2)}\n` 
            : ''
        );
        return config;
    });
    */
    axios({
        method: `${argv._[0]}`,
        url: `${argv._[1]}`,
        // yargs turns --h.name=value into { name: value }
        headers: argv.headers as Record<string, string> | undefined,
        auth: auth,
        params: argv.params,
        data: argv.body
    })
        .then((response: AxiosResponse): void => {
            pushSuccess((new Date()).getTime() - start);
            stdout.write(isSingle 
                ? (`${response.status}: ${response.statusText}\n` +
                    `${JSON.stringify(response.headers, null, 2)}\n` +
                    `${JSON.stringify(response.data, null, 2)}\n`
                ) 
                : '*'
            );
        })
        .catch((err: Error & { response?: AxiosResponse }): void => {
            pushFailure((new Date()).getTime() - start);
            // A refused or timed-out request has no response to print
            stdout.write(isSingle
                ? `${err.name}: ${err.message}\n` +
                    (err.response ? `${JSON.stringify(err.response.data, null, 2)}\n` : '')
                : 'x'
            );
        })
        .finally((): void => { 
            sendStats();
            process.exit();
        })
}
