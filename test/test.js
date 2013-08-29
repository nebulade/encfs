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

var TEST_ROOT_FAIL = '/test_root';
var TEST_MNT_FAIL = '/test_mnt';

function cleanup(done) {
    exec('rm -rf ' + TEST_ROOT, {}, function (error, stdout, stderr) {
        exec('rm -rf ' + TEST_MNT, {}, function (error, stdout, stderr) {
            done();
        });
    });
}

describe('encfs', function () {
    describe('root', function () {
        var volume;

        before(cleanup);
        after(cleanup);

        it('create', function (done) {
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

    describe('create should fail', function () {
        it('mount point cannot be created', function (done) {
            encfs.create(TEST_ROOT, TEST_MNT_FAIL, 'foobar1337', function (error, result) {
                expect(error).to.be.ok();
                expect(result).to.not.be.ok();
                expect(error.code).to.be.equal('EACCES');

                done();
            });
        });

        it('root directory cannot be created', function (done) {
            encfs.create(TEST_ROOT_FAIL, TEST_MNT, 'foobar1337', function (error, result) {
                expect(error).to.be.ok();
                expect(result).to.not.be.ok();
                expect(error.code).to.be.equal('EACCES');

                done();
            });
        });

        it('root directory and mount point cannot be created', function (done) {
            encfs.create(TEST_ROOT_FAIL, TEST_MNT_FAIL, 'foobar1337', function (error, result) {
                expect(error).to.be.ok();
                expect(result).to.not.be.ok();
                expect(error.code).to.be.equal('EACCES');

                done();
            });
        });

        it('empty password provided', function (done) {
            encfs.create(TEST_ROOT, TEST_MNT, '', function (error, result) {
                expect(error).to.be.ok();
                expect(result).to.not.be.ok();

                done();
            });
        });
    });
});
