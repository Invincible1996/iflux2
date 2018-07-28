"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 原子不可变数据容器
 */
var immutable_1 = require("immutable");
var Cursor = require("immutable/contrib/cursor");
var util_1 = require("./util");

var Atom = function () {
    /**
     * 初始化初始的数据结构
     */
    function Atom(record) {
        _classCallCheck(this, Atom);

        this._callbacks = [];
        this._atom = immutable_1.fromJS(record);
    }
    /**
     * 获取值
     * 1. 如果path为空,就返回所有的值
     * 2. 如果path为字符串或者数组就按照immutable的path返回数据
     * 3. 其他返回空值
     *
     * @param path
     * @returns {*}
     */


    _createClass(Atom, [{
        key: "value",
        value: function value(path) {
            var value = null;
            if (!path) {
                value = this._atom;
            } else if (util_1.isStr(path) || util_1.isArray(path)) {
                if (typeof path === 'string') {
                    value = this._atom.get(path);
                } else {
                    value = this._atom.getIn(path);
                }
            }
            return value;
        }
        /**
         * 获取cursor
         */

    }, {
        key: "cursor",
        value: function cursor() {
            var _this = this;

            return Cursor.from(this._atom, function (newState, state, path) {
                //校验数据是否过期
                if (state != _this._atom) {
                    console.log && console.log('attempted to alter expired data.');
                }
                //校验有没有数据的变化
                if (newState === state) {
                    return;
                }
                _this._atom = newState;
                _this._callbacks.forEach(function (cb) {
                    return cb(newState, path);
                });
            });
        }
        /**
         * 订阅
         */

    }, {
        key: "subscribe",
        value: function subscribe(callback) {
            if (!callback || !util_1.isFn(callback)) {
                return;
            }
            //防止重复添加
            if (this._callbacks.indexOf(callback) == -1) {
                this._callbacks.push(callback);
            }
        }
        /**
         * 取消订阅
         */

    }, {
        key: "unsubscribe",
        value: function unsubscribe(callback) {
            if (!callback || !util_1.isFn(callback)) {
                return;
            }
            var index = this._callbacks.indexOf(callback);
            if (index >= 0) {
                this._callbacks.splice(index, 1);
            }
        }
        /**
         * 打印出当前的内部数据状态
         */

    }, {
        key: "pprint",
        value: function pprint() {
            console.log(JSON.stringify(this._atom.toJS(), null, 2));
        }
    }]);

    return Atom;
}();

exports.default = Atom;