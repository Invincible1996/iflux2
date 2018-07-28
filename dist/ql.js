/**
 * 查询语言
 * 
 */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
//递增的id
var uuid = 0;

var QueryLang = function () {
    /**
     * init
     */
    function QueryLang(name, lang) {
        _classCallCheck(this, QueryLang);

        this._id = ++uuid;
        this._name = name;
        this._lang = lang;
        if (process.env.NODE_ENV != 'production') {
            if (!util_1.isQuery(this._lang)) {
                throw new Error(this._name + " is not invalid");
            }
        }
    }
    /**
     * 判断当前是不是一个合法的query lang
     * @returns {boolean}
     */


    _createClass(QueryLang, [{
        key: "isValidQuery",
        value: function isValidQuery() {
            return util_1.isQuery(this._lang);
        }
        /**
         * 当前的id
         * @returns {number}
         */

    }, {
        key: "id",
        value: function id() {
            return this._id;
        }
        /**
         * 当前的name
         */

    }, {
        key: "name",
        value: function name() {
            return this._name;
        }
        /**
         * 当前的语法标记
         * @returns {Array.<Object>}
         */

    }, {
        key: "lang",
        value: function lang() {
            return this._lang;
        }
    }, {
        key: "setLang",
        value: function setLang(lang) {
            this._lang = lang;
            return this;
        }
    }]);

    return QueryLang;
}();

exports.QueryLang = QueryLang;
//export factory method
exports.QL = function (name, lang) {
    return new QueryLang(name, lang);
};