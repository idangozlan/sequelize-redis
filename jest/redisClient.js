import bluebird from 'bluebird';
import redis from 'redis-mock'; // eslint-disable-line import/no-extraneous-dependencies

const redisClient = redis.createClient();

bluebird.promisifyAll(redisClient);

export default redisClient;
