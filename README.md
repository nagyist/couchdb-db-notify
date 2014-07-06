# CouchDB DB notify
[![Build Status](https://travis-ci.org/hoodiehq/couchdb-db-notify.svg)](https://travis-ci.org/hoodiehq/couchdb-db-notify)

This is a Node.js process which detects database changes and writes these
updates to a single database in CouchDB in the form of documents. You can
then subscribe to this changes feed to be notified of newly created, deleted
or modified databases.

Each document in the notify db will have an id named after the database it
describes. If the database was newly created it will have a `type: "created"`.
If the database has been removed the related doc will deleted. Otherwise, the
related doc will be updated with `type: "updated"`. Created and modified
documents will also have a `seq` property which is the last seen sequence id
for the related database.
