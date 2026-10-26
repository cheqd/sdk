import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing-cjs';
import {
	AbstractCheqdSDKModule,
	DIDModule,
	FeeabstractionModule,
	FeemarketModule,
	ICheqdSDKOptions,
	ResourceModule,
} from '../src';

describe('ICheqdSDKOptions.modules', () => {
	it('accepts module classes without a cast', async () => {
		const wallet = await DirectSecp256k1HdWallet.generate(12, { prefix: 'cheqd' });
		const options: ICheqdSDKOptions = {
			modules: [DIDModule, ResourceModule, FeemarketModule, FeeabstractionModule],
			rpcUrl: 'http://localhost:26657',
			wallet,
		};
		expect(options.modules).toHaveLength(4);
	});

	it('still accepts modules cast to AbstractCheqdSDKModule', async () => {
		const wallet = await DirectSecp256k1HdWallet.generate(12, { prefix: 'cheqd' });
		const options: ICheqdSDKOptions = {
			modules: [DIDModule as unknown as AbstractCheqdSDKModule],
			rpcUrl: 'http://localhost:26657',
			wallet,
		};
		expect(options.modules).toHaveLength(1);
	});
});
