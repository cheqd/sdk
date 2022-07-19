import {
	Registry,
	GeneratedType,
	EncodeObject
} from '@cosmjs/proto-signing'

import {
	defaultRegistryTypes
} from '@cosmjs/stargate'

import {
	MsgCreateDid, MsgCreateDidResponse, MsgUpdateDid, MsgUpdateDidResponse
} from '@cheqd/ts-proto/cheqd/v1/tx'

export const typeUrlMsgCreateDid = '/cheqdid.cheqdnode.cheqd.v1.MsgCreateDid'
export const typeUrlMsgCreateDidResponse = '/cheqdid.cheqdnode.cheqd.v1.MsgCreateDidResponse'
export const typeUrlMsgUpdateDid = '/cheqdid.cheqdnode.cheqd.v1.MsgUpdateDid'
export const typeUrlMsgUpdateDidResponse = '/cheqdid.cheqdnode.cheqd.v1.MsgUpdateDidResponse'

export function createDefaultCheqdRegistry(customTypes?: Iterable<[string, GeneratedType]>): Registry {
	if (!customTypes) customTypes = [];

	return new Registry([...defaultRegistryTypes, ...customTypes])
}

export const CheqdRegistry = new Registry(defaultRegistryTypes)

export interface MsgCreateDidEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgCreateDid,
	readonly value: Partial<MsgCreateDid>
}

export function isMsgCreateDidEncodeObject(obj: EncodeObject): obj is MsgCreateDidEncodeObject {
	return obj.typeUrl === typeUrlMsgCreateDid
}

export interface MsgCreateDidResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgCreateDidResponse,
	readonly value: Partial<MsgCreateDidResponse>
}

export function MsgCreateDidResponseEncodeObject(obj: EncodeObject): obj is MsgCreateDidResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgCreateDidResponse
}

export interface MsgUpdateDidEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateDid,
	readonly value: Partial<MsgUpdateDid>
}

export function MsgUpdateDidEncodeObject(obj: EncodeObject): obj is MsgUpdateDidEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDid
}

export interface MsgUpdateDidResponseEncodeObject extends EncodeObject {
	readonly typeUrl: typeof typeUrlMsgUpdateDidResponse,
	readonly value: Partial<MsgUpdateDidResponse>
}

export function MsgUpdateDidResponseEncodeObject(obj: EncodeObject): obj is MsgUpdateDidResponseEncodeObject {
	return obj.typeUrl === typeUrlMsgUpdateDidResponse
}
