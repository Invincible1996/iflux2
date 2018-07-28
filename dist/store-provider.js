/**
 * StoreProvider
 * 主要的作用是在Store和React的App之间建立桥梁
 * 将Store初始化,切绑定到React顶层App的上下文
 */
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var PropTypes = require("prop-types")
/**
 * 
 * WrapperComponent
 * @param AppStore
 * @param opts
 * @returns {Function}
 */
function connectToStore(AppStore) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { debug: false, ctxStoreName: '_iflux2$store' };

    return function (Component) {
        //获取上下午动态设置的store的名称
        //避免Relax在获取context的时候就近原则的冲突
        var ctxStoreName = opts.ctxStoreName || '_iflux2$store';
        //proxy Component componentDidMount
        var proxyDidMount = Component.prototype.componentDidMount || function () {};
        //reset
        Component.prototype.componentDidMount = function () {};
        return _a = function (_React$Component) {
            _inherits(StoreContainer, _React$Component);

            function StoreContainer(props) {
                _classCallCheck(this, StoreContainer);

                var _this = _possibleConstructorReturn(this, (StoreContainer.__proto__ || Object.getPrototypeOf(StoreContainer)).call(this, props));

                _this._handleStoreChange = function () {
                    if (_this._isMounted) {
                        _this.forceUpdate();
                    }
                };
                if (process.env.NODE_ENV != 'production') {
                    //如果是debug状态
                    if (opts.debug) {
                        console.group && console.group("StoreProvider(" + Component.name + ") in debug mode. \uD83D\uDD25");
                    }
                }
                //初始化当前的组件状态
                _this._isMounted = false;
                //初始化Store
                _this._store = new AppStore(opts);
                _this._store.subscribe(_this._handleStoreChange);
                return _this;
            }

            _createClass(StoreContainer, [{
                key: "getChildContext",
                value: function getChildContext() {
                    return _defineProperty({}, ctxStoreName, this._store);
                }
            }, {
                key: "componentDidMount",
                value: function componentDidMount() {
                    if (process.env.NODE_ENV != 'production') {
                        if (opts.debug) {
                            console.groupEnd && console.groupEnd();
                        }
                    }
                    this._isMounted = true;
                    //代理的子componentDidMount执行一次
                    if (this.App) {
                        proxyDidMount.call(this.App);
                    }
                }
            }, {
                key: "componentWillUpdate",
                value: function componentWillUpdate() {
                    this._isMounted = false;
                    if (process.env.NODE_ENV != 'production') {
                        if (opts.debug) {
                            console.group && console.group("StoreProvider(" + Component.name + ") will update \uD83D\uDE80");
                        }
                    }
                }
            }, {
                key: "componentDidUpdate",
                value: function componentDidUpdate() {
                    this._isMounted = true;
                    if (process.env.NODE_ENV != 'production') {
                        if (opts.debug) {
                            console.groupEnd && console.groupEnd();
                        }
                    }
                }
            }, {
                key: "componentWillUnmount",
                value: function componentWillUnmount() {
                    this._store.unsubscribe(this._handleStoreChange);
                }
            }, {
                key: "render",
                value: function render() {
                    var _this2 = this;

                    return React.createElement(Component, Object.assign({ ref: function ref(App) {
                            return _this2.App = App;
                        } }, this.props, { store: this._store }));
                }
            }]);

            return StoreContainer;
        }(React.Component), _a.displayName = "StoreProvider(" + getDisplayName(Component) + ")", _a.childContextTypes = _defineProperty({}, ctxStoreName, PropTypes.object), _a;
        var _a;
    };
    function getDisplayName(WrappedComponent) {
        return WrappedComponent.displayName || WrappedComponent.name || 'Component';
    }
}
exports.default = connectToStore;