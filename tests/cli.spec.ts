import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const cli = join(import.meta.dirname, '..', 'dist', 'index.js');

interface CliResult {
    code: number | null;
    stdout: string;
    stderr: string;
}

function runCli(args: string[]): Promise<CliResult> {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [cli, ...args], { stdio: 'pipe' });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk) => { stdout += chunk; });
        child.stderr.on('data', (chunk) => { stderr += chunk; });
        child.on('error', reject);
        child.on('close', (code) => resolve({ code, stdout, stderr }));
    });
}

describe('load-tester-client', () => {
    let server: Server;
    let baseUrl: string;

    before(async () => {
        server = createServer((req, res) => {
            if (req.url === '/fail') {
                res.writeHead(500, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ error: 'boom' }));
                return;
            }
            res.writeHead(200, { 'content-type': 'application/json', 'x-test': 'yes' });
            res.end(JSON.stringify({ hello: 'world' }));
        });
        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
        baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    after(() => new Promise<void>((resolve) => server.close(() => resolve())));

    describe('a single request', () => {
        it('prints the status, headers, and body', async () => {
            const { code, stdout } = await runCli(['get', `${baseUrl}/`, '-w', '1']);

            assert.equal(code, 0);
            assert.match(stdout, /^200: OK$/m);
            assert.match(stdout, /"x-test": "yes"/);
            assert.match(stdout, /"hello": "world"/);
        });

        it('prints the error when the server never answers', async () => {
            const closed = createServer();
            await new Promise<void>((resolve) => closed.listen(0, '127.0.0.1', resolve));
            const { port } = closed.address() as AddressInfo;
            await new Promise<void>((resolve) => closed.close(() => resolve()));

            const { stdout, stderr } = await runCli(['get', `http://127.0.0.1:${port}/`, '-w', '1']);

            assert.match(stdout, /ECONNREFUSED/);
            assert.doesNotMatch(stdout + stderr, /TypeError/);
        });
    });

    describe('a load run', () => {
        let outputDirectory: string;

        beforeEach(async () => {
            outputDirectory = await mkdtemp(join(tmpdir(), 'load-tester-client-'));
        });

        afterEach(() => rm(outputDirectory, { recursive: true, force: true }));

        it('writes every successful response time to the stats file', async () => {
            const output = join(outputDirectory, 'stats.json');

            const { code, stdout } = await runCli(['get', `${baseUrl}/`, '-w', '3', '-o', output]);

            assert.equal(code, 0);
            const stats = JSON.parse(await readFile(output, 'utf8'));
            assert.equal(stats.success.length, 3);
            assert.equal(stats.failure.length, 0);
            assert.match(stdout, /^Total: 3$/m);
            assert.match(stdout, /^Successes: 3$/m);
            assert.match(stdout, /Median Response Time: \d/);
        });

        it('counts error responses as failures', async () => {
            const output = join(outputDirectory, 'stats.json');

            const { code, stdout } = await runCli(['get', `${baseUrl}/fail`, '-w', '2', '-o', output]);

            assert.equal(code, 0);
            const stats = JSON.parse(await readFile(output, 'utf8'));
            assert.equal(stats.success.length, 0);
            assert.equal(stats.failure.length, 2);
            assert.match(stdout, /^Failures: 2$/m);
        });
    });
});
