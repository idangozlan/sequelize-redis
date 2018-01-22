'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _SequelizeRedisModel = require('./SequelizeRedisModel');

var _SequelizeRedisModel2 = _interopRequireDefault(_SequelizeRedisModel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SequelizeRedis = function () {
  function SequelizeRedis(redisClient) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck3.default)(this, SequelizeRedis);

    this.redisClient = redisClient;
    this.options = options;
  }

  (0, _createClass3.default)(SequelizeRedis, [{
    key: 'getModel',
    value: function getModel(model) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return new _SequelizeRedisModel2.default(model, this.redisClient, (0, _extends3.default)({}, this.options, options));
    }
  }]);
  return SequelizeRedis;
}();

exports.default = SequelizeRedis;