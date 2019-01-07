/* eslint-disable no-console */
const bluebird = require('bluebird');
const redis = require('redis');
const Sequelize = require('sequelize');
const SequelizeRedis = require('..');

/* Promisify Redis */
const redisClient = redis.createClient();
bluebird.promisifyAll(redisClient);

/* Create new Sequelize Redis instance */
const sequelizeRedis = new SequelizeRedis(redisClient);


const sequelize = new Sequelize('test_db', 'root', '1234', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const User = sequelize.define('user', {
  uuid: {
    type: Sequelize.UUID,
    primaryKey: true,
  },
  username: Sequelize.STRING,
  birthday: Sequelize.DATE,
});

const SRUser = sequelizeRedis.getModel(User, { ttl: 60 * 60 * 24 });

const userUUID = '75292c75-4c7a-4a11-92ac-57f929f50e23';
const userCacheKey = `user_${userUUID}`;

sequelize.sync({ force: true })
  .then(async () => {
    await User.create({
      uuid: userUUID,
      username: 'idangozlan',
      birthday: new Date(1980, 6, 20),
    });

    // We can use the default sequelize methods by adding suffix of "Cached"
    // for example, findByIdCached:
    const [resUser, cacheHit] = await SRUser.findByPkCached(userCacheKey, userUUID);
    console.log('Sequelize Redis Model:', resUser.toJSON(), cacheHit);


    // We can also use the non cached methods (original methods)
    const orgUser = await User.findByPk(userUUID);
    console.log('Original Model:', orgUser.toJSON());

    await sequelize.close();
    await redisClient.quit();
  });
