import { Attribute, Event, GasPrice } from '@cosmjs/stargate';
import { CheqdNetwork } from '../src';

export const faucet = {
	prefix: 'cheqd',
	minimalDenom: 'ncheq',
	mnemonic:
		'sketch mountain erode window enact net enrich smoke claim kangaroo another visual write meat latin bacon pulp similar forum guilt father state erase bright',
	address: 'cheqd1rnr5jrt4exl0samwj0yegv99jeskl0hsxmcz96',
};

export const localnet = {
	network: CheqdNetwork.Testnet,
	rpcUrl: 'http://localhost:26657',
	gasPrice: GasPrice.fromString(`5000${faucet.minimalDenom}`),
};

export const json_content =
	'{"StatusList2021":{"encodedList":"H4sIAAAAAAAAA-3BIQEAAAACIGf4f6kzLEAaAAAAAAAAAAAAAAAAAAAA4Gy7QfAyAEAAAA","type":"StatusList2021Suspension","validFrom":"2023-07-03T07:17:23.261Z"},"metadata":{"encoding":"base64url","encrypted":false}}';

export const image_content =
	'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEW10NBjBBbqAAAAH0lEQVRoge3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAvg0hAAABmmDh1QAAAABJRU5ErkJggg' as const;

export const default_content = '<p>Test file content</p>';

// They are connected
export const pubkey_hex =
	'04adf6cad45e58a7e1908bebefcc358de229c108fb1170566f83be5ce028eb6b1997711067ffcb445532667ed4a4efc2b334c16421edb52ec5e0324a1c0e570663';

export const bech32_account = 'cheqd1ehcg0jarxkyxtkzrwcxayedxrskwyftxj4exm9';
// Testnet RPC and faucet address
export const faucet_address = 'cheqd1rnr5jrt4exl0samwj0yegv99jeskl0hsxmcz96';

export const testnet_rpc = 'https://rpc.cheqd.network:443';

export function containsAll<T>(array: T[], values: T[]): boolean {
	return values.every((value) => array.includes(value));
}

export function containsAllButOmittedFields<T extends Record<string, any>>(
	array: T[],
	values: T[],
	omit: string[]
): boolean {
	const replacer = (key: string, value: any) => (omit.includes(key) ? undefined : value);
	return values.every((value) =>
		array.some((item) => JSON.stringify(item, replacer) === JSON.stringify(value, replacer))
	);
}

export function getEventByType(events: readonly Event[], type: string) {
	return events.find((event) => event.type === type);
}

export function getAttributeByKey(attributes: Attribute[], key: string) {
	return attributes.find((attribute) => attribute.key === key);
}

export function getEventByTypeAndAttributeKey(events: readonly Event[], type: string, key: string, value: string) {
	return events.find(
		(event) =>
			event.type === type &&
			event.attributes.some((attribute) => attribute.key === key && attribute.value === value)
	);
}

export function eventContainsAttribute(event: Event, key: string, value: string) {
	return event.attributes.some((attribute) => attribute.key === key && attribute.value === value);
}
