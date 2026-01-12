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
const cjsTypesDir = path.join(typesOutDir, 'cjs');
const esmTypesDir = path.join(typesOutDir, 'esm');
const esmTypesSrcDir = path.join(esmTypesDir, 'src');
const copyDirContents = (source, destination) =>
	fs.readdirSync(source, { withFileTypes: true }).forEach((dirent) => {
		const from = path.join(source, dirent.name);
		const to = path.join(destination, dirent.name);
		fs.cpSync(from, to, { recursive: true });
	});

clean(typesOutDir);
runTsc('tsconfig.types.json');

if (!fs.existsSync(esmTypesSrcDir)) {
	throw new Error(`ESM type output not found at ${esmTypesSrcDir}`);
}

copyDirContents(esmTypesSrcDir, typesOutDir);
clean(cjsTypesDir);
clean(esmTypesDir);

const destDir = path.join(rootDir, 'build', 'types');

clean(destDir);
ensureDir(path.join(rootDir, 'build'));
ensureDir(destDir);
fs.cpSync(typesOutDir, destDir, { recursive: true });
