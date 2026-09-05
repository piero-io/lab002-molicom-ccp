var ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(chr) { return ESCAPES[chr]; });
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escapa `title` para HTML y envuelve en <mark> cada aparicion de `query`,
 * ignorando mayusculas. Devuelve HTML ya escapado, asi que la vista lo
 * imprime con <%- %> y no con <%= %>.
 */
module.exports = function highlight(title, query) {
  title = String(title);
  if (!query) { return escapeHtml(title); }

  var re = new RegExp(escapeRegExp(query), 'gi');
  var html = '';
  var from = 0;
  var match;

  while ((match = re.exec(title)) !== null) {
    html += escapeHtml(title.slice(from, match.index));
    html += '<mark>' + escapeHtml(match[0]) + '</mark>';
    from = match.index + match[0].length;
  }

  return html + escapeHtml(title.slice(from));
};
