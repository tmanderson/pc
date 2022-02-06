"use strict";
exports.__esModule = true;
exports.any = exports.sequence = exports.match = void 0;
var matcher = function (pattern, min, max) {
    if (min === void 0) { min = 1; }
    if (max === void 0) { max = -1; }
    return function (input) {
        var i = 0;
        var matches = 0;
        var tokens = [];
        while (i < input.length && (max < min || matches < max)) {
            var _a = pattern(input.substring(i)), n = _a[0], m = _a[1];
            if (m === null)
                break; // pattern FAILED
            // we concatenate primitive (i.e. string/regexp) matches
            tokens.push(m);
            matches++;
            i += n;
        }
        return (matches < min ? [0, null] : [i, tokens]);
    };
};
var regexp = function (regexp, min, max) {
    return matcher(function (input) {
        return regexp.test(input.charAt(0))
            ? [1, input.charAt(0)]
            : [0, null];
    }, min, max);
};
var string = function (string, min, max) {
    return matcher(function (input) {
        return string === input.substring(0, string.length)
            ? [string.length, input.substring(0, string.length)]
            : [0, null];
    }, min, max);
};
var match = function (pattern, min, max) {
    return typeof pattern === 'string' ? string(pattern, min, max) : regexp(pattern, min, max);
};
exports.match = match;
var sequence = function (patterns, min, max) {
    return matcher(function (input) {
        return patterns.reduce(function (_a, p, i) {
            var offset = _a[0], matches = _a[1];
            // once failed, fail to the end, fail always
            if (i > 0 && matches === null)
                return [0, null];
            var _b = p(input.substring(offset)), n = _b[0], t = _b[1];
            // null indicates that pattern FAILED
            if (t === null)
                return [0, null];
            return [offset + n, matches.concat([t])];
        }, [0, []]);
    }, min, max);
};
exports.sequence = sequence;
var any = function (patterns, min, max) {
    return matcher(function (input) {
        return patterns.reduce(function (_a, p, i) {
            var offset = _a[0], matches = _a[1];
            // once a match is found, continue to return the match
            if (matches !== null)
                return [offset, matches];
            var _b = p(input.substring(offset)), n = _b[0], t = _b[1];
            return [n, t];
        }, [0, null]);
    }, min, max);
};
exports.any = any;
