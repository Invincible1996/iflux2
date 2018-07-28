"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var __rest = undefined && undefined.__rest || function (s, e) {
    var t = {};
    for (var p in s) {
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    }if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0) t[p[i]] = s[p[i]];
    }return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * iflux的状态容器中心(MapReduce)
 * 聚合actor, 分派action, 计算query-lang
 */
var immutable_1 = require("immutable");
var ReactDOM = require("react-dom");
var ql_1 = require("./ql");
var util_1 = require("./util");
var batchedUpdates = ReactDOM.unstable_batchedUpdates || function (cb) {
    cb();
};
//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;Store;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

var Store = function () {
    /**
     * 初始化store
     * @param opts
     */
    function Store(opts) {
        _classCallCheck(this, Store);

        this._debug = opts.debug || false;
        this._isTransaction = false;
        this._state = immutable_1.fromJS({});
        this._cacheQL = {};
        this._callbacks = [];
        this._actorStateList = [];
        this._actors = this.bindActor();
        this._reduceActorState();
    }

    _createClass(Store, [{
        key: "bindActor",
        value: function bindActor() {
            return [];
        }
    }, {
        key: "_reduceActorState",
        value: function _reduceActorState() {
            var _this = this;

            this._state = this._state.withMutations(function (state) {
                _this._actors.forEach(function (actor) {
                    var initState = immutable_1.fromJS(actor.defaultState());
                    _this._actorStateList.push(initState);
                    state = state.merge(initState);
                });
                return state;
            });
            //will drop on production environment    
            if (process.env.NODE_ENV != 'production') {
                //计算有没有冲突的key
                this.debug(function () {
                    var conflictList = util_1.filterActorConflictKey(_this._actors);
                    conflictList.forEach(function (v) {
                        console.warn("actor:key \u2018" + v[0] + "\u2019 was conflicted among \u2018" + v[1] + "\u2019 ");
                    });
                });
            }
        }
        /**
         * 响应view层的事件,将业务分发到所有的actor
         * @param msg
         * @param param
         */

    }, {
        key: "dispatch",
        value: function dispatch(action, params) {
            //校验参数是否为空
            if (!action) {
                throw new Error('😭 invalid dispatch without any arguments');
            }

            var _parseArgs2 = _parseArgs(action, params),
                msg = _parseArgs2.msg,
                param = _parseArgs2.param;

            var newStoreState = this._mapActor(msg, param);
            if (newStoreState != this._state) {
                this._state = newStoreState;
                //如果当前不是在事务中，通知页面更新
                if (!this._isTransaction) {
                    this._notify();
                }
            }
            /**
             * 解析参数
             */
            function _parseArgs(action, extra) {
                //init
                var res = { msg: '', param: null };
                //兼容Redux单值对象的数据格式
                //e.g: {type: 'ADD_TO_DO', id: 1, text: 'hello iflux2', done: false}
                if (util_1.isObject(action)) {
                    var type = action.type,
                        rest = __rest(action, ["type"]);
                    if (!type) {
                        throw new Error('😭 msg should include `type` field.');
                    }
                    res.msg = type;
                    res.param = rest;
                } else if (util_1.isStr(action)) {
                    res.msg = action;
                    res.param = extra;
                }
                return res;
            }
        }
    }, {
        key: "transaction",
        value: function transaction(dispatch, rollBack) {
            var isRollBack = false;
            if (process.env.NODE_ENV != 'production') {
                if (this._debug) {
                    console.groupCollapsed && console.groupCollapsed('open a new transaction 🚀');
                }
            }
            this._isTransaction = true;
            var currentStoreState = this._state;
            try {
                dispatch();
            } catch (err) {
                isRollBack = true;
                //如有自定义的事务回滚操作
                //调用自定义的行为
                if (rollBack) {
                    rollBack();
                } else {
                    //默认事务回滚，状态回到上次的状态
                    this._state = currentStoreState;
                }
                if (process.env.NODE_ENV != 'production') {
                    console.warn('😭, Some expection occur in transaction, the store state rollback.');
                    if (this._debug) {
                        console.trace(err);
                    }
                }
            }
            this._isTransaction = false;
            if (currentStoreState != this._state) {
                this._notify();
            }
            if (process.env.NODE_ENV != 'production') {
                if (this._debug) {
                    console.groupEnd && console.groupEnd();
                }
            }
            return isRollBack;
        }
    }, {
        key: "_mapActor",
        value: function _mapActor(msg, params) {
            var _state = this._state;
            if (process.env.NODE_ENV != 'production') {
                //trace log
                this.debug(function () {
                    console.groupCollapsed && console.groupCollapsed("store dispatch msg |> " + JSON.stringify(msg));
                    console.log("params |> " + JSON.stringify(params || 'no params'));
                });
            }
            for (var i = 0, len = this._actors.length; i < len; i++) {
                var actor = this._actors[i];
                var fn = (actor._route || {})[msg];
                //如果actor没有能力处理该msg跳过
                if (!fn) {
                    //log
                    if (process.env.NODE_ENV != 'production') {
                        if (this._debug) {
                            console.log(actor.constructor.name + " receive '" + msg + "', but no handle \uD83D\uDE2D");
                        }
                    }
                    continue;
                }
                //debug
                if (process.env.NODE_ENV != 'production') {
                    if (this._debug) {
                        var actorName = actor.constructor.name;
                        console.log(actorName + " receive => '" + msg + "'");
                    }
                }
                var preActorState = this._actorStateList[i];
                var newActorState = actor.receive(msg, preActorState, params);
                if (preActorState != newActorState) {
                    this._actorStateList[i] = newActorState;
                    _state = _state.merge(newActorState);
                }
            }
            //debug
            if (process.env.NODE_ENV != 'production') {
                if (this._debug) {
                    console.groupEnd && console.groupEnd();
                }
            }
            return _state;
        }
    }, {
        key: "_notify",
        value: function _notify() {
            var _this2 = this;

            batchedUpdates(function () {
                //通知ui去re-render
                _this2._callbacks.forEach(function (cb) {
                    return cb(_this2._state);
                });
            });
        }
        /**
         * 批量dispatch，适用于合并一些小计算量的多个dispatch
         * e.g:
         *  this.batchDispatch([
         *    ['loading', true],
         *    ['init', {id: 1, name: 'test'}],
         *    {type: 'ADD_TO_DO', id: 1, text: 'hello todo', done: false}
         *  ]);
         *
         */

    }, {
        key: "batchDispatch",
        value: function batchDispatch() {
            var _this3 = this;

            var actions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

            if (process.env.NODE_ENV != 'production') {
                console.warn('😭 请直接使用transaction');
            }
            //校验参数是否为空
            if (arguments.length == 0) {
                throw new Error('😭 invalid batch dispatch without arguments');
            }
            this.transaction(function () {
                actions.forEach(function (actor) {
                    var _parseArgs3 = _parseArgs(actions),
                        msg = _parseArgs3.msg,
                        param = _parseArgs3.param;

                    _this3.dispatch(msg, param);
                });
            });
            /**
             * 解析参数
             * 不加具体参数，发现flow仅支持typeof的类型判断
             */
            function _parseArgs(action) {
                var res = { msg: '', param: null };
                if (util_1.isStr(action)) {
                    res.msg = action;
                } else if (util_1.isArray(action)) {
                    res.msg = action[0];
                    res.param = action[1];
                } else if (util_1.isObject(action)) {
                    var type = action.type,
                        rest = __rest(action, ["type"]);
                    if (!type) {
                        throw new Error('😭 msg should include `type` field.');
                    }
                    res.msg = type;
                    res.param = rest;
                }
                return res;
            }
        }
        /**
         * 计算query-lang的值
         * @param ql
         * @returns {*}
         */

    }, {
        key: "bigQuery",
        value: function bigQuery(ql) {
            var _this4 = this;

            //校验query-lang
            if (!ql.isValidQuery()) {
                throw new Error('Invalid query lang');
            }
            var id = ql.id();
            var name = ql.name();
            var metaData = {};
            if (process.env.NODE_ENV != 'production') {
                //trace log
                this.debug(function () {
                    console.groupCollapsed && console.groupCollapsed("QL:|> ql#" + name + " big query ==> \uD83D\uDE80");
                    console.time("" + name);
                });
            }
            //当前的QL是不是已经查询过
            //如果没有查询过构建查询meta data
            if (!this._cacheQL[id]) {
                if (process.env.NODE_ENV != 'production') {
                    //trace log
                    this.debug(function () {
                        console.log("QL:|> ql#" + name + " was 1st query.");
                    });
                }
                this._cacheQL[id] = {
                    result: 0,
                    deps: []
                };
            }
            metaData = this._cacheQL[id];
            //不改变参数,拒绝side-effect
            var qlCopy = ql.lang().slice();
            //获取最后的function
            var fn = qlCopy.pop();
            //逐个分析bigquery的path是否存在过期的数据
            var expired = false;
            var args = qlCopy.map(function (path, key) {
                //如果当前的参数仍然是query-lang,则直接递归计算一次query—lang的值
                if (path instanceof ql_1.QueryLang) {
                    var _result = _this4.bigQuery(path);
                    //数据有变化
                    if (_result != metaData.deps[key]) {
                        metaData.deps[key] = _result;
                        expired = true;
                        if (process.env.NODE_ENV != 'production') {
                            //trace log
                            _this4.debug(function () {
                                console.log("path:|> ql#" + path.name() + " was outdated. \uD83D\uDD25");
                            });
                        }
                    }
                    if (process.env.NODE_ENV != 'production') {
                        _this4.debug(function () {
                            console.log("path:|> ql#" + path.name() + " was cached. \uD83D\uDC4C");
                        });
                    }
                    return _result;
                }
                //直接返回当前path下面的状态值
                //如果当前的参数是数组使用immutable的getIn
                //如果当前的参数是一个字符串使用get方式
                var value = util_1.isArray(path) ? _this4._state.getIn(path) : _this4._state.get(path);
                //不匹配
                if (value != metaData.deps[key]) {
                    metaData.deps[key] = value;
                    expired = true;
                    if (process.env.NODE_ENV != 'production') {
                        _this4.debug(function () {
                            console.log("path:|> " + JSON.stringify(path) + " was outdated. \uD83D\uDD25");
                        });
                    }
                } else if (typeof value === 'undefined' && typeof metaData.deps[key] === 'undefined') {
                    expired = true;
                    if (process.env.NODE_ENV != 'production') {
                        _this4.debug(function () {
                            console.log("path:|> " + JSON.stringify(path) + " was 'undefined'. \u5C0F\u5FC3!");
                        });
                    }
                }
                return value;
            });
            //返回数据,默认缓存数据
            var result = metaData.result;
            //如果过期，重新计算
            if (expired) {
                result = fn.apply(null, args);
                metaData.result = result;
            } else {
                if (process.env.NODE_ENV != 'production') {
                    this.debug(function () {
                        console.log(":) get result from cache");
                    });
                }
            }
            if (process.env.NODE_ENV != 'production') {
                //trace log
                this.debug(function () {
                    console.log('!!result => ' + JSON.stringify(result, null, 2));
                    console.timeEnd("" + name);
                    console.groupEnd && console.groupEnd();
                });
            }
            return result;
        }
        /**
         * 当前的状态
         * @returns {Object}
         */

    }, {
        key: "state",
        value: function state() {
            return this._state;
        }
        /**
         * 订阅state的变化
         * @param callback
         * @param isStoreProvider
         */

    }, {
        key: "subscribe",
        value: function subscribe(callback) {
            if (!util_1.isFn(callback)) {
                return;
            }
            if (this._callbacks.indexOf(callback) == -1) {
                this._callbacks.push(callback);
            }
        }
        /**
         * 取消订阅State的变化
         * @param callback
         */

    }, {
        key: "unsubscribe",
        value: function unsubscribe(callback) {
            if (!util_1.isFn(callback)) {
                return;
            }
            var index = this._callbacks.indexOf(callback);
            if (index != -1) {
                this._callbacks.splice(index, 1);
            }
        }
        //;;;;;;;;;;;;;;;;;;;;;;helper method;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        /**
         * 替代if
         */

    }, {
        key: "debug",
        value: function debug(callback) {
            if (this._debug) {
                callback();
            }
        }
        /**
         * 格式化当前的状态
         */

    }, {
        key: "pprint",
        value: function pprint() {
            Store.prettyPrint(this.state());
        }
        /**
         * 内部状态
         */

    }, {
        key: "pprintActor",
        value: function pprintActor() {
            Store.prettyPrint(this._actorStateList);
        }
        /**
         * 漂亮的格式化
         * @param obj
         */

    }], [{
        key: "prettyPrint",
        value: function prettyPrint(obj) {
            console.log(JSON.stringify(obj, null, 2));
        }
    }]);

    return Store;
}();

exports.default = Store;