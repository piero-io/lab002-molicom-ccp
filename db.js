var sqlite3 = require('sqlite3');
var mkdirp = require('mkdirp');

mkdirp.sync('./var/db');

var db = new sqlite3.Database('./var/db/todos.db');

db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS todos ( \
    id INTEGER PRIMARY KEY, \
    title TEXT NOT NULL, \
    completed INTEGER, \
    created_at TEXT \
  )");

  // SQLite no tiene ADD COLUMN IF NOT EXISTS: en bases que ya existen esto agrega
  // la columna, y en las nuevas falla con "duplicate column name", que se ignora.
  db.run("ALTER TABLE todos ADD COLUMN created_at TEXT", function(err) {
    if (err && !/duplicate column name/i.test(err.message)) { throw err; }
  });
});

module.exports = db;
