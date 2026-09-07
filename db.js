var sqlite3 = require('sqlite3');
var mkdirp = require('mkdirp');

mkdirp.sync('./var/db');

var db = new sqlite3.Database('./var/db/todos.db');

db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS todos ( \
    id INTEGER PRIMARY KEY, \
    title TEXT NOT NULL, \
    completed INTEGER, \
    created_at TEXT, \
    deleted_at INTEGER, \
    priority INTEGER \
  )");

  // Las bases que ya existían antes de «deshacer el borrado» no tienen la
  // columna deleted_at: se la agregamos sin tocar las tareas guardadas.
  db.all("PRAGMA table_info(todos)", [], function(err, columns) {
    if (err) { throw err; }

    var hasDeletedAt = columns.some(function(column) {
      return column.name === 'deleted_at';
    });
    if (!hasDeletedAt) {
      db.run("ALTER TABLE todos ADD COLUMN deleted_at INTEGER");
    }
  });

  // Bases creadas antes de que existiera `priority` no la tienen: el error de
  // columna duplicada es el caso normal en bases nuevas y se ignora.
  db.run("ALTER TABLE todos ADD COLUMN priority INTEGER", function(err) {});

  // SQLite no tiene ADD COLUMN IF NOT EXISTS: en bases que ya existen esto agrega
  // la columna, y en las nuevas falla con "duplicate column name", que se ignora.
  db.run("ALTER TABLE todos ADD COLUMN created_at TEXT", function(err) {
    if (err && !/duplicate column name/i.test(err.message)) { throw err; }
  });
});

module.exports = db;
