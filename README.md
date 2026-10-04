# load-tester-client

A cURL-like client for load testing an HTTP service. It sends GET, POST, PUT, or HEAD requests from a pool of worker processes and records how long each response takes.

## Install

Requires Node.js 20.19+ on the 20 line, or 22.12+.

```bash
npx @jabez007/load-tester-client get https://example.com
```

or install it globally:

```bash
npm install --global @jabez007/load-tester-client
load-tester-client get https://example.com
```

## Usage

```bash
load-tester-client <get|post|put|head> <url> [options]
```

With `-w 1` and no `-r`, it sends one request and prints the status, headers, and body:

```bash
load-tester-client get https://api.example.com/items -w 1 --h.accept=application/json
```

Anything else is a load run. Each worker sends one request and exits. The run prints `*` for each success and `x` for each failure. Then it writes every response time to a JSON file and prints the max, mean, median, and min for successes and failures. Press enter to stop a run early.

```bash
# 3 stages of 10, 50, and 100 workers, each stage restarting workers for 2 minutes
load-tester-client post https://api.example.com/items -w 10 50 100 -r 2 -b '{"name":"test"}' --h.content-type=application/json
```

### Options

| Option | Description |
| --- | --- |
| `-w`, `--workers` | Workers per stage. Pass several numbers for several stages. Defaults to the CPU count squared. |
| `-r`, `--run` | Minutes to keep restarting workers in each stage. A negative number runs until you press enter. Defaults to 0, one request per worker. |
| `-d`, `--delay` | Seconds a worker waits before it restarts. Defaults to 0. |
| `-o`, `--output` | File to write the response times to. Defaults to `<hostname>.json`. |
| `-h`, `--headers` | Request headers in dot notation, such as `--h.content-type=application/json`. |
| `-u`, `--username`, `-p`, `--password` | Basic auth credentials. |
| `-q`, `--params` | Query parameters in dot notation, such as `--q.page=3`. |
| `-b`, `--body` | Request body, for `post` and `put`. |

## Development

```bash
npm install
npm run build      # compile src/ to dist/
npm test           # build, then run the CLI against a local server
npm run lint       # ESLint with --fix
npm run typecheck  # type-check the source and the tests
```

Pushing a `vX.Y.Z` tag publishes to GitHub Package Registry and stages the release on npm. It goes live when you approve it with 2FA on npmjs.com or with `npm stage approve`.
