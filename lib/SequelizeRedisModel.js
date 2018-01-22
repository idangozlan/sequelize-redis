'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _jsonBuffer = require('json-buffer');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var methods = ['find', 'findOne', 'findAll', 'findAndCount', 'findAndCountAll', 'findById', 'all', 'min', 'max', 'sum', 'count'];

var SequelizeRedisModel = function () {
  function SequelizeRedisModel(model, redisPromisifiedClient) {
    var _this = this;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    (0, _classCallCheck3.default)(this, SequelizeRedisModel);

    this.options = (0, _extends3.default)({}, options);

    this.model = model;
    this.redisClient = redisPromisifiedClient;
    methods.forEach(function (method) {
      _this[method + 'Cached'] = function () {
        var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(cacheKey) {
          for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  return _context.abrupt('return', _this.run.apply(_this, [cacheKey, method].concat(args)));

                case 1:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this);
        }));

        return function (_x2) {
          return _ref.apply(this, arguments);
        };
      }();
      _this[method] = function () {
        var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
          var _model;

          var _args2 = arguments;
          return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  return _context2.abrupt('return', (_model = _this.model)[method].apply(_model, _args2));

                case 1:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, _this);
        }));

        return function () {
          return _ref2.apply(this, arguments);
        };
      }();
    });
  }

  (0, _createClass3.default)(SequelizeRedisModel, [{
    key: 'run',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(cacheKey, method) {
        var _this2 = this,
            _model2;

        for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
          args[_key2 - 2] = arguments[_key2];
        }

        var cached, parsed, _result, queryOptiosn, buildOptions, result, toCache;

        return _regenerator2.default.wrap(function _callee3$(_context3) {
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
                cached = void 0;
                _context3.prev = 5;
                _context3.next = 8;
                return this.redisClient.getAsync(cacheKey);

              case 8:
                cached = _context3.sent;
                _context3.next = 14;
                break;

              case 11:
                _context3.prev = 11;
                _context3.t0 = _context3['catch'](5);
                throw new Error('Cant get cached object from Redis ' + _context3.t0.message);

              case 14:
                if (!cached) {
                  _context3.next = 32;
                  break;
                }

                parsed = void 0;
                _context3.prev = 16;

                parsed = (0, _jsonBuffer.parse)(cached);
                _context3.next = 23;
                break;

              case 20:
                _context3.prev = 20;
                _context3.t1 = _context3['catch'](16);
                throw new Error('Cant parse JSON of cached model\'s object: ' + _context3.t1.message);

              case 23:
                _context3.prev = 23;

                // console.log('From Cache');
                _result = void 0;

                if (Array.isArray(parsed)) {
                  _result = parsed.map(function (parsedObject) {
                    return _this2.model.build(parsedObject);
                  });
                } else if (parsed.rows) {
                  _result = (0, _extends3.default)({}, parsed, {
                    rows: parsed.rows.map(function (parsedRow) {
                      return _this2.model.build(parsedRow);
                    })
                  });
                } else if (typeof parsed === 'number') {
                  _result = parsed;
                } else {
                  queryOptiosn = args[0];
                  buildOptions = {
                    raw: !!queryOptiosn.raw,
                    isNewRecord: !!queryOptiosn.isNewRecord
                  };

                  if (queryOptiosn.include) {
                    buildOptions.include = queryOptiosn.include;
                  }
                  _result = this.model.build(parsed, buildOptions);
                }

                return _context3.abrupt('return', [_result, true]);

              case 29:
                _context3.prev = 29;
                _context3.t2 = _context3['catch'](23);
                throw new Error('Cant build model from cached JSON: ' + _context3.t2.message);

              case 32:
                _context3.next = 34;
                return (_model2 = this.model)[method].apply(_model2, args);

              case 34:
                result = _context3.sent;
                toCache = void 0;

                if (result) {
                  _context3.next = 40;
                  break;
                }

                return _context3.abrupt('return', [null, false]);

              case 40:
                if (!(Array.isArray(result) || result.rows || typeof result === 'number')) {
                  _context3.next = 44;
                  break;
                }

                // Array for findAll, result.rows for findAndCountAll, typeof number for count/max/sum/etc
                toCache = result;
                _context3.next = 49;
                break;

              case 44:
                if (!result.toString().includes('[object SequelizeInstance')) {
                  _context3.next = 48;
                  break;
                }

                toCache = result.get({ plain: true });
                _context3.next = 49;
                break;

              case 48:
                throw new Error('Unkown result type: ' + (typeof result === 'undefined' ? 'undefined' : (0, _typeof3.default)(result)));

              case 49:

                this.redisClient.set(cacheKey, (0, _jsonBuffer.stringify)(toCache));

                if (this.options.ttl) {
                  this.redisClient.expire(cacheKey, this.options.ttl);
                }

                return _context3.abrupt('return', [result, false]);

              case 52:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[5, 11], [16, 20], [23, 29]]);
      }));

      function run(_x3, _x4) {
        return _ref3.apply(this, arguments);
      }

      return run;
    }()
  }]);
  return SequelizeRedisModel;
}();

exports.default = SequelizeRedisModel;