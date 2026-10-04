#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import type { Argv, Arguments } from "yargs";
import { commonArgv, withBodyArgv } from "./axios.js";
import { clusterArgv, loadTest } from "./cluster.js";
import { outputArgv } from "./stats.js";

clusterArgv(
    outputArgv(
        yargs(hideBin(process.argv))
    )
)
    .command(
        ['post', 'POST'],
        'HTTP POST method',
        function (cli: Argv): Argv {
            return withBodyArgv(cli);
        },
        function (argv: Arguments): void {
            loadTest(argv);
        }
    )
    .command(
        ['get', 'GET'],
        'HTTP GET method',
        function (cli: Argv): Argv {
            return commonArgv(cli);
        },
        function (argv: Arguments): void {
            loadTest(argv);
        }
    )
    .command(
        ['put', 'PUT'],
        'HTTP PUT method',
        function (cli: Argv): Argv {
            return withBodyArgv(cli);
        },
        function (argv: Arguments): void {
            loadTest(argv);
        }
    )
    .command(
        ['head', 'HEAD'],
        'HTTP HEAD method',
        function (cli: Argv): Argv {
            return commonArgv(cli);
        },
        function (argv: Arguments): void {
            loadTest(argv);
        }
    )
    .help()
    .argv;
