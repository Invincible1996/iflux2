"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function isQuery(ql) {
    return isArray(ql) && isFn(ql[ql.length - 1]);
}
exports.isQuery = isQuery;
/**
 * 判断当前的参数是不是数组
 * @param arr
 * @returns {boolean}
 */
function isArray(arr) {
    return type(arr) === '[object Array]';
}
exports.isArray = isArray;
/**
 * 是不是函数
 * @param fn
 * @returns {boolean}
 */
function isFn(fn) {
    return type(fn) === '[object Function]';
}
exports.isFn = isFn;
/**
 * 是不是字符串
 * @param str
 */
function isStr(str) {
    return type(str) === '[object String]';
}
exports.isStr = isStr;
function isObject(str) {
    return type(str) === '[object Object]';
}
exports.isObject = isObject;
/**
 * 判断数据类型
 * @param type
 * @returns {string}
 */
function type(type) {
    return Object.prototype.toString.call(type);
}
exports.type = type;
/**
 * 过滤出actor中重复的key
 * @param actor
 * @returns Array
 */
function filterActorConflictKey() {
    var actor = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    //返回冲突的key的数组
    var conflictKeyList = [];
    //如果数组的元素只有一个不判断
    if (actor.length <= 1) {
        return conflictKeyList;
    }
    //聚合数据
    var actorKeyMap = {};

    var _loop = function _loop(i, len) {
        var actorName = actor[i].constructor.name;
        Object.keys(actor[i].defaultState()).forEach(function (v) {
            (actorKeyMap[v] || (actorKeyMap[v] = [])).push(actorName);
        });
    };

    for (var i = 0, len = actor.length; i < len; i++) {
        _loop(i, len);
    }
    Object.keys(actorKeyMap).forEach(function (v) {
        var value = actorKeyMap[v];
        if (value.length > 1) {
            conflictKeyList.push([v, value]);
        }
    });
    return conflictKeyList;
}
exports.filterActorConflictKey = filterActorConflictKey;