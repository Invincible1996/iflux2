"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 致敬Reley,更希望我们小伙伴可以relax
 *
 * Relax根据containerComponent的defaultProps
 * 自动数据依赖注入, 数据源优先级为:
 * 1. this.props
 * 2. store的action函数
 * 3. query-lang
 * 4. store的state
 * 5. 组件设置的默认值
 */
var React = require("react");
var PropTypes = require("prop-types")
var immutable_1 = require("immutable");
var ql_1 = require("./ql");
var dql_1 = require("./dql");
function Relax(Component) {
    //获取组件中绑定的上下文storeName的参数
    //默认是store
    var ctxStoreName = Component._ctxStoreName || '_iflux2$store';
    return _a = function (_React$Component) {
        _inherits(RelaxContainer, _React$Component);

        function RelaxContainer(props, context) {
            _classCallCheck(this, RelaxContainer);

            /**
             * 订阅store的变化
             */
            var _this = _possibleConstructorReturn(this, (RelaxContainer.__proto__ || Object.getPrototypeOf(RelaxContainer)).call(this, props));

            _this._subscribeStoreChange = function (state) {
                if (_this._isMounted) {
                    _this.setState({
                        storeState: state
                    });
                }
            };
            _this._dql2ql = {};
            _this._isMounted = false;
            _this.state = { storeState: immutable_1.fromJS({}) };
            _this._store = context[ctxStoreName];
            _this._debug = _this._store._debug;
            _this._store.subscribe(_this._subscribeStoreChange);
            return _this;
        }

        _createClass(RelaxContainer, [{
            key: "componentWillMount",
            value: function componentWillMount() {
                //设置当前组件的状态
                this._isMounted = false;
                //检查store是不是存在上下文
                //抛出异常方便定位问题
                if (!this._store) {
                    throw new Error('Could not find any @StoreProvider bind AppStore in current context');
                }
                //计算最终的props,这样写的是避免querylang的重复计算
                this._relaxProps = this.computedRelaxProps(this.props);
                //在开发阶段可以有更好的日志跟踪，在线上可以drop掉log，reduce打包的体积
                if (process.env.NODE_ENV != 'production') {
                    if (this._debug) {
                        console.groupCollapsed && console.groupCollapsed("Relax(" + Component.name + ") will mount \uD83D\uDE80");
                        console.log('props:|>', JSON.stringify(this.props, null, 2));
                        console.log('relaxProps:|>', JSON.stringify(this._relaxProps, null, 2));
                        console.groupEnd && console.groupEnd();
                    }
                }
            }
        }, {
            key: "componentDidMount",
            value: function componentDidMount() {
                this._isMounted = true;
            }
        }, {
            key: "componentWillUpdate",
            value: function componentWillUpdate() {
                this._isMounted = false;
            }
        }, {
            key: "componentDidUpdate",
            value: function componentDidUpdate() {
                this._isMounted = true;
            }
        }, {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                this._store.unsubscribe(this._subscribeStoreChange);
            }
            /**
             * 3ks immutable
             * @param nextProps
             * @returns {boolean}
             */

        }, {
            key: "shouldComponentUpdate",
            value: function shouldComponentUpdate(nextProps) {
                var newRelaxProps = this.computedRelaxProps(nextProps);
                if (!immutable_1.is(immutable_1.fromJS(newRelaxProps), immutable_1.fromJS(this._relaxProps)) || !immutable_1.is(immutable_1.fromJS(this.props), immutable_1.fromJS(nextProps))) {
                    this._relaxProps = newRelaxProps;
                    //log trace        
                    if (process.env.NODE_ENV != 'production') {
                        if (this._debug) {
                            console.groupCollapsed("Relax(" + Component.name + ") will update \uD83D\uDE80");
                            console.log('props:|>', JSON.stringify(nextProps, null, 2));
                            console.log('relaxProps:|>', JSON.stringify(this._relaxProps, null, 2));
                            console.groupEnd();
                        }
                    }
                    return true;
                }
                return false;
            }
        }, {
            key: "render",
            value: function render() {
                return React.createElement(Component, Object.assign({}, this.props, this._relaxProps));
            }
            /**
             * 计算prop的值 然后自动注入
             *
             * 1. 默认属性是不是存在，不存在返回空对象
             * 2. 默认属性的值是不是一个合法的query-lang， 如果是就在store中通过bigQuery计算
             * 3. 默认属性是不是在父组件传递的props中，如果是取
             * 4. 是不是store得属性
             * 5. 是不是store得某个key值
             * 6. 都不是就是默认值
             */

        }, {
            key: "computedRelaxProps",
            value: function computedRelaxProps(reactProps) {
                var dql = {};
                var relaxProps = {};
                var store = this._store;
                var defaultProps = Component.defaultProps || {};
                for (var propName in defaultProps) {
                    //获取当前的属性值
                    var propValue = defaultProps[propName];
                    //先默认值
                    relaxProps[propName] = propValue;
                    //判断defaultProps的值是不是query的语法
                    if (propValue instanceof ql_1.QueryLang) {
                        relaxProps[propName] = store.bigQuery(propValue);
                        continue;
                    } else if (propValue instanceof dql_1.DynamicQueryLang) {
                        dql[propName] = propValue;
                        //如果不存在转换，创建一个QL与关联
                        if (!this._dql2ql[propName]) {
                            //这个lang实际上并不是QueryLang需要的
                            //这个lang会被后面真正被DynamicQueryLang计算过的lang取代
                            this._dql2ql[propName] = new ql_1.QueryLang(propValue.name(), propValue.lang());
                        }
                        continue;
                    }
                    //如果默认属性中匹配上
                    if (RelaxContainer._isNotValidValue(reactProps[propName])) {
                        relaxProps[propName] = reactProps[propName];
                    } else if (RelaxContainer._isNotValidValue(store[propName])) {
                        relaxProps[propName] = store[propName];
                    } else if (RelaxContainer._isNotValidValue(store.state().get(propName))) {
                        relaxProps[propName] = store.state().get(propName);
                    }
                }
                //开始计算DQL
                for (var _propName in dql) {
                    if (dql.hasOwnProperty(_propName)) {
                        //取出dynamicQL
                        var dqlObj = dql[_propName];
                        var lang = dqlObj.context(relaxProps).analyserLang(dqlObj.lang());
                        var ql = this._dql2ql[_propName].setLang(lang);
                        relaxProps[_propName] = store.bigQuery(ql);
                    }
                }
                return relaxProps;
            }
            /**
             * 判断当前的值是不是undefined或者null
             * @param  {any} param
             */

        }], [{
            key: "_isNotValidValue",
            value: function _isNotValidValue(param) {
                return typeof param != 'undefined' && null != param;
            }
        }]);

        return RelaxContainer;
    }(React.Component),
    //声明上下文类型
    _a.contextTypes = _defineProperty({}, ctxStoreName, PropTypes.object),
    //声明displayName
    _a.displayName = "Relax(" + getDisplayName(Component) + ")", _a;
    /**
     * displayName
     */
    function getDisplayName(WrappedComponent) {
        return WrappedComponent.displayName || WrappedComponent.name || 'Component';
    }
    var _a;
}
exports.default = Relax;