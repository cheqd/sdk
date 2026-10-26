import { argumentsWithContext, contextParameterIndex } from '../src/modules/_';
import { DIDModule } from '../src/modules/did';
import { ResourceModule } from '../src/modules/resource';
import { FeemarketModule } from '../src/modules/feemarket';
import { OracleModule } from '../src/modules/oracle';
import { IContext } from '../src/types';

describe('context placement for sdk.* calls', () => {
	const context = { sdk: { marker: 'sdk' } } as unknown as IContext;

	it('finds the context parameter of module methods', () => {
		expect(contextParameterIndex(DIDModule.prototype.generateCreateDidDocFees)).toBe(3);
		expect(contextParameterIndex(DIDModule.prototype.createDidDocTx)).toBe(
			DIDModule.prototype.createDidDocTx.length - 1
		);
		expect(contextParameterIndex(ResourceModule.prototype.createLinkedResourceTx)).toBeGreaterThan(2);
		// a default value before context
		expect(contextParameterIndex(FeemarketModule.prototype.generateSafeGasPrice)).toBe(2);
		// a parameter after context
		expect(contextParameterIndex(OracleModule.prototype.govUpdateParamsTx)).toBe(4);
	});

	it('returns -1 when a function has no context parameter', () => {
		expect(contextParameterIndex((a: number, b: number) => a + b)).toBe(-1);
		expect(contextParameterIndex(function () {}.bind(null))).toBe(-1);
	});

	it('pads a short call so the context lands in its own parameter, not in granter', async () => {
		const generateFees = async (feePayer: string, granter?: unknown, feeOptions?: unknown, context?: IContext) => ({
			payer: feePayer,
			granter,
			feeOptions,
			context,
		});
		const index = contextParameterIndex(generateFees);
		const fee = await generateFees(...(argumentsWithContext(['cheqd1payer'], index, context) as [string]));
		expect(fee.granter).toBeUndefined();
		expect(fee.feeOptions).toBeUndefined();
		expect(fee.context).toBe(context);
	});

	it('keeps parameters passed after the context position', () => {
		const args = argumentsWithContext(['payload', 'address', undefined, '', undefined, { title: 'x' }], 4, context);
		expect(args.at(4)).toBe(context);
		expect(args.at(5)).toEqual({ title: 'x' });
	});

	it('appends the context when its position is unknown, as before', () => {
		expect(argumentsWithContext(['a'], -1, context)).toEqual(['a', context]);
	});
});
