var ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, function(chr) {
    return ESCAPES[chr];
  });
}

/**
 * Devuelve el título con las coincidencias de la búsqueda envueltas en <mark>.
 * La vista imprime el resultado sin escapar (<%- %>), así que el escapado del
 * texto del usuario se hace aquí.
 */
module.exports = function highlight(title, search) {
  if (!search) { return escapeHtml(title); }

  var haystack = title.toLowerCase();
  var needle = search.toLowerCase();
  var html = '';
  var from = 0;
  var at = haystack.indexOf(needle);

  while (at !== -1) {
    html += escapeHtml(title.slice(from, at));
    html += '<mark>' + escapeHtml(title.slice(at, at + needle.length)) + '</mark>';
    from = at + needle.length;
    at = haystack.indexOf(needle, from);
  }

  return html + escapeHtml(title.slice(from));
};
