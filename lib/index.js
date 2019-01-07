"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var SequelizeRedisModel = require('./SequelizeRedisModel');

module.exports =
/*#__PURE__*/
function () {
  function SequelizeRedis(redisClient) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck2.default)(this, SequelizeRedis);
    this.redisClient = redisClient;
    this.options = options;
  }

  (0, _createClass2.default)(SequelizeRedis, [{
    key: "getModel",
    value: function getModel(model) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return new SequelizeRedisModel(model, this.redisClient, (0, _objectSpread2.default)({}, this.options, options));
    }
  }]);
  return SequelizeRedis;
}();