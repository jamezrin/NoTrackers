var extension = require('../src/main');
var assert = require('assert');

describe('Query String Parsing', function () {
    it('should parse url with no parameters correctly', function () {
        assert.deepEqual(
            extension.parseQueryString("http://some.site/some"),
            {}
        );
    });
    it('should parse url with no parameters correctly, with interrogation mark', function () {
        assert.deepEqual(
            extension.parseQueryString("http://some.site/some?"),
            {}
        );
    });
    it('should parse url with one parameter without value correctly', function () {
        assert.deepEqual(
            extension.parseQueryString("http://some.site/some?foo"),
            { foo: "" }
        );
    });
    it('should parse url with one parameter without value correctly, with equals sign', function () {
        assert.deepEqual(
            extension.parseQueryString("http://some.site/some?foo="),
            { foo: "" }
        );
    });
    it('should parse url with one parameter without key or value correctly', function () {
        assert.deepEqual(
            extension.parseQueryString("http://some.site/some?="),
            { "": "" }
        );
    });
    it('should parse url with one valid parameter correctly', function () {
        assert.deepEqual(
            extension.parseQueryString("http://some.site/some?foo=bar"),
            { foo: "bar" }
        );
    });
    it('should parse url with multiple parameters correctly', function () {
        assert.deepEqual(
            extension.parseQueryString("http://some.site/some?foo=bar&azz=zza"),
            { foo: "bar", azz: "zza" }
        );
    });
    it('should parse url with one array parameter correctly', function () {
        assert.deepEqual(
            extension.parseQueryString("http://some.site/some?foo=bar&foo=baz"),
            { foo: ["bar", "baz"] }
        );
    });
    it('should parse url with mixed parameter types correctly', function () {
        assert.deepEqual(
            extension.parseQueryString("http://some.site/some?foo=bar&foo=baz&oof=duh"),
            { foo: ["bar", "baz"], oof: "duh" }
        );
    });
});