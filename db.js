var sqlite3 = require('sqlite3');
var mkdirp = require('mkdirp');

mkdirp.sync('./var/db');

var db = new sqlite3.Database('./var/db/todos.db');

db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS todos ( \
    id INTEGER PRIMARY KEY, \
    title TEXT NOT NULL, \
    completed INTEGER, \
    deleted_at INTEGER \
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
});

module.exports = db;
