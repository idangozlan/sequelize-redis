'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _dotenv = require('dotenv');

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _should = require('should');

var _should2 = _interopRequireDefault(_should);

var _ = require('..');

var _2 = _interopRequireDefault(_);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _dotenv.config)(); // to run with .env file for local env vars

_bluebird2.default.promisifyAll(_redis2.default.RedisClient.prototype);
_bluebird2.default.promisifyAll(_redis2.default.Multi.prototype);

var db = {
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tests',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || ''
};
var sequelizeOpts = {
  host: db.host,
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: !!process.env.DB_LOG,
  operatorsAliases: _sequelize2.default.Op
};

var redisPort = process.env.REDIS_PORT || 6379;
var redisHost = process.env.REDIS_HOST || '';

/* global describe */
/* global it */
/* global before */
/* global after */

function onErr(err) {
  throw err;
}

describe('Sequelize-Redis-Cache', function () {
  var redisClient = void 0;
  var sequelize = void 0;
  var User = void 0;
  var GitHubUser = void 0;
  var UserCacher = void 0;
  var cacheKey = 'test';
  var userTTL = 1; // seconds

  before((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
    var user, sequelizeCacher;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            redisClient = _redis2.default.createClient({
              host: redisHost,
              prefix: 'test-sequelize-redis_',
              port: redisPort
            });
            redisClient.on('error', onErr);

            sequelize = new _sequelize2.default(db.database, db.user, db.password, sequelizeOpts);

            User = sequelize.define('user', {
              id: {
                type: _sequelize2.default.INTEGER,
                primaryKey: true,
                autoIncrement: true
              },
              username: {
                unique: true,
                allowNull: false,
                type: _sequelize2.default.STRING
              },
              createdAt: _sequelize2.default.DATE,
              updatedAt: _sequelize2.default.DATE
            }, {
              tableName: 'User'
            });

            GitHubUser = sequelize.define('githubUser', {
              userId: {
                type: _sequelize2.default.INTEGER
              },
              username: {
                type: _sequelize2.default.STRING,
                primaryKey: true
              },
              createdAt: _sequelize2.default.DATE,
              updatedAt: _sequelize2.default.DATE
            }, {
              tableName: 'GitHubUser'
            });
            GitHubUser.belongsTo(User, { foreignKey: 'userId' });
            User.hasOne(GitHubUser, { foreignKey: 'userId' });

            _context.prev = 7;
            _context.next = 10;
            return sequelize.sync({ force: true });

          case 10:
            _context.next = 15;
            break;

          case 12:
            _context.prev = 12;
            _context.t0 = _context['catch'](7);
            throw new Error('Cant sync Sequelize! ' + _context.t0.message);

          case 15:
            _context.next = 17;
            return User.create({
              username: 'idan'
            });

          case 17:
            user = _context.sent;
            _context.next = 20;
            return GitHubUser.create({
              userId: user.get('id'),
              username: 'idangozlan'
            });

          case 20:
            _context.next = 22;
            return User.create({
              username: 'idan2'
            });

          case 22:
            sequelizeCacher = new _2.default(redisClient);


            UserCacher = sequelizeCacher.getModel(User, { ttl: userTTL });

          case 24:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[7, 12]]);
  })));

  it('should fetch user from database with original Sequelize model', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
    var user;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return User.findById(1);

          case 2:
            user = _context2.sent;

            _should2.default.exist(user);
            user.get('username').should.equal('idan');

          case 5:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  })));

  it('should fetch user from database with cached Sequelize model with original method', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
    var user;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return UserCacher.findById(1);

          case 2:
            user = _context3.sent;

            _should2.default.exist(user);
            user.get('username').should.equal('idan');

          case 5:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  })));

  it('should fetch user from database', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
    var _ref5, _ref6, user, isCached;

    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            redisClient.del(cacheKey);
            _context4.next = 3;
            return UserCacher.findByIdCached(cacheKey, 1);

          case 3:
            _ref5 = _context4.sent;
            _ref6 = (0, _slicedToArray3.default)(_ref5, 2);
            user = _ref6[0];
            isCached = _ref6[1];

            _should2.default.exist(user);
            isCached.should.equal(false);
            user.get('username').should.equal('idan');

          case 10:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  })));

  it('should fetch user from cache', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5() {
    var _ref8, _ref9, user, isCached;

    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return UserCacher.findByIdCached(cacheKey, 1);

          case 2:
            _ref8 = _context5.sent;
            _ref9 = (0, _slicedToArray3.default)(_ref8, 2);
            user = _ref9[0];
            isCached = _ref9[1];

            _should2.default.exist(user);
            isCached.should.equal(true);
            user.get('username').should.equal('idan');

          case 9:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, undefined);
  })));

  it('should fetch user from database after ttl reached', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7() {
    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            return _context7.abrupt('return', new _promise2.default(function (resolve, reject) {
              setTimeout((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6() {
                var _ref12, _ref13, user, isCached;

                return _regenerator2.default.wrap(function _callee6$(_context6) {
                  while (1) {
                    switch (_context6.prev = _context6.next) {
                      case 0:
                        _context6.next = 2;
                        return UserCacher.findByIdCached(cacheKey, 1);

                      case 2:
                        _ref12 = _context6.sent;
                        _ref13 = (0, _slicedToArray3.default)(_ref12, 2);
                        user = _ref13[0];
                        isCached = _ref13[1];

                        try {
                          _should2.default.exist(user);
                          isCached.should.equal(false);
                          user.get('username').should.equal('idan');
                        } catch (error) {
                          reject(error);
                        }

                        return _context6.abrupt('return', resolve());

                      case 8:
                      case 'end':
                        return _context6.stop();
                    }
                  }
                }, _callee6, undefined);
              })), userTTL * 1000);
            }));

          case 1:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, undefined);
  })));

  it('should fetch empty res with not cached flag', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8() {
    var _ref15, _ref16, user, isCached;

    return _regenerator2.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return UserCacher.findByIdCached('user_3', 3);

          case 2:
            _ref15 = _context8.sent;
            _ref16 = (0, _slicedToArray3.default)(_ref15, 2);
            user = _ref16[0];
            isCached = _ref16[1];

            _should2.default.not.exist(user);
            isCached.should.equal(false);

          case 8:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, undefined);
  })));

  it('should fetch users from db', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee9() {
    var _ref18, _ref19, users, isCached;

    return _regenerator2.default.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            redisClient.del(cacheKey);
            _context9.next = 3;
            return UserCacher.findAllCached(cacheKey);

          case 3:
            _ref18 = _context9.sent;
            _ref19 = (0, _slicedToArray3.default)(_ref18, 2);
            users = _ref19[0];
            isCached = _ref19[1];

            _should2.default.exist(users);
            users.length.should.equal(2);
            isCached.should.equal(false);
            users[0].get('username').should.equal('idan');
            users[1].get('username').should.equal('idan2');

          case 12:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, undefined);
  })));

  it('should fetch users from cache', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee10() {
    var _ref21, _ref22, users, isCached;

    return _regenerator2.default.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.next = 2;
            return UserCacher.findAllCached(cacheKey);

          case 2:
            _ref21 = _context10.sent;
            _ref22 = (0, _slicedToArray3.default)(_ref21, 2);
            users = _ref22[0];
            isCached = _ref22[1];

            _should2.default.exist(users);
            users.length.should.equal(2);
            isCached.should.equal(true);
            users[0].get('username').should.equal('idan');
            users[1].get('username').should.equal('idan2');

          case 11:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, undefined);
  })));

  it('should fetch user with includes from database', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee11() {
    var _ref24, _ref25, user, isCached;

    return _regenerator2.default.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            redisClient.del(cacheKey);
            _context11.next = 3;
            return UserCacher.findOneCached(cacheKey, {
              where: {
                id: 1
              },
              include: [GitHubUser]
            });

          case 3:
            _ref24 = _context11.sent;
            _ref25 = (0, _slicedToArray3.default)(_ref24, 2);
            user = _ref25[0];
            isCached = _ref25[1];

            isCached.should.equal(false);
            _should2.default.exist(user);
            _should2.default.exist(user.githubUser);
            user.get('username').should.equal('idan');
            user.githubUser.get('username').should.equal('idangozlan');

          case 12:
          case 'end':
            return _context11.stop();
        }
      }
    }, _callee11, undefined);
  })));

  it('should fetch user with includes from cache', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee12() {
    var _ref27, _ref28, user, isCached;

    return _regenerator2.default.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            _context12.next = 2;
            return UserCacher.findOneCached(cacheKey, {
              where: {
                id: 1
              },
              include: [GitHubUser]
            });

          case 2:
            _ref27 = _context12.sent;
            _ref28 = (0, _slicedToArray3.default)(_ref27, 2);
            user = _ref28[0];
            isCached = _ref28[1];

            isCached.should.equal(true);
            _should2.default.exist(user);
            _should2.default.exist(user.githubUser);
            user.get('username').should.equal('idan');
            user.githubUser.get('username').should.equal('idangozlan');

          case 11:
          case 'end':
            return _context12.stop();
        }
      }
    }, _callee12, undefined);
  })));

  it('should findAndCountAll from db', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee13() {
    var _ref30, _ref31, res, isCached;

    return _regenerator2.default.wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            redisClient.del(cacheKey);
            _context13.next = 3;
            return UserCacher.findAndCountAllCached(cacheKey, {
              where: {
                username: 'idan'
              }
            });

          case 3:
            _ref30 = _context13.sent;
            _ref31 = (0, _slicedToArray3.default)(_ref30, 2);
            res = _ref31[0];
            isCached = _ref31[1];


            isCached.should.equal(false);
            _should2.default.exist(res);
            res.should.have.property('count', 1);
            res.should.have.property('rows');
            res.rows.length.should.equal(1);
            res.rows[0].get('username').should.equal('idan');

          case 13:
          case 'end':
            return _context13.stop();
        }
      }
    }, _callee13, undefined);
  })));

  it('should findAndCountAll from cache', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee14() {
    var _ref33, _ref34, res, isCached;

    return _regenerator2.default.wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            _context14.next = 2;
            return UserCacher.findAndCountAllCached(cacheKey, {
              where: {
                username: 'idan'
              }
            });

          case 2:
            _ref33 = _context14.sent;
            _ref34 = (0, _slicedToArray3.default)(_ref33, 2);
            res = _ref34[0];
            isCached = _ref34[1];


            isCached.should.equal(true);
            _should2.default.exist(res);
            res.should.have.property('count', 1);
            res.should.have.property('rows');
            res.rows.length.should.equal(1);
            res.rows[0].get('username').should.equal('idan');

          case 12:
          case 'end':
            return _context14.stop();
        }
      }
    }, _callee14, undefined);
  })));

  it('should count from db', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee15() {
    var _ref36, _ref37, res, isCached;

    return _regenerator2.default.wrap(function _callee15$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            redisClient.del(cacheKey);
            _context15.next = 3;
            return UserCacher.countCached(cacheKey, {
              where: {
                username: 'idan'
              }
            });

          case 3:
            _ref36 = _context15.sent;
            _ref37 = (0, _slicedToArray3.default)(_ref36, 2);
            res = _ref37[0];
            isCached = _ref37[1];


            isCached.should.equal(false);
            _should2.default.exist(res);
            res.should.equal(1);

          case 10:
          case 'end':
            return _context15.stop();
        }
      }
    }, _callee15, undefined);
  })));

  it('should count from cache', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee16() {
    var _ref39, _ref40, res, isCached;

    return _regenerator2.default.wrap(function _callee16$(_context16) {
      while (1) {
        switch (_context16.prev = _context16.next) {
          case 0:
            _context16.next = 2;
            return UserCacher.countCached(cacheKey, {
              where: {
                username: 'idan'
              }
            });

          case 2:
            _ref39 = _context16.sent;
            _ref40 = (0, _slicedToArray3.default)(_ref39, 2);
            res = _ref40[0];
            isCached = _ref40[1];


            isCached.should.equal(true);
            _should2.default.exist(res);
            res.should.equal(1);

          case 9:
          case 'end':
            return _context16.stop();
        }
      }
    }, _callee16, undefined);
  })));

  it('should sum from db', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee17() {
    var _ref42, _ref43, res, isCached;

    return _regenerator2.default.wrap(function _callee17$(_context17) {
      while (1) {
        switch (_context17.prev = _context17.next) {
          case 0:
            redisClient.del(cacheKey);
            _context17.next = 3;
            return UserCacher.sumCached(cacheKey, 'id');

          case 3:
            _ref42 = _context17.sent;
            _ref43 = (0, _slicedToArray3.default)(_ref42, 2);
            res = _ref43[0];
            isCached = _ref43[1];


            isCached.should.equal(false);
            _should2.default.exist(res);
            res.should.equal(3); // user id 1 + user id 2 = 3

          case 10:
          case 'end':
            return _context17.stop();
        }
      }
    }, _callee17, undefined);
  })));

  it('should sum from cache', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee18() {
    var _ref45, _ref46, res, isCached;

    return _regenerator2.default.wrap(function _callee18$(_context18) {
      while (1) {
        switch (_context18.prev = _context18.next) {
          case 0:
            _context18.next = 2;
            return UserCacher.sumCached(cacheKey, 'id');

          case 2:
            _ref45 = _context18.sent;
            _ref46 = (0, _slicedToArray3.default)(_ref45, 2);
            res = _ref46[0];
            isCached = _ref46[1];


            isCached.should.equal(true);
            _should2.default.exist(res);
            res.should.equal(3); // user id 1 + user id 2 = 3

          case 9:
          case 'end':
            return _context18.stop();
        }
      }
    }, _callee18, undefined);
  })));

  it('should max from db', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee19() {
    var _ref48, _ref49, res, isCached;

    return _regenerator2.default.wrap(function _callee19$(_context19) {
      while (1) {
        switch (_context19.prev = _context19.next) {
          case 0:
            redisClient.del(cacheKey);
            _context19.next = 3;
            return UserCacher.maxCached(cacheKey, 'id');

          case 3:
            _ref48 = _context19.sent;
            _ref49 = (0, _slicedToArray3.default)(_ref48, 2);
            res = _ref49[0];
            isCached = _ref49[1];


            isCached.should.equal(false);
            _should2.default.exist(res);
            res.should.equal(2); // user id 2

          case 10:
          case 'end':
            return _context19.stop();
        }
      }
    }, _callee19, undefined);
  })));

  it('should max from cache', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee20() {
    var _ref51, _ref52, res, isCached;

    return _regenerator2.default.wrap(function _callee20$(_context20) {
      while (1) {
        switch (_context20.prev = _context20.next) {
          case 0:
            _context20.next = 2;
            return UserCacher.maxCached(cacheKey, 'id');

          case 2:
            _ref51 = _context20.sent;
            _ref52 = (0, _slicedToArray3.default)(_ref51, 2);
            res = _ref52[0];
            isCached = _ref52[1];


            isCached.should.equal(true);
            _should2.default.exist(res);
            res.should.equal(2); // user id 2

          case 9:
          case 'end':
            return _context20.stop();
        }
      }
    }, _callee20, undefined);
  })));

  it('should min from db', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee21() {
    var _ref54, _ref55, res, isCached;

    return _regenerator2.default.wrap(function _callee21$(_context21) {
      while (1) {
        switch (_context21.prev = _context21.next) {
          case 0:
            redisClient.del(cacheKey);
            _context21.next = 3;
            return UserCacher.minCached(cacheKey, 'id');

          case 3:
            _ref54 = _context21.sent;
            _ref55 = (0, _slicedToArray3.default)(_ref54, 2);
            res = _ref55[0];
            isCached = _ref55[1];


            isCached.should.equal(false);
            _should2.default.exist(res);
            res.should.equal(1); // user id 1

          case 10:
          case 'end':
            return _context21.stop();
        }
      }
    }, _callee21, undefined);
  })));

  it('should min from cache', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee22() {
    var _ref57, _ref58, res, isCached;

    return _regenerator2.default.wrap(function _callee22$(_context22) {
      while (1) {
        switch (_context22.prev = _context22.next) {
          case 0:
            _context22.next = 2;
            return UserCacher.minCached(cacheKey, 'id');

          case 2:
            _ref57 = _context22.sent;
            _ref58 = (0, _slicedToArray3.default)(_ref57, 2);
            res = _ref58[0];
            isCached = _ref58[1];


            isCached.should.equal(true);
            _should2.default.exist(res);
            res.should.equal(1); // user id 1

          case 9:
          case 'end':
            return _context22.stop();
        }
      }
    }, _callee22, undefined);
  })));
});