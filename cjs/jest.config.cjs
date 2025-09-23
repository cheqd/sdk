/** @type {import('jest').Config} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	modulePathIgnorePatterns: ['tests/testutils.test.ts'],
	transformIgnorePatterns: ['node_modules/(?!(@scure|@noble|did-jwt|multiformats|uint8arrays)/)'],
	transform: {
		'^.+\\.(js|jsx|ts|tsx|mjs)$': [
			'ts-jest',
			{
				useESM: false,
				tsconfig: {
					module: 'commonjs',
				},
			},
		],
	},
};
