#!/usr/bin/env node

'use strict';

/* global it:false */
/* global describe:false */
/* global before:false */
/* global after:false */

var encfs = require('../index.js'),
    exec = require('child_process').exec,
    async = require('async');

var assert = require('assert');
var expect = require('expect.js');

var TEST_ROOT = 'test_root';
var TEST_MNT = 'test_mnt';

function cleanup(done) {
    exec('rm -rf ' + TEST_ROOT, {}, function (error, stdout, stderr) {
        exec('rm -rf ' + TEST_MNT, {}, function (error, stdout, stderr) {
            done();
        });
    });
}

describe('encfs', function () {
    var volume;

    before(cleanup);
    after(cleanup);

    it('create volume', function (done) {
        encfs.create(TEST_ROOT, TEST_MNT, 'foobar1337', function (error, result) {
            expect(error).to.not.be.ok();
            expect(result).to.be.ok();

            volume = result;
            done();
        });
    });

    it('check volume is mounted', function (done) {
        volume.isMounted(function (error, result) {
            expect(error).to.not.be.ok();
            expect(result).to.be.ok();
            done();
        });
    });

    it('unmount volume', function (done) {
        volume.unmount(function (error) {
            expect(error).to.not.be.ok();
            done();
        });
    });

    it('check volume is unmounted', function (done) {
        volume.isMounted(function (error, result) {
            expect(error).to.not.be.ok();
            expect(result).to.not.be.ok();
            done();
        });
    });

    it('mount volume', function (done) {
        volume.mount('foobar1337', function (error) {
            expect(error).to.not.be.ok();
            done();
        });
    });

    it('unmount volume', function (done) {
        volume.unmount(function (error) {
            expect(error).to.not.be.ok();
            done();
        });
    });
});
