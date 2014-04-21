var url = require('url'),
    request = require('request'),
    couchr = require('highland-couchr'),
    EventEmitter = require('events').EventEmitter,
    _ = require('highland');


exports.ensureDb = function (url) {
    return couchr.get(url, {}).onError(couchr.put(url, {}));
};

exports.withDb = function (url) {
    return exports.ensureDb(url).map(couchr(url));
};

exports.targetURL = function (opt) {
    return url.resolve(opt.url, opt.target);
};

exports.dbUpdatesURL = function (couch) {
    return url.resolve(couch, '/_db_updates');
};

exports.rawDbUpdates = function (loc) {
    return _.forever(function () {
        return _(request(loc, {qs: {feed: 'continuous'}}));
    });
};

var logError = function (err) {
    console.error('couchdb-db-notify Error: ' + err);
};

exports.dbUpdates = function (couch) {
    var loc = exports.dbUpdatesURL(couch);
    return exports.rawDbUpdates(loc)
        .lines()
        .map(JSON.parse)
        .errors(logError);
};

exports.getSeq = function (db) {
    return couchr.get(db).pluck('update_seq');
};

exports.createUpdateDoc = function (target, update) {
    var db = url.resolve(target.url, update.db_name);
    return exports.getSeq(db).map(function (seq) {
        return {
            _id: update.db_name,
            type: update.type,
            seq: seq
        };
    });
};

exports.handleUpdate = _.curry(function (target, update) {
    if (update.type === 'deleted') {
        return target.del(update.db_name);
    }
    return exports.createUpdateDoc(target, update)
        .map(target.put(update.db_name))
        .series();
});

exports.subscribe = function (target) {
    return exports.dbUpdates(target.url)
        .map(exports.handleUpdate)
        .errors(logError)
        .resume();
};

exports.start = function (opt) {
    var target = exports.targetURL(opt);
    exports.withDb(target).apply(exports.subscribe);
};
