"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var ql_1 = require("./ql");
var util_1 = require("./util");
/**
 * 动态的QueryLang
 */

var DynamicQueryLang = function () {
    function DynamicQueryLang(name, lang) {
        _classCallCheck(this, DynamicQueryLang);

        this._ctx = {};
        this._name = name;
        this._lang = lang;
        if (process.env.NODE_ENV != 'production') {
            if (!util_1.isQuery(this._lang)) {
                throw new Error(this._name + " syntax error");
            }
        }
    }
    /**
     * 分析路径中的动态元素，然后根据上下文替换
     * @param ql
     */


    _createClass(DynamicQueryLang, [{
        key: "analyserLang",
        value: function analyserLang(dLang) {
            var lang = [];
            for (var i = 0, len = dLang.length; i < len; i++) {
                //获取当前的路径
                var path = dLang[i];
                if (util_1.isStr(path)) {
                    lang[i] = path[0] === '$' ? this._ctx[path.substring(1)] : path;
                } else if (util_1.isArray(path)) {
                    //init
                    lang[i] = [];
                    for (var j = 0, _len = path.length; j < _len; j++) {
                        var field = dLang[i][j];
                        lang[i][j] = util_1.isStr(field) && field[0] === '$' ? this._ctx[field.substring(1)] : field;
                    }
                } else if (path instanceof DynamicQueryLang) {
                    lang[i] = new ql_1.QueryLang(path._name + '2QL', this.analyserLang(path._lang));
                } else {
                    //zero runtime cost
                    if (process.env.NODE_ENV != 'production') {
                        //如果path是QueryLang，校验querylang语法的合法性
                        if (path instanceof ql_1.QueryLang && !path.isValidQuery()) {
                            throw new Error("DQL: syntax error");
                        }
                    }
                    lang[i] = path;
                }
            }
            return lang;
        }
        /**
         * 设置上下文
         * @param  {Object} ctx
         */

    }, {
        key: "context",
        value: function context(ctx) {
            this._ctx = ctx;
            return this;
        }
    }, {
        key: "name",
        value: function name() {
            return this._name;
        }
    }, {
        key: "lang",
        value: function lang() {
            return this._lang;
        }
    }]);

    return DynamicQueryLang;
}();

exports.DynamicQueryLang = DynamicQueryLang;
/**
 * 工厂函数
 * @param  {string name
 * @param  {Lang} lang
 */
exports.DQL = function (name, lang) {
    return new DynamicQueryLang(name, lang);
};