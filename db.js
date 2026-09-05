var sqlite3 = require('sqlite3');
var mkdirp = require('mkdirp');

var UNDO_TTL_MS = 5000;

mkdirp.sync('./var/db');

var db = new sqlite3.Database('./var/db/todos.db');

db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS todos ( \
    id INTEGER PRIMARY KEY, \
    title TEXT NOT NULL, \
    completed INTEGER, \
    deleted_at INTEGER \
  )");

  function sweepExpired() {
    // Un reinicio del servidor puede dejar tareas a medio "deshacer": las
    // que ya cumplieron su plazo se borran definitivamente al arrancar.
    db.run('DELETE FROM todos WHERE deleted_at IS NOT NULL AND deleted_at <= ?', [Date.now() - UNDO_TTL_MS]);
  }

  db.all("PRAGMA table_info(todos)", [], function(err, columns) {
    if (err) { return; }
    var hasDeletedAt = columns.some(function(column) { return column.name === 'deleted_at'; });
    if (hasDeletedAt) { return sweepExpired(); }
    db.run("ALTER TABLE todos ADD COLUMN deleted_at INTEGER", sweepExpired);
  });
});

module.exports = db;
