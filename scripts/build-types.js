'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const workspaceDir = path.join(rootDir, 'esm');
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

const typesOutDir = path.join(workspaceDir, 'build', 'types');
clean(typesOutDir);
runTsc('tsconfig.types.json');

const destDir = path.join(rootDir, 'build', 'types');
clean(destDir);
ensureDir(path.join(rootDir, 'build'));
fs.cpSync(typesOutDir, destDir, { recursive: true });
