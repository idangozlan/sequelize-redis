"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _require = require('json-buffer'),
    stringify = _require.stringify,
    parse = _require.parse;

var methods = ['find', 'findOne', 'findAll', 'findAndCount', 'findAndCountAll', 'findById', 'findByPk', 'all', 'min', 'max', 'sum', 'count'];

module.exports =
/*#__PURE__*/
function () {
  function SequelizeRedisModel(model, redisPromisifiedClient) {
    var _this = this;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    (0, _classCallCheck2.default)(this, SequelizeRedisModel);
    this.options = (0, _objectSpread2.default)({}, options);
    this.model = model;
    this.redisClient = redisPromisifiedClient;
    methods.forEach(function (method) {
      _this["".concat(method, "Cached")] =
      /*#__PURE__*/
      function () {
        var _ref = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee(cacheKey) {
          var _len,
              args,
              _key,
              _args = arguments;

          return _regenerator.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  for (_len = _args.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    args[_key - 1] = _args[_key];
                  }

                  return _context.abrupt("return", _this.run.apply(_this, [cacheKey, method].concat(args)));

                case 2:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }();

      _this[method] =
      /*#__PURE__*/
      (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee2() {
        var _this$model;

        var _args2 = arguments;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt("return", (_this$model = _this.model)[method].apply(_this$model, _args2));

              case 1:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));
    });
  }

  (0, _createClass2.default)(SequelizeRedisModel, [{
    key: "run",
    value: function () {
      var _run = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee3(cacheKey, method) {
        var _this2 = this,
            _this$model2;

        var cached,
            _len2,
            args,
            _key2,
            parsed,
            _result,
            queryOptions,
            buildOptions,
            result,
            toCache,
            _args3 = arguments;

        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (methods.includes(method)) {
                  _context3.next = 2;
                  break;
                }

                throw new Error('Unsupported method');

              case 2:
                if (this.model[method]) {
                  _context3.next = 4;
                  break;
                }

                throw new Error('Unsupported Method by Sequelize model');

              case 4:
                _context3.prev = 4;
                _context3.next = 7;
                return this.redisClient.getAsync(cacheKey);

              case 7:
                cached = _context3.sent;
                _context3.next = 13;
                break;

              case 10:
                _context3.prev = 10;
                _context3.t0 = _context3["catch"](4);
                throw new Error("Cant get cached object from Redis ".concat(_context3.t0.message));

              case 13:
                for (_len2 = _args3.length, args = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
                  args[_key2 - 2] = _args3[_key2];
                }

                if (!cached) {
                  _context3.next = 31;
                  break;
                }

                _context3.prev = 15;
                parsed = parse(cached);
                _context3.next = 22;
                break;

              case 19:
                _context3.prev = 19;
                _context3.t1 = _context3["catch"](15);
                throw new Error("Cant parse JSON of cached model's object: ".concat(_context3.t1.message));

              case 22:
                _context3.prev = 22;
                // console.log('From Cache');
                queryOptions = args[0];

                if (queryOptions && !!queryOptions.raw) {
                  _result = parsed;
                } else if (parsed.rows) {
                  _result = (0, _objectSpread2.default)({}, parsed, {
                    rows: parsed.rows.map(function (parsedRow) {
                      return _this2.model.build(parsedRow);
                    })
                  });
                } else if (typeof parsed === 'number') {
                  _result = parsed;
                } else if (queryOptions) {
                  buildOptions = {
                    raw: !!queryOptions.raw,
                    isNewRecord: !!queryOptions.isNewRecord
                  };

                  if (queryOptions.include) {
                    buildOptions.include = queryOptions.include;
                  }

                  _result = this.model.build(parsed, buildOptions);
                } else {
                  _result = this.model.build(parsed);
                }

                return _context3.abrupt("return", [_result, true]);

              case 28:
                _context3.prev = 28;
                _context3.t2 = _context3["catch"](22);
                throw new Error("Cant build model from cached JSON: ".concat(_context3.t2.message));

              case 31:
                _context3.next = 33;
                return (_this$model2 = this.model)[method].apply(_this$model2, args);

              case 33:
                result = _context3.sent;

                if (result) {
                  _context3.next = 36;
                  break;
                }

                return _context3.abrupt("return", [null, false]);

              case 36:
                if (!(Array.isArray(result) || result.rows || typeof result === 'number')) {
                  _context3.next = 40;
                  break;
                }

                // Array for findAll, result.rows for findAndCountAll, typeof number for count/max/sum/etc
                toCache = result;
                _context3.next = 45;
                break;

              case 40:
                if (!result.toString().includes('[object SequelizeInstance')) {
                  _context3.next = 44;
                  break;
                }

                toCache = result;
                _context3.next = 45;
                break;

              case 44:
                throw new Error("Unkown result type: ".concat((0, _typeof2.default)(result)));

              case 45:
                this.redisClient.set(cacheKey, stringify(toCache));

                if (this.options.ttl) {
                  this.redisClient.expire(cacheKey, this.options.ttl);
                }

                return _context3.abrupt("return", [result, false]);

              case 48:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[4, 10], [15, 19], [22, 28]]);
      }));

      function run(_x2, _x3) {
        return _run.apply(this, arguments);
      }

      return run;
    }()
  }]);
  return SequelizeRedisModel;
}();