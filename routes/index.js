var express = require('express');
var router = express.Router();
var db = require('../db');

var UNDO_TTL_MS = 5000;

function fetchTodos(req, res, next) {
  db.run('DELETE FROM todos WHERE deleted_at IS NOT NULL AND deleted_at <= ?', [Date.now() - UNDO_TTL_MS], function(err) {
    if (err) { return next(err); }

    db.all('SELECT * FROM todos WHERE deleted_at IS NULL', [], function(err, rows) {
      if (err) { return next(err); }

      var todos = rows.map(function(row) {
        return {
          id: row.id,
          title: row.title,
          completed: row.completed == 1 ? true : false,
          url: '/' + row.id
        }
      });
      res.locals.activeCount = todos.filter(function(todo) { return !todo.completed; }).length;
      res.locals.completedCount = todos.length - res.locals.activeCount;

      var undoId = req.query.undo ? Number(req.query.undo) : null;
      if (!undoId) {
        res.locals.todos = todos;
        return next();
      }

      db.get('SELECT * FROM todos WHERE id = ? AND deleted_at IS NOT NULL', [undoId], function(err, row) {
        if (err) { return next(err); }

        if (row) {
          var remainingMs = row.deleted_at + UNDO_TTL_MS - Date.now();
          if (remainingMs > 0) {
            var pendingTodo = {
              id: row.id,
              title: row.title,
              completed: row.completed == 1 ? true : false,
              url: '/' + row.id,
              pendingDelete: true,
              remainingMs: remainingMs
            };
            var insertAt = todos.findIndex(function(todo) { return todo.id > pendingTodo.id; });
            if (insertAt === -1) { todos.push(pendingTodo); } else { todos.splice(insertAt, 0, pendingTodo); }
          }
        }

        res.locals.todos = todos;
        next();
      });
    });
  });
}

/* GET home page. */
router.get('/', fetchTodos, function(req, res, next) {
  res.locals.filter = null;
  res.render('index');
});

router.get('/active', fetchTodos, function(req, res, next) {
  res.locals.todos = res.locals.todos.filter(function(todo) { return !todo.completed; });
  res.locals.filter = 'active';
  res.render('index');
});

router.get('/completed', fetchTodos, function(req, res, next) {
  res.locals.todos = res.locals.todos.filter(function(todo) { return todo.completed; });
  res.locals.filter = 'completed';
  res.render('index');
});

router.post('/', function(req, res, next) {
  req.body.title = req.body.title.trim();
  next();
}, function(req, res, next) {
  if (req.body.title !== '') { return next(); }
  return res.redirect('/' + (req.body.filter || ''));
}, function(req, res, next) {
  db.run('INSERT INTO todos (title, completed) VALUES (?, ?)', [
    req.body.title,
    req.body.completed == true ? 1 : null
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
});

router.post('/:id(\\d+)', function(req, res, next) {
  req.body.title = req.body.title.trim();
  next();
}, function(req, res, next) {
  if (req.body.title !== '') { return next(); }
  db.run('DELETE FROM todos WHERE id = ?', [
    req.params.id
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
}, function(req, res, next) {
  db.run('UPDATE todos SET title = ?, completed = ? WHERE id = ?', [
    req.body.title,
    req.body.completed !== undefined ? 1 : null,
    req.params.id
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
});

router.post('/:id(\\d+)/delete', function(req, res, next) {
  db.run('UPDATE todos SET deleted_at = ? WHERE id = ?', [
    Date.now(),
    req.params.id
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || '') + '?undo=' + req.params.id);
  });
});

router.post('/:id(\\d+)/undo', function(req, res, next) {
  db.run('UPDATE todos SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL', [
    req.params.id
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
});

router.post('/toggle-all', function(req, res, next) {
  db.run('UPDATE todos SET completed = ? WHERE deleted_at IS NULL', [
    req.body.completed !== undefined ? 1 : null
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
});

router.post('/clear-completed', function(req, res, next) {
  db.run('DELETE FROM todos WHERE completed = ? AND deleted_at IS NULL', [
    1
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
});

module.exports = router;
