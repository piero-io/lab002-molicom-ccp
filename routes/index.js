var express = require('express');
var router = express.Router();
var db = require('../db');

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
    next();
  });
}

function searchTodos(req, res, next) {
  var search = (req.query.q || '').trim();

  res.locals.search = search;
  res.locals.searchQuery = search ? '?q=' + encodeURIComponent(search) : '';

  if (search) {
    var needle = search.toLowerCase();
    res.locals.todos = res.locals.todos.filter(function(todo) {
      return todo.title.toLowerCase().indexOf(needle) !== -1;
    });
  }
  next();
}

/* Vuelve a la lista conservando el filtro y la búsqueda activos. */
function redirectToList(req, res) {
  var search = (req.body.q || '').trim();
  var url = '/' + (req.body.filter || '');
  if (search) { url += '?q=' + encodeURIComponent(search); }
  return res.redirect(url);
}

/* GET home page. */
router.get('/', fetchTodos, searchTodos, function(req, res, next) {
  res.locals.filter = null;
  res.render('index');
});

router.get('/active', fetchTodos, searchTodos, function(req, res, next) {
  res.locals.todos = res.locals.todos.filter(function(todo) { return !todo.completed; });
  res.locals.filter = 'active';
  res.render('index');
});

router.get('/completed', fetchTodos, searchTodos, function(req, res, next) {
  res.locals.todos = res.locals.todos.filter(function(todo) { return todo.completed; });
  res.locals.filter = 'completed';
  res.render('index');
});

router.post('/', function(req, res, next) {
  req.body.title = req.body.title.trim();
  next();
}, function(req, res, next) {
  if (req.body.title !== '') { return next(); }
  return redirectToList(req, res);
}, function(req, res, next) {
  db.run('INSERT INTO todos (title, completed) VALUES (?, ?)', [
    req.body.title,
    req.body.completed == true ? 1 : null
  ], function(err) {
    if (err) { return next(err); }
    return redirectToList(req, res);
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
    return redirectToList(req, res);
  });
}, function(req, res, next) {
  db.run('UPDATE todos SET title = ?, completed = ? WHERE id = ?', [
    req.body.title,
    req.body.completed !== undefined ? 1 : null,
    req.params.id
  ], function(err) {
    if (err) { return next(err); }
    return redirectToList(req, res);
  });
});

router.post('/:id(\\d+)/delete', function(req, res, next) {
  db.run('DELETE FROM todos WHERE id = ?', [
    req.params.id
  ], function(err) {
    if (err) { return next(err); }
    return redirectToList(req, res);
  });
});

router.post('/toggle-all', function(req, res, next) {
  db.run('UPDATE todos SET completed = ?', [
    req.body.completed !== undefined ? 1 : null
  ], function(err) {
    if (err) { return next(err); }
    return redirectToList(req, res);
  });
});

router.post('/clear-completed', function(req, res, next) {
  db.run('DELETE FROM todos WHERE completed = ?', [
    1
  ], function(err) {
    if (err) { return next(err); }
    return redirectToList(req, res);
  });
});

module.exports = router;
