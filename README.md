# sequelize-redis
[![Build Status](https://travis-ci.org/idangozlan/sequelize-redis.svg?branch=master)](https://travis-ci.org/idangozlan/sequelize-redis)
[![codecov.io Code Coverage](https://img.shields.io/codecov/c/github/idangozlan/sequelize-redis.svg?maxAge=2592000)](https://codecov.io/github/idangozlan/sequelize-redis?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/idangozlan/sequelize-redis/badge.svg)](https://snyk.io/test/github/idangozlan/sequelize-redis)

A semi-automatic caching wrapper for Sequelize v4 NodeJS framework

### Installation

```

npm install sequelize-redis

```
### requirements
- Sequelize V4
- [Redis Client (promisified with bluebird) ](https://github.com/NodeRedis/node_redis#promises) 

## Usage
1. Init our Sequelize cache manager:
```
import SequelizeRedis from 'sequelize-redis';
import redis from 'redis';
import bluebird from 'bluebird';

// Let's promisify Redis
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

// Define your redisClient
const redisClient = redis.createClient({ /* Redis configuration comes here */ });

// Let's start
const sequelizeRedis = new SequelizeRedis(redisClient);
```

2. Wrap our the Sequelize original model:
``` 
// models.User refers to model of sequelieze
const User = sequelizeRedis.getModel(models.User, { ttl: 60 * 60 * 24 });
```
The second argument of `getModel` is optional:

| Key | Description                 | Default value |
|-----|-----------------------------|---------------|
| ttl | Defines cache TTL (seconds) | null          |


3. Then we can start use the model wrapper:
```
const userUUID = '75292c75-4c7a-4a11-92ac-57f929f50e23';
const userCacheKey = `user_${userUUID}`;
// We can use the default sequelize methods by adding suffix of "Cached" 
// for example, findByIdCached: 
const [user, cacheHit] = await User.findByIdCached(userCacheKey, userUUID);
// We can also use the non cached methods (original methods)
const user = await User.findById(userUUID);
```

Results of Cached methods (for ex. `findByIdCached`) will be array with following arguments: 
1. Sequelize response (same as on original method)
2. Cache hit indication (`true` / `false`)


Supported Methods:
  `find`
  `findOne`
  `findAll`
  `findAndCount`
  `findAndCountAll`
  `findById`
  `all`
  `min`
  `max`
  `sum`
  `count`

## Cache Invalidation
Just use regular Redis API:
```
redisClient.del('SampleKey');
```

## Contribution
Feel free to contribute and submit issues.

#### PR
Please make sure that your code is linted and getting build successfully


#### Thanks
Inspired by `rfink/sequelize-redis-cache/`

### License
MIT (Idan Gozlan)