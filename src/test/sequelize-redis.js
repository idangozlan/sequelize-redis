import { config as runDotenv } from 'dotenv';
import redis from 'redis';
import bluebird from 'bluebird';
import Sequelize from 'sequelize';
import should from 'should';
import SequelizeRedis from '../index';

runDotenv(); // to run with .env file for local env vars

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const db = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'tests',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
};
const sequelizeOpts = {
  host: db.host,
  port: db.port,
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: !!process.env.DB_LOG,
  operatorsAliases: Sequelize.Op,
};

const redisPort = process.env.REDIS_PORT || 6379;
const redisHost = process.env.REDIS_HOST || '';

/* global describe */
/* global it */
/* global before */
/* global after */

function onErr(err) {
  throw err;
}

describe('Sequelize-Redis-Cache', () => {
  let redisClient;
  let sequelize;
  let User;
  let GitHubUser;
  let UserCacher;
  const cacheKey = 'test';
  const userTTL = 1; // seconds

  before(async () => {
    redisClient = redis.createClient({
      host: redisHost,
      prefix: 'test-sequelize-redis_',
      port: redisPort,
    });
    redisClient.on('error', onErr);

    sequelize = new Sequelize(db.database, db.user, db.password, sequelizeOpts);

    User = sequelize.define(
      'user', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        username: {
          unique: true,
          allowNull: false,
          type: Sequelize.STRING,
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
      },
      {
        tableName: 'User',
      },
    );

    GitHubUser = sequelize.define(
      'githubUser', {
        userId: {
          type: Sequelize.INTEGER,
        },
        username: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
      },
      {
        tableName: 'GitHubUser',
      },
    );
    GitHubUser.belongsTo(User, { foreignKey: 'userId' });
    User.hasOne(GitHubUser, { foreignKey: 'userId' });


    try {
      await sequelize.sync({ force: true });
    } catch (error) {
      throw new Error(`Cant sync Sequelize! ${error.message}`);
    }

    const user = await User.create({
      username: 'idan',
    });

    await GitHubUser.create({
      userId: user.get('id'),
      username: 'idangozlan',
    });

    await User.create({
      username: 'idan2',
    });

    const sequelizeCacher = new SequelizeRedis(redisClient);

    UserCacher = sequelizeCacher.getModel(User, { ttl: userTTL });
  });

  it('should fetch user from database with original Sequelize model', async () => {
    const user = await User.findById(1);
    should.exist(user);
    user.get('username').should.equal('idan');
  });

  it('should fetch users from database with raw:true option', async () => {
    redisClient.del(cacheKey);
    const [users, isCached] = await UserCacher.findAllCached(cacheKey, { raw: true });
    should.exist(users);
    users.length.should.equal(2);
    isCached.should.equal(false);
    users.toString().includes(('[object SequelizeInstance')).should.equal(false);
  });

  it('should fetch user from database with cached Sequelize model with original method', async () => {
    const user = await UserCacher.findById(1);
    should.exist(user);
    user.get('username').should.equal('idan');
  });

  it('should fetch user from database', async () => {
    redisClient.del(cacheKey);
    const [user, isCached] = await UserCacher.findByIdCached(cacheKey, 1);
    should.exist(user);
    isCached.should.equal(false);
    user.get('username').should.equal('idan');
  });

  it('should fetch user from cache', async () => {
    const [user, isCached] = await UserCacher.findByIdCached(cacheKey, 1);
    should.exist(user);
    isCached.should.equal(true);
    user.get('username').should.equal('idan');
  });

  it('should fetch user from database after ttl reached', async () => (new Promise((resolve, reject) => {
    setTimeout(async () => {
      const [user, isCached] = await UserCacher.findByIdCached(cacheKey, 1);
      try {
        should.exist(user);
        isCached.should.equal(false);
        user.get('username').should.equal('idan');
      } catch (error) {
        reject(error);
      }

      return resolve();
    }, (userTTL * 1000));
  })));

  it('should fetch empty res with not cached flag', async () => {
    const [user, isCached] = await UserCacher.findByIdCached('user_3', 3);
    should.not.exist(user);
    isCached.should.equal(false);
  });

  it('should fetch users from db', async () => {
    redisClient.del(cacheKey);
    const [users, isCached] = await UserCacher.findAllCached(cacheKey);
    should.exist(users);
    users.length.should.equal(2);
    isCached.should.equal(false);
    users[0].get('username').should.equal('idan');
    users[1].get('username').should.equal('idan2');
  });

  it('should fetch users from cache', async () => {
    const [users, isCached] = await UserCacher.findAllCached(cacheKey);
    should.exist(users);
    users.length.should.equal(2);
    isCached.should.equal(true);
    users[0].get('username').should.equal('idan');
    users[1].get('username').should.equal('idan2');
  });

  it('should fetch users from db and spread associations into JSON', async () => {
    redisClient.del(cacheKey);
    const [users, isCached] = await UserCacher.findAllCached(cacheKey, { include: [GitHubUser] });
    should.exist(users);
    users.length.should.equal(2);
    isCached.should.equal(false);
    users[0].githubUser.username.should.equal('idangozlan');
    users[0].githubUser.get('username').should.equal('idangozlan');
  });

  it('should fetch users from cache with spreaded associations', async () => {
    const [users, isCached] = await UserCacher.findAllCached(cacheKey, { include: [GitHubUser] });
    should.exist(users);
    users.length.should.equal(2);
    isCached.should.equal(true);
    users[0].githubUser.username.should.equal('idangozlan');
    users[0].githubUser.get('username').should.equal('idangozlan');
  });


  it('should fetch users from cache with offset and limit', async () => {
    const limit = 1;
    const [users, isCached] = await UserCacher.findAllCached(cacheKey, { offset: 1, limit });
    should.exist(users);
    users.length.should.equal(limit);
    isCached.should.equal(true);
    users[0].username.should.equal('idan2');
    users[0].get('username').should.equal('idan2');
  });

  it('should fetch users from cache with offset and limit with raw', async () => {
    const limit = 1;
    const [users, isCached] = await UserCacher.findAllCached(cacheKey, { raw: true, offset: 1, limit });
    should.exist(users);
    users.length.should.equal(limit);
    isCached.should.equal(true);
    users[0].username.should.equal('idan2');
  });

  it('should fetch user with includes from database', async () => {
    redisClient.del(cacheKey);
    const [user, isCached] = await UserCacher.findOneCached(cacheKey, {
      where: {
        id: 1,
      },
      include: [GitHubUser],
    });
    isCached.should.equal(false);
    should.exist(user);
    should.exist(user.githubUser);
    user.get('username').should.equal('idan');
    user.githubUser.get('username').should.equal('idangozlan');
  });

  it('should fetch user with includes from cache', async () => {
    const [user, isCached] = await UserCacher.findOneCached(cacheKey, {
      where: {
        id: 1,
      },
      include: [GitHubUser],
    });
    isCached.should.equal(true);
    should.exist(user);
    should.exist(user.githubUser);
    user.get('username').should.equal('idan');
    user.githubUser.get('username').should.equal('idangozlan');
  });

  it('should findAndCountAll from db', async () => {
    redisClient.del(cacheKey);
    const [res, isCached] = await UserCacher.findAndCountAllCached(cacheKey, {
      where: {
        username: 'idan',
      },
    });

    isCached.should.equal(false);
    should.exist(res);
    res.should.have.property('count', 1);
    res.should.have.property('rows');
    res.rows.length.should.equal(1);
    res.rows[0].get('username').should.equal('idan');
  });

  it('should findAndCountAll from cache', async () => {
    const [res, isCached] = await UserCacher.findAndCountAllCached(cacheKey, {
      where: {
        username: 'idan',
      },
    });

    isCached.should.equal(true);
    should.exist(res);
    res.should.have.property('count', 1);
    res.should.have.property('rows');
    res.rows.length.should.equal(1);
    res.rows[0].get('username').should.equal('idan');
  });

  it('should count from db', async () => {
    redisClient.del(cacheKey);
    const [res, isCached] = await UserCacher.countCached(cacheKey, {
      where: {
        username: 'idan',
      },
    });

    isCached.should.equal(false);
    should.exist(res);
    res.should.equal(1);
  });

  it('should count from cache', async () => {
    const [res, isCached] = await UserCacher.countCached(cacheKey, {
      where: {
        username: 'idan',
      },
    });

    isCached.should.equal(true);
    should.exist(res);
    res.should.equal(1);
  });

  it('should sum from db', async () => {
    redisClient.del(cacheKey);
    const [res, isCached] = await UserCacher.sumCached(cacheKey, 'id');

    isCached.should.equal(false);
    should.exist(res);
    res.should.equal(3); // user id 1 + user id 2 = 3
  });

  it('should sum from cache', async () => {
    const [res, isCached] = await UserCacher.sumCached(cacheKey, 'id');

    isCached.should.equal(true);
    should.exist(res);
    res.should.equal(3); // user id 1 + user id 2 = 3
  });

  it('should max from db', async () => {
    redisClient.del(cacheKey);
    const [res, isCached] = await UserCacher.maxCached(cacheKey, 'id');

    isCached.should.equal(false);
    should.exist(res);
    res.should.equal(2); // user id 2
  });

  it('should max from cache', async () => {
    const [res, isCached] = await UserCacher.maxCached(cacheKey, 'id');

    isCached.should.equal(true);
    should.exist(res);
    res.should.equal(2); // user id 2
  });

  it('should min from db', async () => {
    redisClient.del(cacheKey);
    const [res, isCached] = await UserCacher.minCached(cacheKey, 'id');

    isCached.should.equal(false);
    should.exist(res);
    res.should.equal(1); // user id 1
  });

  it('should min from cache', async () => {
    const [res, isCached] = await UserCacher.minCached(cacheKey, 'id');

    isCached.should.equal(true);
    should.exist(res);
    res.should.equal(1); // user id 1
  });
});
