"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

/* eslint-disable no-console */
var bluebird = require('bluebird');

var redis = require('redis');

var Sequelize = require('sequelize');

var SequelizeRedis = require('..');
/* Promisify Redis */


var redisClient = redis.createClient();
bluebird.promisifyAll(redisClient);
/* Create new Sequelize Redis instance */

var sequelizeRedis = new SequelizeRedis(redisClient);
var sequelize = new Sequelize('test_db', 'root', '1234', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});
var User = sequelize.define('user', {
  uuid: {
    type: Sequelize.UUID,
    primaryKey: true
  },
  username: Sequelize.STRING,
  birthday: Sequelize.DATE
});
var SRUser = sequelizeRedis.getModel(User, {
  ttl: 60 * 60 * 24
});
var userUUID = '75292c75-4c7a-4a11-92ac-57f929f50e23';
var userCacheKey = "user_".concat(userUUID);
sequelize.sync({
  force: true
}).then(
/*#__PURE__*/
(0, _asyncToGenerator2.default)(
/*#__PURE__*/
_regenerator.default.mark(function _callee() {
  var _ref2, _ref3, resUser, cacheHit, orgUser;

  return _regenerator.default.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return User.create({
            uuid: userUUID,
            username: 'idangozlan',
            birthday: new Date(1980, 6, 20)
          });

        case 2:
          _context.next = 4;
          return SRUser.findByPkCached(userCacheKey, userUUID);

        case 4:
          _ref2 = _context.sent;
          _ref3 = (0, _slicedToArray2.default)(_ref2, 2);
          resUser = _ref3[0];
          cacheHit = _ref3[1];
          console.log('Sequelize Redis Model:', resUser.toJSON(), cacheHit); // We can also use the non cached methods (original methods)

          _context.next = 11;
          return User.findByPk(userUUID);

        case 11:
          orgUser = _context.sent;
          console.log('Original Model:', orgUser.toJSON());
          _context.next = 15;
          return sequelize.close();

        case 15:
          _context.next = 17;
          return redisClient.quit();

        case 17:
        case "end":
          return _context.stop();
      }
    }
  }, _callee, this);
})));
