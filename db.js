var sqlite3 = require('sqlite3');
var mkdirp = require('mkdirp');

mkdirp.sync('./var/db');

var db = new sqlite3.Database('./var/db/todos.db');

db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS todos ( \
    id INTEGER PRIMARY KEY, \
    title TEXT NOT NULL, \
    completed INTEGER \
  )");

  db.all("PRAGMA table_info(todos)", [], function(err, columns) {
    if (err) { throw err; }

    var hasCreatedAt = columns.some(function(column) {
      return column.name === 'created_at';
    });

    if (hasCreatedAt) { return; }

    db.run("ALTER TABLE todos ADD COLUMN created_at TEXT", function(err) {
      if (err) { throw err; }

      db.run("UPDATE todos SET created_at = datetime('now') WHERE created_at IS NULL");
    });
  });
});

module.exports = db;
