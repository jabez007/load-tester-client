
import yargs from "yargs";
import { commonArgv, withBodyArgv } from "./axios";
import { clusterArgv, loadTest } from "./cluster";
import { outputArgv } from "./stats";

clusterArgv(
    outputArgv(
        yargs(process.argv.slice(2))
    )
)
    .command(
        ['post', 'POST'],
        'HTTP POST method',
        function (yargs: yargs.Argv): yargs.Argv {
            return withBodyArgv(yargs);
        },
        function (argv: yargs.Arguments): void {
            loadTest(argv);
        }
    )
    .command(
        ['get', 'GET'],
        'HTTP GET method',
        function (yargs: yargs.Argv): yargs.Argv {
            return commonArgv(yargs);
        },
        function (argv: yargs.Arguments): void {
            loadTest(argv);
        }
    )
    .command(
        ['put', 'PUT'],
        'HTTP PUT method',
        function (yargs: yargs.Argv): yargs.Argv {
            return withBodyArgv(yargs);
        },
        function (argv: yargs.Arguments): void {
            loadTest(argv);
        }
    )
    .command(
        ['head', 'HEAD'],
        'HTTP HEAD method',
        function (yargs: yargs.Argv): yargs.Argv {
            return commonArgv(yargs);
        },
        function (argv: yargs.Arguments): void {
            loadTest(argv);
        }
    )
    .help()
    .argv;
