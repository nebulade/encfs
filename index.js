'use strict';

var assert = require('assert'),
    path = require('path'),
    util = require('util'),
    mkdirp = require('mkdirp'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    debug = require('debug')('encfs'),
    os = require('os');

exports = module.exports = {
    BUSY_TIMEOUT: BUSY_TIMEOUT,
    create: create,
    Root: Root
};

function EncfsError(obj, code) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.message = typeof obj === 'string' ? obj : JSON.stringify(obj);
    this.code = code || EncfsError.GENERIC;
}
util.inherits(EncfsError, Error);
EncfsError.GENERIC = 1;
EncfsError.BUSY = 2;
EncfsError.BUSY_TIMEOUT = 3;
EncfsError.EMPTY_PASSWORD = 4;

var ENCFS_CMD = 'encfs';
var ENCFS_CMD_ARGS = ['--standard', '--stdinpass'];
var ENCFS_CTL = 'encfsctl';

var FUSE_CMD = os.platform() === 'darwin' ? 'umount' : 'fusermount';
var FUSE_CMD_UMOUNT_ARGS = os.platform() === 'darwin' ? [ ] : ['-u'];

var BUSY_TIMEOUT = 1000;

// Internal helper
function spawnProcess(process, args, callback) {
    var proc = spawn(process, args);
    var errorData = '';
    var stdoutData = '';

    proc.on('error', function (code, signal) {
        debug('Process error: code %d caused by signal %s', code, signal);
        callback(new EncfsError({ code: code, signal: signal }));
    });

    proc.on('exit', function (code, signal) {
        debug('Process exit: code %d caused by signal %s', code, signal);
        if (code !== 0) {
            if (errorData.indexOf('Device or resource busy') >= 0) {
                return callback(new EncfsError(errorData, EncfsError.BUSY));
            }

            return callback(new EncfsError({ code: code, signal: signal }));
        }

        return callback();
    });

    proc.stdout.on('data', function (data) {
        debug('Process data on stdout: %s', data);
    });

    proc.stderr.on('data', function (data) {
        debug('Process data on stderr: %s', data);
        errorData += data;
    });

    return proc.stdin;
}

// Internal helper
function createOrMount(root, password, callback) {
    var absRootPath = path.resolve(__dirname, root.rootPath);
    var absMountPoint = path.resolve(__dirname, root.mountPoint);

    var args = ENCFS_CMD_ARGS.concat([absRootPath, absMountPoint]);

    // The callbackWrapper makes sure we only call back once!
    var calledBack = false;
    function callbackWrapper(error) {
        if (calledBack) {
            return;
        }

        calledBack = true;
        callback(error);
    }

    var stdin = spawnProcess(ENCFS_CMD, args, function (error) {
        if (error) {
            return callbackWrapper(error);
        }

        callbackWrapper();
    });

    if (stdin) {
        try {
            stdin.write(password);
            stdin.end();
        } catch (e) {
            return callbackWrapper(e);
        }
    } else {
        return callbackWrapper('No stdin available');
    }
}

// creates a new encypted volume
// <- returns the newly created Root object in the callback's result
function create(rootPath, mountPoint, password, callback) {
    assert(typeof rootPath === 'string', '1 argument must be a string');
    assert(typeof mountPoint === 'string', '2 argument must be a string');
    assert(typeof password === 'string', '3 argument must be a string');
    assert(typeof callback === 'function', '4 argument must be a callback function');

    if (password.length === 0) {
        debug('encfs.create() - Password must not be zero length');
        return callback(new EncfsError('Password must not be zero length', EncfsError.EMPTY_PASSWORD));
    }

    var absRootPath = path.resolve(__dirname, rootPath);
    var absMountPoint = path.resolve(__dirname, mountPoint);

    mkdirp(absRootPath, function (error) {
        if (error) {
            debug('encfs.create() - Unable to mkdir root path "%s": ' + error, absRootPath);
            return callback(error);
        }

        mkdirp(absMountPoint, function (error) {
            if (error) {
                debug('encfs.create() - Unable to mkdir mount point path "%s": ' + error, absMountPoint);
                return callback(error);
            }

            var root = new Root(absRootPath, absMountPoint);

            createOrMount(root, password, function (error) {
                if (error) {
                    debug('encfs.create() - Unable create encrypted root "%s": ' + error, root);
                    return callback(error);
                }

                return callback(null, root);
            });
        });
    });
}

function Root(rootPath, mountPoint) {
    assert(typeof rootPath === 'string', '1 argument must be a string');
    assert(typeof mountPoint === 'string', '2 argument must be a string');

    this.rootPath = rootPath;
    this.mountPoint = mountPoint;
}

Root.prototype.mount = function(password, callback) {
    assert(typeof password === 'string', '1 argument must be a string');
    assert(typeof callback === 'function', '2 argument must be a callback function');

    createOrMount(this, password, callback);
};

Root.prototype.unmount = function(callback) {
    assert(typeof callback === 'function', '1 argument must be a callback function');

    debug('unmount() ' + this.mountPoint);

    var args = FUSE_CMD_UMOUNT_ARGS.concat([this.mountPoint]);
    var timeout = BUSY_TIMEOUT;

    function tryUnmount() {
        spawnProcess(FUSE_CMD, args, function (error) {
            if (error && error.code === EncfsError.BUSY) {
                if (timeout) {
                    debug('Device still busy. Schedule timeout to retry in ' + timeout + 'ms.');
                    setTimeout(tryUnmount, timeout);
                    timeout = 0;
                    return;
                }

                debug('Unmount failed even after retry. Device still busy.');
                return callback(new EncfsError('Operation timed out device still busy.', EncfsError.BUSY_TIMEOUT));
            }

            callback(error);
        });
    }

    tryUnmount();
};

Root.prototype.info = function(callback) {
    assert(typeof callback === 'function', '1 argument must be a callback function');
};

Root.prototype.isMounted = function(callback) {
    var that = this;

    exec('mount', {}, function (error, stdout, stderr) {
        if (error) {
            debug('encfs.Root.isMounted() - Unable to check mount state: ' + error);
            return callback(error);
        }

        return callback(null, (stdout.indexOf(that.mountPoint) >= 0));
    });
};
