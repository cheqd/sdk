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

const workspaceBuildDir = path.join(workspaceDir, 'build');
clean(workspaceBuildDir);
runTsc('tsconfig.json');

const destDir = path.join(rootDir, 'build', 'esm');
const destBuildDir = path.join(destDir, 'build');

clean(destDir);
ensureDir(destBuildDir);

fs.cpSync(workspaceBuildDir, destBuildDir, { recursive: true });

fs.copyFileSync(
	path.join(workspaceDir, 'package.json'),
	path.join(destDir, 'package.json'),
);

['README.md', 'LICENSE'].forEach((filename) => {
	const source = path.join(rootDir, filename);
	if (fs.existsSync(source)) {
		fs.copyFileSync(source, path.join(destDir, filename));
	}
});
