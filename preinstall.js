const fs = require('fs');
const path = require('path');

const rootPackageJsonPath = path.resolve(__dirname, 'package.json');
const esmPackageJsonPath = path.resolve(__dirname, 'esm', 'package.json');
const cjsPackageJsonPath = path.resolve(__dirname, 'cjs', 'package.json');

function addSuffixedDependencies(packageJsonPath, suffix = '') {
	const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf-8'));
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
	const dependencies = packageJson.dependencies || {};

	rootPackageJson.dependencies = rootPackageJson.dependencies || {};

	for (const [dep, version] of Object.entries(dependencies)) {
		const suffixedDep = suffix ? `${dep}${suffix}` : dep;
		rootPackageJson.dependencies[suffixedDep] = suffix ? `npm:${dep}@${version}` : version;
	}

	fs.writeFileSync(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 4));
}

addSuffixedDependencies(esmPackageJsonPath);
addSuffixedDependencies(cjsPackageJsonPath, '-cjs');
