var express = require('express');
var router = express.Router();
var db = require('../db');

// Cuánto tiempo se puede deshacer un borrado antes de que la fila desaparezca.
var UNDO_WINDOW_MS = 10000;

// Las tareas borradas siguen en la tabla hasta que vence el plazo; recién ahí
// se van de verdad. Corre antes de cada listado, así nadie ve tareas zombis.
function purgeExpired(req, res, next) {
  db.run('DELETE FROM todos WHERE deleted_at IS NOT NULL AND deleted_at <= ?', [
    Date.now() - UNDO_WINDOW_MS
  ], function(err) {
    if (err) { return next(err); }
    next();
  });
}

// Si venimos de borrar (?undo=<id>) y el plazo sigue vivo, pasamos a la vista
// lo necesario para ofrecer «Deshacer».
function fetchPendingUndo(req, res, next) {
  res.locals.undo = null;
  if (!req.query.undo) { return next(); }

  db.get('SELECT * FROM todos WHERE id = ? AND deleted_at IS NOT NULL', [
    req.query.undo
  ], function(err, row) {
    if (err) { return next(err); }

    if (row) {
      res.locals.undo = {
        title: row.title,
        url: '/' + row.id + '/undo',
        secondsLeft: Math.max(0, Math.ceil((row.deleted_at + UNDO_WINDOW_MS - Date.now()) / 1000))
      };
    }
    next();
  });
}

// Borrar es marcar: la fila queda intacta y sale del listado, pero se puede
// recuperar mientras dure el plazo.
function softDelete(req, res, next) {
  db.run('UPDATE todos SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL', [
    Date.now(),
    req.params.id
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || '') + '?undo=' + req.params.id);
  });
}

function fetchTodos(req, res, next) {
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
    res.locals.todos = todos;
    res.locals.activeCount = todos.filter(function(todo) { return !todo.completed; }).length;
    res.locals.completedCount = todos.length - res.locals.activeCount;
    next();
  });
}

/* GET home page. */
router.get('/', purgeExpired, fetchTodos, fetchPendingUndo, function(req, res, next) {
  res.locals.filter = null;
  res.render('index');
});

router.get('/active', purgeExpired, fetchTodos, fetchPendingUndo, function(req, res, next) {
  res.locals.todos = res.locals.todos.filter(function(todo) { return !todo.completed; });
  res.locals.filter = 'active';
  res.render('index');
});

router.get('/completed', purgeExpired, fetchTodos, fetchPendingUndo, function(req, res, next) {
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
  softDelete(req, res, next);
}, function(req, res, next) {
  db.run('UPDATE todos SET title = ?, completed = ? WHERE id = ? AND deleted_at IS NULL', [
    req.body.title,
    req.body.completed !== undefined ? 1 : null,
    req.params.id
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
});

router.post('/:id(\\d+)/delete', function(req, res, next) {
  softDelete(req, res, next);
});

// Devuelve la tarea tal cual estaba, siempre que el plazo no haya vencido.
router.post('/:id(\\d+)/undo', function(req, res, next) {
  db.run('UPDATE todos SET deleted_at = NULL WHERE id = ? AND deleted_at > ?', [
    req.params.id,
    Date.now() - UNDO_WINDOW_MS
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
