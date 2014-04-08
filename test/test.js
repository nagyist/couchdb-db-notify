/****************
 * Dependencies
 ****************/

var url = require('url'),
    path = require('path'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    assert = require('assert'),
    MultiCouch = require('multicouch'),
    pool = require('../lib/index');


/*****************
 * Configuration
 *****************/

// configure test data directory and local couchdb port
var DATA_DIR = path.resolve(__dirname, 'data');
var COUCH_PORT = 8080;


/********************
 * Setup / Teardown
 ********************/

// local couchdb url used in tests
var couch_url = url.format({
    port: COUCH_PORT,
    hostname: 'localhost',
    protocol: 'http'
});

// local couchdb instance
var couch = new MultiCouch({
    port: COUCH_PORT,
    prefix: DATA_DIR,
    respawn: false
});

// delete and recreate test data directory
function clearData(callback) {
    rimraf(DATA_DIR, function (err) {
        if (err) {
            return callback(err);
        }
        mkdirp(DATA_DIR, callback);
    });
}

// start local couchdb
exports.before = function (done) {
    this.timeout(10000);
    clearData(function (err) {
        assert(!err, err && err.message);
        couch.on("error", function(error) {
            console.error("CouchDB errored '%s'.", error);
        });
        couch.on("start", done);
        couch.start();
    });
};

// stop local couchdb
exports.after = function (done) {
    this.timeout(10000);
    couch.on("stop", done);
    couch.stop();
};


/*********
 * Tests
 *********/

exports['foo'] = function (done) {
    assert(true, 'ok then');
    done();
};
