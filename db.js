var sqlite3 = require('sqlite3');
var mkdirp = require('mkdirp');

mkdirp.sync('./var/db');

var db = new sqlite3.Database('./var/db/todos.db');

db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS todos ( \
    id INTEGER PRIMARY KEY, \
    title TEXT NOT NULL, \
    completed INTEGER, \
    priority INTEGER \
  )");

  // Bases creadas antes de que existiera `priority` no la tienen: el error de
  // columna duplicada es el caso normal en bases nuevas y se ignora.
  db.run("ALTER TABLE todos ADD COLUMN priority INTEGER", function(err) {});
});

module.exports = db;
