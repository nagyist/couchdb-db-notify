/****************
 * Dependencies
 ****************/

var url = require('url'),
    path = require('path'),
    rimraf = require('rimraf'),
    mkdirp = require('mkdirp'),
    assert = require('assert'),
    couchr = require('highland-couchr'),
    MultiCouch = require('multicouch'),
    notify = require('../lib/index'),
    _ = require('highland');


/*****************
 * Configuration
 *****************/

// configure test data directory and local couchdb port
var DATA_DIR = path.resolve(__dirname, 'data');
var COUCH_PORT = 8888;


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
        couch.on("start", function () {
            // give it time to become available
            setTimeout(done, 1000);
        });
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

exports['write changes from db_updates'] = function (done) {
    var target = 'db_notify';
    var failError = function (e) {
        assert.ok(false, e.message);
    };
    var createDb = _.curry(function (client, name) {
        return client.put(name, {});
    });
    var createDbs = function (dbs, client) {
        return _(dbs)
            .map(createDb(client)).series()
            .stopOnError(failError)
            .resume();
    };
    var dbChanges = function (client) {
        var q = {include_doc: true, since: 0};
        return client.changes(target, q).stopOnError(failError);
    };
    var notifier = notify.start({
        url: couch_url,
        target: target
    });
    notifier.on('start', function () {
        var client = couchr(couch_url);
        dbChanges(client).take(3).toArray(function (changes) {
            test.same(changes, [
                {id: 'foo'},
                {id: 'bar'},
                {id: 'baz'}
            ]);
            done();
        });
        createDbs(['foo', 'bar', 'baz'], client);
    });
};
