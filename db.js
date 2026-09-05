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
  db.run("ALTER TABLE todos ADD COLUMN priority INTEGER DEFAULT 0", function(err) {
    if (err && !/duplicate column name/i.test(err.message)) {
      throw err;
    }
  });
});

module.exports = db;
