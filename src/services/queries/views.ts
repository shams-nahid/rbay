import { itemsByViewsKey } from '$services/keys';
import { client } from '$services/redis';

export const incrementView = async (itemId: string, userId: string) => {
	return Promise.all([
		client.hIncrBy(itemId, 'views', 1),
		client.zIncrBy(itemsByViewsKey(), 1, itemId)
	]);
};
