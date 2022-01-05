import axios, { AxiosResponse } from "axios";
import yargs from "yargs";
import { pushSuccess, pushFailure, sendStats } from "./stats";

export function commonArgv(yargs: yargs.Argv): yargs.Argv {
    return yargs
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

export function withBodyArgv(yargs: yargs.Argv): yargs.Argv {
    return commonArgv(yargs)
        .option('body', {
            alias: 'b',
            describe: 'The body to send in the POST request',
        });
}

const { stdout } = process;

export function axiosCommand(argv: yargs.Arguments, isSingle = false): void {
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
    // @ts-ignore
    axios({
        method: `${argv._[0]}`,
        url: `${argv._[1]}`,
        headers: argv.headers,
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
        .catch((err: Error): void => {
            pushFailure((new Date()).getTime() - start);
            stdout.write(isSingle
                // @ts-ignore
                ? `${err.name}: ${err.message}\n${err.response.data}`
                : 'x'
            );
        })
        .finally((): void => { 
            sendStats();
            process.exit();
        })
}
