import { client } from '$services/redis';
import type { CreateUserAttrs } from '$services/types';
import { genId } from '$services/utils';
import { usernamesKey, usernamesUniqueKey, usersKey } from '$services/keys';

export const getUserByUsername = async (username: string) => {
	// get username and find user id
	const decimalId = await client.zScore(usernamesKey(), username);
	if (!decimalId) {
		throw new Error('User does not exist');
	}

	// convert id to base 16
	const id = decimalId.toString(16);
	// user id to find users hash
	const user = await client.hGetAll(usersKey(id));

	return user;
};

export const getUserById = async (id: string) => {
	const user = await client.hGetAll(usersKey(id));
	return deserialize(id, user);
};

export const createUser = async (attrs: CreateUserAttrs) => {
	const id = genId();

	const exists = await client.sIsMember(usernamesUniqueKey(), attrs.username);
	if (exists) {
		throw new Error('Username is taken');
	}

	await client.hSet(
		usersKey(id),
		serialize({
			username: attrs.username,
			password: attrs.password
		})
	);
	await client.sAdd(usernamesUniqueKey(), attrs.username);
	await client.zAdd(usernamesKey(), {
		value: attrs.username,
		score: parseInt(id, 16)
	});
	return id;
};

const serialize = (user: CreateUserAttrs) => {
	return {
		username: user.username,
		password: user.password
	};
};

const deserialize = (id: string, user: { [key: string]: string }) => {
	return {
		id,
		username: user.username,
		password: user.password
	};
};
