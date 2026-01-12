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
	fs.rmSync(target, { recursive: true, force: true, maxRetries: 5 });
}

function ensureDir(target) {
	fs.mkdirSync(target, { recursive: true });
}

const workspaceBuildDir = path.join(workspaceDir, 'build');
clean(workspaceBuildDir);
runTsc('tsconfig.json');

const ancillaryFiles = ['README.md', 'LICENSE'];

ancillaryFiles.forEach((filename) => {
	const source = path.join(rootDir, filename);
	if (fs.existsSync(source)) {
		fs.copyFileSync(source, path.join(workspaceBuildDir, filename));
	}
});

const destDir = path.join(rootDir, 'build', 'esm');
const esmOutputDir = path.join(workspaceBuildDir, 'esm', 'src');
const workspaceCjsDir = path.join(workspaceBuildDir, 'cjs');
const workspaceEsmDir = path.join(workspaceBuildDir, 'esm');
const copyDirContents = (source, destination) =>
	fs.readdirSync(source, { withFileTypes: true }).forEach((dirent) => {
		const from = path.join(source, dirent.name);
		const to = path.join(destination, dirent.name);
		fs.cpSync(from, to, { recursive: true });
	});

clean(destDir);
ensureDir(destDir);

if (!fs.existsSync(esmOutputDir)) {
	throw new Error(`ESM build output not found at ${esmOutputDir}`);
}

fs.cpSync(esmOutputDir, destDir, { recursive: true });

// flatten workspace build directory to keep only final ESM output
copyDirContents(esmOutputDir, workspaceBuildDir);
clean(workspaceCjsDir);
clean(esmOutputDir);
clean(workspaceEsmDir);

fs.copyFileSync(path.join(workspaceDir, 'package.json'), path.join(destDir, 'package.json'));

ancillaryFiles.forEach((filename) => {
	const source = path.join(rootDir, filename);
	if (fs.existsSync(source)) {
		fs.copyFileSync(source, path.join(destDir, filename));
	}
});
