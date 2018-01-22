import SequelizeRedisModel from './SequelizeRedisModel';

export default class SequelizeRedis {
  constructor(redisClient, options = {}) {
    this.redisClient = redisClient;
    this.options = options;
  }

  getModel(model, options = {}) {
    return (new SequelizeRedisModel(model, this.redisClient, { ...this.options, ...options }));
  }
}
