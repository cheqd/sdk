import { EncodeObject } from '@cosmjs/proto-signing';
import { CheqdSigningStargateClient } from '../src/signer';

// batchMessages simulates every message on its own connection, so an unbounded burst makes the node drop connections.
describe('CheqdSigningStargateClient batchMessages concurrency', () => {
	const createClient = (simulate: (address: string, messages: readonly EncodeObject[]) => Promise<number>) => {
		const client = Object.create(CheqdSigningStargateClient.prototype) as CheqdSigningStargateClient;
		(client as unknown as { simulate: typeof simulate }).simulate = simulate;
		return client;
	};

	it('should never run more simulations at once than the configured concurrency', async () => {
		let running = 0;
		let maxRunning = 0;
		const client = createClient(async () => {
			running++;
			maxRunning = Math.max(maxRunning, running);
			await new Promise((resolve) => setTimeout(resolve, 5));
			running--;
			return 1;
		});
		const messages = Array.from({ length: 95 }, (_, i) => ({ typeUrl: `/test.Msg${i}`, value: {} }));

		await client.batchMessages(messages, 'cheqd1address');

		expect(maxRunning).toBeGreaterThan(1);
		expect(maxRunning).toBeLessThanOrEqual(CheqdSigningStargateClient.simulationConcurrency);
	});

	it('should keep every message with its own gas estimate, in order', async () => {
		// the gas estimate is the index of the message, so any reordering changes how the batches split
		const client = createClient(async (_address, messages) => Number(messages[0].typeUrl.replace('/test.Msg', '')));
		const messages = Array.from({ length: 25 }, (_, i) => ({ typeUrl: `/test.Msg${i}`, value: {} }));

		// a limit of 100 gas: messages 0 to 14 sum to 105 > 100, so the batches must split in message order
		const result = await client.batchMessages(messages, 'cheqd1address', undefined, 100);

		expect(result.batches.flat().map((m) => m.typeUrl)).toEqual(messages.map((m) => m.typeUrl));
		expect(result.gas.reduce((a, b) => a + b, 0)).toBe((24 * 25) / 2);
	});
});
