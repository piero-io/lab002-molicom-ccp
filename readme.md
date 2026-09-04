# lab002 · Molicom · Claude Code Professional

Repositorio de laboratorio de la **Sesión 2** del programa Claude Code Professional.

Es una lista de tareas ([TodoMVC](http://todomvc.com)) hecha con **Express + SQLite + EJS**:
crear, editar con doble clic, completar, filtrar y borrar. Sin framework de front, sin
proceso de compilación.

## Cómo levantarlo

```bash
npm install
npm start
```

Abre <http://localhost:3000>. La base de datos SQLite se crea sola en `var/db/todos.db`
la primera vez que arranca.

> **No hagas commit de `var/`.** Ya está en el `.gitignore`: es un binario que cambia con
> cada clic y haría chocar a todo el equipo en cada push.

## Estructura

```
├── app.js            # Express y middleware
├── db.js             # SQLite: crea la tabla todos
├── routes/index.js   # todas las rutas
├── views/index.ejs   # la vista completa
├── public/css/       # estilos
└── bin/www           # arranque del servidor
```

## La dinámica de la sesión

Cinco participantes trabajan **en paralelo sobre este mismo repositorio**, cada uno en su
rama, pidiéndole todo a Claude Code en lenguaje natural. La rama `main` está protegida:
solo se entra por pull request y con una aprobación.

| Participante | Funcionalidad | Rama |
|---|---|---|
| 1 | Fecha de creación y orden por más reciente | `feat/p1-fecha-creacion` |
| 2 | Prioridad con estrella clicable | `feat/p2-prioridad` |
| 3 | Buscador por texto | `feat/p3-buscador` |
| 4 | Modo oscuro con persistencia | `feat/p4-modo-oscuro` |
| 5 | Deshacer el borrado | `feat/p5-deshacer-borrado` |

Los participantes 1, 2 y 5 tocan `db.js`; los participantes 3 y 4 tocan el encabezado de
`views/index.ejs`. **Los conflictos van a aparecer, y eso es parte del ejercicio.**

Las instrucciones completas están en la guía de la sesión.

## Origen del código

El código base es **[todos-express-sqlite](https://github.com/jaredhanson/todos-express-sqlite)**
de [Jared Hanson](https://www.jaredhanson.me), parte de [TodoMVC](http://todomvc.com).
Este repositorio conserva el historial de commits original; los cambios propios del
laboratorio se agregan a partir de ahí.

El proyecto original no declara licencia. Este repositorio existe únicamente con fines
educativos, sin uso comercial y manteniendo la atribución a su autor.
