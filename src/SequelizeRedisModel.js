import { stringify, parse } from 'json-buffer';

const methods = [
  'find',
  'findOne',
  'findAll',
  'findAndCount',
  'findAndCountAll',
  'findById',
  'all',
  'min',
  'max',
  'sum',
  'count',
];

export default class SequelizeRedisModel {
  constructor(model, redisPromisifiedClient, options = {}) {
    this.options = {
      ...options,
    };

    this.model = model;
    this.redisClient = redisPromisifiedClient;
    methods.forEach((method) => {
      this[`${method}Cached`] = async (cacheKey, ...args) => this.run(cacheKey, method, ...args);
      this[method] = async (...args) => this.model[method](...args);
    });
  }

  async run(cacheKey, method, ...args) {
    if (!methods.includes(method)) {
      throw new Error('Unsupported method');
    }
    if (!this.model[method]) {
      throw new Error('Unsupported Method by Sequelize model');
    }

    let cached;
    try {
      cached = await this.redisClient.getAsync(cacheKey);
    } catch (error) {
      throw new Error(`Cant get cached object from Redis ${error.message}`);
    }

    if (cached) {
      let parsed;
      try {
        parsed = parse(cached);
      } catch (error) {
        throw new Error(`Cant parse JSON of cached model's object: ${error.message}`);
      }

      try {
        // console.log('From Cache');
        let result;
        const [queryOptions] = args;

        if (queryOptions && !!queryOptions.raw) {
          result = parsed;
          if (queryOptions.offset || queryOptions.limit) {
            result = result.splice(queryOptions.offset || 0, queryOptions.limit || result.length);
          }
        } else if (parsed.rows) {
          result = {
            ...parsed,
            rows: parsed.rows.map(parsedRow => this.model.build(parsedRow)),
          };
        } else if (typeof parsed === 'number') {
          result = parsed;
        } else if (queryOptions) {
          const buildOptions = {
            raw: !!queryOptions.raw,
            isNewRecord: !!queryOptions.isNewRecord,
          };
          if (queryOptions.include) {
            buildOptions.include = queryOptions.include;
          }

          result = this.model.build(parsed, buildOptions);
          
          if (queryOptions.offset || queryOptions.limit) {
            result = result.splice(queryOptions.offset || 0, queryOptions.limit || result.length);
          }

        } else {
          
          result = this.model.build(parsed);
        }

        return [result, true];
      } catch (error) {
        throw new Error(`Cant build model from cached JSON: ${error.message}`);
      }
    }

    // console.log('From DB');
    const result = await this.model[method](...args);
    let toCache;
    if (!result) {
      return [null, false];
    } else if (Array.isArray(result) || result.rows || typeof result === 'number') {
      // Array for findAll, result.rows for findAndCountAll, typeof number for count/max/sum/etc
      toCache = result;
    } else if (result.toString().includes(('[object SequelizeInstance'))) {
      toCache = result;
    } else {
      throw new Error(`Unkown result type: ${typeof result}`);
    }

    this.redisClient.set(cacheKey, stringify(toCache));

    if (this.options.ttl) {
      this.redisClient.expire(cacheKey, this.options.ttl);
    }

    return [result, false];
  }
}

