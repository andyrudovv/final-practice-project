import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "html", "head", "body", "title", "meta", "link", "style",
  "div", "span", "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "dl", "dt", "dd",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
  "form", "input", "textarea", "select", "option", "optgroup", "button", "label", "fieldset", "legend",
  "a", "img", "figure", "figcaption",
  "strong", "em", "b", "i", "u", "s", "sub", "sup", "small", "mark", "abbr", "code", "pre", "blockquote",
  "section", "article", "header", "footer", "nav", "main", "aside",
  "details", "summary",
];

const ALLOWED_ATTRS: Record<string, string[]> = {
  "*": ["class", "id", "style", "title", "lang", "dir", "role", "aria-*", "data-*", "contenteditable"],
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height"],
  input: ["type", "name", "value", "placeholder", "maxlength", "minlength", "pattern", "required", "readonly", "disabled", "checked", "inputmode", "aria-label"],
  textarea: ["name", "rows", "cols", "placeholder", "maxlength", "required", "readonly", "disabled"],
  select: ["name", "required", "disabled", "aria-label"],
  option: ["value", "selected", "disabled"],
  button: ["type", "disabled"],
  label: ["for"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan", "scope"],
  meta: ["charset", "name", "content"],
  link: ["rel", "href", "type"],
  col: ["span"],
  colgroup: ["span"],
};

export function sanitizeTemplate(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS,
    allowedSchemes: ["http", "https", "data"],
    allowVulnerableTags: true,
    parseStyleAttributes: false,
  });
}
