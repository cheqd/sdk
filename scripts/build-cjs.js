'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const workspaceDir = path.join(rootDir, 'cjs');
const tscCli = path.join(rootDir, 'node_modules', 'typescript', 'lib', 'tsc.js');

function runTsc(configPath) {
	execFileSync(process.execPath, [tscCli, '-p', configPath], {
		cwd: workspaceDir,
		stdio: 'inherit',
	});
}

function clean(target) {
	fs.rmSync(target, { recursive: true, force: true });
}

function ensureDir(target) {
	fs.mkdirSync(target, { recursive: true });
}

const destDir = path.join(rootDir, 'build', 'cjs');
clean(destDir);
runTsc('tsconfig.json');
ensureDir(destDir);
fs.copyFileSync(path.join(workspaceDir, 'package.json'), path.join(destDir, 'package.json'));
