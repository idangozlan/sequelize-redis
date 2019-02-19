const { stringify, parse } = require('json-buffer');

const methods = [
  'find',
  'findOne',
  'findAll',
  'findAndCount',
  'findAndCountAll',
  'findById',
  'findByPk',
  'all',
  'min',
  'max',
  'sum',
  'count',
];

module.exports = class SequelizeRedisModel {
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

  $build(values, options) {
    const model = this.model.build(values, {
      ...options,
      raw: options.raw || true,
      include: options.include || [],
    });

    if (this.model.options.timestamps === true && options && options.isNewRecord === false) {
      // get the fields being used for timestamps
      const fields = Object.values(this.model._timestampAttributes); // eslint-disable-line no-underscore-dangle

      // iterate over them and get the value from cached data
      fields.forEach((field) => {
        if (typeof values[field] !== 'undefined') {
          model.dataValues[field] = values[field];
        }
      });

      model._changed = {}; // eslint-disable-line no-underscore-dangle
      model._previousDataValues = Object.assign({}, model.dataValues); // eslint-disable-line no-underscore-dangle
    }

    return model;
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
        } else if (parsed.rows) {
          result = {
            ...parsed,
            rows: parsed.rows.map(parsedRow => this.$build(parsedRow, { isNewRecord: false })),
          };
        } else if (typeof parsed === 'number') {
          result = parsed;
        } else if (queryOptions) {
          const buildOptions = {
            raw: !!queryOptions.raw,
            isNewRecord: false, // forced false since we're already pulling from cache, so it means already was persisted to DB previously
          };
          if (queryOptions.include) {
            buildOptions.include = queryOptions.include;
          }
          result = this.$build(parsed, buildOptions);
        } else {
          result = this.$build(parsed, { isNewRecord: false });
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
    } if (Array.isArray(result) || result.rows || typeof result === 'number') {
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
};
