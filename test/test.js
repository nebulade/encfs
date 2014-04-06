#!/usr/bin/env node

'use strict';

/* global it:false */
/* global describe:false */
/* global before:false */
/* global after:false */

var encfs = require('../index.js'),
    crypto = require('crypto'),
    path = require('path'),
    rimraf = require('rimraf'),
    async = require('async'),
    assert = require('assert'),
    expect = require('expect.js');

var TMP_DIR = 'encfs-test-' + crypto.randomBytes(4).readUInt32LE(0);
var TEST_ROOT = path.join(TMP_DIR, 'test_root');
var TEST_MNT = path.join(TMP_DIR, 'test_mnt');

var TEST_ROOT_FAIL = '/test_root';
var TEST_MNT_FAIL = '/test_mnt';

encfs.BUSY_TIMEOUT = 10000;

function cleanup(done) {
    rimraf.sync(TMP_DIR);
    done();
}

describe('encfs', function () {
    this.timeout(encfs.BUSY_TIMEOUT);

    describe('root first round', function () {
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

    describe('root second round', function () {
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

        before(cleanup);
        after(cleanup);

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
