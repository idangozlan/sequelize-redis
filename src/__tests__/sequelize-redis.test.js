import { config as runDotenv } from 'dotenv';
import Sequelize from 'sequelize';
import redisClient from '../../jest/redisClient';
import SequelizeRedis from '../index';

runDotenv(); // to run with .env file for local env vars

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

/* global describe */
/* global it */
/* global before */
/* global after */

function onErr(err) {
  throw err;
}

describe('Sequelize-Redis-Cache', () => {
  let sequelize;
  let User;
  let GitHubUser;
  let UserCacher;
  let GitHubUserCacher;
  const cacheKey = 'test';
  const cacheKeyGitUser = 'test2';
  const userTTL = 1; // seconds

  beforeAll(async () => {
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
      },
      {
        tableName: 'User',
        timestamps: true,
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
      },
      {
        tableName: 'GitHubUser',
        timestamps: true,
        createdAt: 'myCustomDate',
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
    GitHubUserCacher = sequelizeCacher.getModel(GitHubUser, { ttl: userTTL });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should fetch user from database with original Sequelize model', async () => {
    expect.assertions(1);

    const user = await User.findByPk(1);
    expect(user.get('username')).toEqual('idan');
  });

  it('should fetch users from database with raw:true option', async () => {
    expect.assertions(3);

    redisClient.del(cacheKey);
    const [users, isCached] = await UserCacher.findAllCached(cacheKey, { raw: true });

    expect(users.length).toEqual(2);
    expect(isCached).toEqual(false);
    expect(users.toString().includes(('[object SequelizeInstance'))).toEqual(false);
  });

  it('should fetch user from database with cached Sequelize model with original method', async () => {
    expect.assertions(1);

    const user = await UserCacher.findByPk(1);
    expect(user.get('username')).toEqual('idan');
  });

  it('should fetch user from database', async () => {
    expect.assertions(2);

    redisClient.del(cacheKey);
    const [user, isCached] = await UserCacher.findByPkCached(cacheKey, 1);

    expect(isCached).toEqual(false);
    expect(user.get('username')).toEqual('idan');
  });

  it('should fetch user from cache', async () => {
    expect.assertions(2);

    const [user, isCached] = await UserCacher.findByPkCached(cacheKey, 1);

    expect(isCached).toEqual(true);
    expect(user.get('username')).toEqual('idan');
  });

  it('should fetch user from database after ttl reached', async () => (new Promise(async (resolve, reject) => {
    expect.assertions(2);

    await (new Promise(resolveTimeout => setTimeout(resolveTimeout, userTTL * 1000)));
    const [user, isCached] = await UserCacher.findByPkCached(cacheKey, 1);
    try {
      expect(isCached).toEqual(false);
      expect(user.get('username')).toEqual('idan');
    } catch (error) {
      reject(error);
    }

    return resolve();
  })));

  it('should fetch empty res with not cached flag', async () => {
    expect.assertions(2);

    const [user, isCached] = await UserCacher.findByPkCached('user_3', 3);
    expect(user).toBe(null);
    expect(isCached).toEqual(false);
  });

  it('should fetch users from db', async () => {
    expect.assertions(4);

    redisClient.del(cacheKey);
    const [users, isCached] = await UserCacher.findAllCached(cacheKey);

    expect(users.length).toEqual(2);
    expect(isCached).toEqual(false);
    expect(users[0].get('username')).toEqual('idan');
    expect(users[1].get('username')).toEqual('idan2');
  });

  it('should fetch users from cache', async () => {
    expect.assertions(4);
    const [users, isCached] = await UserCacher.findAllCached(cacheKey);

    expect(users.length).toEqual(2);
    expect(isCached).toEqual(true);
    expect(users[0].get('username')).toEqual('idan');
    expect(users[1].get('username')).toEqual('idan2');
  });

  it('should fetch users from db and spread associations into JSON', async () => {
    expect.assertions(4);

    redisClient.del(cacheKey);
    const [users, isCached] = await UserCacher.findAllCached(cacheKey, { include: [GitHubUser] });

    expect(users.length).toEqual(2);
    expect(isCached).toEqual(false);
    expect(users[0].githubUser.username).toEqual('idangozlan');
    expect(users[0].githubUser.get('username')).toEqual('idangozlan');
  });

  it('should fetch users from cache with spreaded associations', async () => {
    expect.assertions(4);

    const [users, isCached] = await UserCacher.findAllCached(cacheKey, { include: [GitHubUser] });

    expect(users.length).toEqual(2);
    expect(isCached).toEqual(true);
    expect(users[0].githubUser.username).toEqual('idangozlan');
    expect(users[0].githubUser.get('username')).toEqual('idangozlan');
  });

  it('should return the cached data to an instance with timestamps', async () => {
    expect.assertions(3);

    const [users, isCached] = await UserCacher.findAllCached(cacheKey, { include: [GitHubUser] });
    const date = new Date(users[0].get('createdAt'));

    expect(isCached).toEqual(true);
    expect(date instanceof Date).toBeTruthy();
    expect(date.valueOf()).not.toBeNaN();
  });

  it('should return the cached data to an instance with timestamps with renamed timestamp fields', async () => {
    expect.assertions(3);

    redisClient.del(cacheKeyGitUser);
    await GitHubUserCacher.findOneCached(cacheKeyGitUser); // write to cache
    const [user, isCached] = await GitHubUserCacher.findOneCached(cacheKeyGitUser); // fetch from cache

    const date = new Date(user.get('myCustomDate'));

    expect(isCached).toEqual(true);
    expect(date instanceof Date).toBeTruthy();
    expect(date.valueOf()).not.toBeNaN();
  });

  it('should fetch user with includes from database', async () => {
    expect.assertions(3);

    redisClient.del(cacheKey);
    const [user, isCached] = await UserCacher.findOneCached(cacheKey, {
      where: {
        id: 1,
      },
      include: [GitHubUser],
    });
    expect(isCached).toEqual(false);
    expect(user.get('username')).toEqual('idan');
    expect(user.githubUser.get('username')).toEqual('idangozlan');
  });

  it('should fetch user with includes from cache', async () => {
    expect.assertions(3);

    const [user, isCached] = await UserCacher.findOneCached(cacheKey, {
      where: {
        id: 1,
      },
      include: [GitHubUser],
    });
    expect(isCached).toEqual(true);
    expect(user.get('username')).toEqual('idan');
    expect(user.githubUser.get('username')).toEqual('idangozlan');
  });

  it('should findAndCountAll from db', async () => {
    expect.assertions(5);

    redisClient.del(cacheKey);
    const [res, isCached] = await UserCacher.findAndCountAllCached(cacheKey, {
      where: {
        username: 'idan',
      },
    });

    expect(isCached).toEqual(false);
    expect(res.count).toEqual(1);
    expect(res.rows).not.toBe(null);
    expect(res.rows.length).toEqual(1);
    expect(res.rows[0].get('username')).toEqual('idan');
  });

  it('should findAndCountAll from cache', async () => {
    expect.assertions(5);

    const [res, isCached] = await UserCacher.findAndCountAllCached(cacheKey, {
      where: {
        username: 'idan',
      },
    });

    expect(isCached).toEqual(true);
    expect(res.count).toEqual(1);
    expect(res.rows).not.toBe(null);
    expect(res.rows.length).toEqual(1);
    expect(res.rows[0].get('username')).toEqual('idan');
  });

  it('should count from db', async () => {
    expect.assertions(2);

    redisClient.del(cacheKey);
    const [res, isCached] = await UserCacher.countCached(cacheKey, {
      where: {
        username: 'idan',
      },
    });

    expect(isCached).toEqual(false);
    expect(res).toEqual(1);
  });

  it('should count from cache', async () => {
    expect.assertions(2);

    const [res, isCached] = await UserCacher.countCached(cacheKey, {
      where: {
        username: 'idan',
      },
    });

    expect(isCached).toEqual(true);

    expect(res).toEqual(1);
  });

  it('should sum from db', async () => {
    expect.assertions(2);

    redisClient.del(cacheKey);
    const [res, isCached] = await UserCacher.sumCached(cacheKey, 'id');

    expect(isCached).toEqual(false);

    expect(res).toEqual(3); // user id 1 + user id 2 = 3
  });

  it('should sum from cache', async () => {
    expect.assertions(2);

    const [res, isCached] = await UserCacher.sumCached(cacheKey, 'id');

    expect(isCached).toEqual(true);

    expect(res).toEqual(3); // user id 1 + user id 2 = 3
  });

  it('should max from db', async () => {
    expect.assertions(2);

    redisClient.del(cacheKey);
    const [res, isCached] = await UserCacher.maxCached(cacheKey, 'id');

    expect(isCached).toEqual(false);

    expect(res).toEqual(2); // user id 2
  });

  it('should max from cache', async () => {
    expect.assertions(2);

    const [res, isCached] = await UserCacher.maxCached(cacheKey, 'id');

    expect(isCached).toEqual(true);

    expect(res).toEqual(2); // user id 2
  });

  it('should min from db', async () => {
    expect.assertions(2);

    redisClient.del(cacheKey);
    const [res, isCached] = await UserCacher.minCached(cacheKey, 'id');

    expect(isCached).toEqual(false);

    expect(res).toEqual(1); // user id 1
  });

  it('should min from cache', async () => {
    expect.assertions(2);

    const [res, isCached] = await UserCacher.minCached(cacheKey, 'id');

    expect(isCached).toEqual(true);

    expect(res).toEqual(1); // user id 1
  });
});
