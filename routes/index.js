var express = require('express');
var router = express.Router();
var db = require('../db');

/* El termino de busqueda llega por querystring en los GET (?q=pago) y por
 * campo oculto en los POST, igual que `filter`. */
function searchQuery(req) {
  var q = req.query.q || (req.body && req.body.q) || '';
  return String(q).trim();
}

/* A donde volver despues de un POST, conservando filtro y busqueda. */
function backTo(req) {
  var url = '/' + (req.body.filter || '');
  var q = searchQuery(req);
  if (q) { url += '?q=' + encodeURIComponent(q); }
  return url;
}

function fetchTodos(req, res, next) {
  db.all('SELECT * FROM todos', [], function(err, rows) {
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

    var q = searchQuery(req);
    res.locals.q = q;
    if (q) {
      var needle = q.toLowerCase();
      res.locals.todos = todos.filter(function(todo) {
        return todo.title.toLowerCase().indexOf(needle) !== -1;
      });
    }

    next();
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
  return res.redirect(backTo(req));
}, function(req, res, next) {
  db.run('INSERT INTO todos (title, completed) VALUES (?, ?)', [
    req.body.title,
    req.body.completed == true ? 1 : null
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect(backTo(req));
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
    return res.redirect(backTo(req));
  });
}, function(req, res, next) {
  db.run('UPDATE todos SET title = ?, completed = ? WHERE id = ?', [
    req.body.title,
    req.body.completed !== undefined ? 1 : null,
    req.params.id
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect(backTo(req));
  });
});

router.post('/:id(\\d+)/delete', function(req, res, next) {
  db.run('DELETE FROM todos WHERE id = ?', [
    req.params.id
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect(backTo(req));
  });
});

router.post('/toggle-all', function(req, res, next) {
  db.run('UPDATE todos SET completed = ?', [
    req.body.completed !== undefined ? 1 : null
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect(backTo(req));
  });
});

router.post('/clear-completed', function(req, res, next) {
  db.run('DELETE FROM todos WHERE completed = ?', [
    1
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect(backTo(req));
  });
});

module.exports = router;
