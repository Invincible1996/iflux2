"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
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