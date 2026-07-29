// Badge Labels: shows each badge's full title next to its icon, moves the badge
// list below or beside the avatar, and can show the author's post count in the
// same place.
//
// The label is rendered as a real element next to the badge, not as a
// `content: attr(aria-label)` pseudo-element. That matters for two reasons: an
// aria-label is not something every badge sets (so a CSS-only version silently
// prints nothing for those), and a pseudo-element has no width of its own, so
// the CSS-only version has to reserve room for the longest name with a fixed
// gap and breaks as soon as a forum's badges are longer or more numerous than
// that guess. A real element takes the width it needs, and the list is a flex
// container, so any number of badges of any name length lays out correctly.
//
// This bundle imports NOTHING from flarum/* and feature-detects the globals
// instead, so one artifact runs on both Flarum 1.8 and 2.x.

const EXT_ID = 'linkrobins-badge-labels';
const ATTR = 'linkrobinsBadgeLabels';

const LAYOUTS = ['below', 'beside'];
const DEFAULT_LAYOUT = 'below';
const DEFAULT_COLUMN_WIDTH = 150;
const MIN_COLUMN_WIDTH = 85;
const MAX_COLUMN_WIDTH = 400;

// ------------------------------------------------------------------ settings

function truthy(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function forumAttribute(name, fallback) {
  const app = window.app;

  try {
    if (app.forum && typeof app.forum.attribute === 'function') {
      const value = app.forum.attribute(name);
      if (value !== undefined && value !== null) return value;
    }
  } catch (e) {}

  // Initializers run before app.forum is built, so fall back to the raw boot
  // payload, which is already loaded by then.
  try {
    const resources = app.data && app.data.resources;
    if (Array.isArray(resources)) {
      const forum = resources.filter((resource) => resource && resource.type === 'forums')[0];
      const value = forum && forum.attributes && forum.attributes[name];
      if (value !== undefined && value !== null) return value;
    }
  } catch (e) {}

  return fallback;
}

// Settings can't change without a page load, so resolve them once.
let cached = null;

function settings() {
  if (cached) return cached;

  const layout = String(forumAttribute(ATTR + 'Layout', DEFAULT_LAYOUT));
  const width = parseInt(forumAttribute(ATTR + 'ColumnWidth', DEFAULT_COLUMN_WIDTH), 10);

  cached = {
    layout: LAYOUTS.indexOf(layout) >= 0 ? layout : DEFAULT_LAYOUT,
    labels: truthy(forumAttribute(ATTR + 'Labels', true)),
    postCount: truthy(forumAttribute(ATTR + 'PostCount', true)),
    phone: truthy(forumAttribute(ATTR + 'Phone', false)),
    columnWidth: Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, isNaN(width) ? DEFAULT_COLUMN_WIDTH : width)),
  };

  return cached;
}

function isTwoPointX() {
  try {
    return !!(window.flarum && window.flarum.reg);
  } catch (e) {
    return false;
  }
}

// Everything the stylesheet keys off lives on the root element, so the CSS
// never has to care which settings produced a given post.
function applyRootClasses() {
  const s = settings();
  const root = document.documentElement;
  if (!root || !root.classList) return;

  const classes = ['lrBadgeLabels'];

  if (s.labels) classes.push('lrBadgeLabels--labels');
  if (s.postCount) classes.push('lrBadgeLabels--postCount');
  if (s.phone) classes.push('lrBadgeLabels--phone');

  if (s.layout === 'beside') {
    classes.push('lrBadgeLabels--beside');
  } else {
    // The author column has to make room for the badges and their titles; the
    // beside layout takes them out of that column, so it leaves it alone.
    classes.push('lrBadgeLabels--below', 'lrBadgeLabels--wide');
  }

  // 1.x compiles the author column width in as a LESS variable; 2.x exposes it
  // as a custom property. The two need different overrides.
  classes.push(isTwoPointX() ? 'lrBadgeLabels--v2' : 'lrBadgeLabels--v1');

  classes.forEach((name) => root.classList.add(name));
  root.style.setProperty('--lrbl-column-width', s.columnWidth + 'px');
}

// -------------------------------------------------------------------- badges

// A badge's label usually isn't on the vnode yet: core's GroupBadge (and any
// other Badge subclass) fills in `label` and `color` in initAttrs, which
// Mithril only runs when the component is initialised. Running it here against
// a COPY of the attrs gets the same values without touching the vnode we hand
// back to Mithril, and works for any badge that follows the same convention
// rather than just the ones that happen to pass a literal label.
function resolvedAttrs(vnode) {
  if (!vnode || typeof vnode !== 'object' || !vnode.attrs) return {};

  const attrs = vnode.attrs;
  const tag = vnode.tag;

  if (attrs.label === undefined && tag && typeof tag.initAttrs === 'function') {
    try {
      const copy = Object.assign({}, attrs);
      tag.initAttrs(copy);
      return copy;
    } catch (e) {}
  }

  return attrs;
}

function parseColor(color) {
  if (typeof color !== 'string') return null;

  const hex = color.trim().replace(/^#/, '');

  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return [parseInt(hex[0] + hex[0], 16), parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16)];
  }

  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  }

  return null;
}

// A label pill picks up the badge's own colour, so it has to bring its own
// readable text colour with it rather than inheriting the theme's.
function contrastClass(color) {
  const rgb = parseColor(color);
  if (!rgb) return '';

  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;

  return luminance > 0.55 ? ' LrBadgeLabels-label--onLight' : ' LrBadgeLabels-label--onDark';
}

function labelFor(badge) {
  const attrs = resolvedAttrs(badge);
  const label = attrs.label;

  // A label can legitimately be a translated vnode rather than a string, so
  // anything renderable is kept as-is and only strings become a title.
  if (label === undefined || label === null || label === '') return null;

  return { content: label, color: typeof attrs.color === 'string' ? attrs.color : '', title: typeof label === 'string' ? label : undefined };
}

// Rebuild the badge list, wrapping each badge the way core's listItems() does
// (same item- class and key, so other extensions' styles keep matching) and
// adding the label beside it.
function badgeItems(user, withLabels) {
  const m = window.m;
  const list = user.badges();
  const badges = list && typeof list.toArray === 'function' ? list.toArray() : [];

  return badges
    .filter((badge) => badge)
    .map((badge, index) => {
      const name = badge.itemName;
      const key = (badge.attrs && badge.attrs.key) || name || 'badge' + index;
      const label = withLabels ? labelFor(badge) : null;

      const children = [badge];

      if (label) {
        children.push(
          m(
            'span',
            {
              className: 'LrBadgeLabels-label' + contrastClass(label.color),
              style: label.color ? { '--lrbl-accent': label.color } : undefined,
              title: label.title,
            },
            label.content
          )
        );
      }

      return m(
        'li',
        {
          // The labelled marker is what lets the stylesheet join the icon and
          // the title into one pill; a badge with no title keeps its circle.
          className: 'LrBadgeLabels-item' + (label ? ' LrBadgeLabels-item--labelled' : '') + (name ? ' item-' + name : ''),
          key: key,
        },
        children
      );
    });
}

function postCountItem(user) {
  const m = window.m;
  const count = typeof user.commentCount === 'function' ? user.commentCount() : null;

  // Undefined on 1.x whenever the post count is switched off, since the
  // attribute is only serialized while the setting is on.
  if (typeof count !== 'number' || isNaN(count)) return null;

  return m(
    'li',
    {
      className: 'LrBadgeLabels-item LrBadgeLabels-countItem',
      key: 'lrBadgeLabels-postCount',
    },
    m('span', { className: 'LrBadgeLabels-count' }, [
      m('i', { className: 'icon fas fa-comment LrBadgeLabels-countIcon', 'aria-hidden': 'true' }),
      m('span', { className: 'LrBadgeLabels-countText' }, window.app.translator.trans(EXT_ID + '.forum.post_count', { count: count })),
    ])
  );
}

// ---------------------------------------------------------------- extendables

// Resolve a core component on either major: 2.x exposes lazy-chunk modules
// through flarum.reg.onLoad (which fires when the chunk loads, or immediately
// if it is already in); 1.x ships everything eagerly in flarum.core.compat.
function onCoreModule(path, callback) {
  const unwrap = (mod) => (mod && mod.default ? mod.default : mod);

  try {
    const reg = window.flarum && window.flarum.reg;
    if (reg && typeof reg.onLoad === 'function') {
      reg.onLoad('core', path, (mod) => callback(unwrap(mod)));
      return;
    }
  } catch (e) {}

  try {
    const compat = window.flarum && window.flarum.core && window.flarum.core.compat;
    if (compat && compat[path]) callback(unwrap(compat[path]));
  } catch (e) {}
}

// Minimal `extend()` so we don't depend on flarum/common/extend resolving the
// same way on both majors.
function extendMethod(proto, method, callback) {
  const original = proto[method];

  proto[method] = function (...args) {
    const value = original.apply(this, args);
    callback.call(this, value, ...args);
    return value;
  };
}

window.app.initializers.add(EXT_ID, () => {
  const m = window.m;

  applyRootClasses();

  onCoreModule('forum/components/PostUser', (PostUser) => {
    if (!PostUser || !PostUser.prototype) return;

    // Never wrap twice: a re-fired module callback would otherwise rebuild the
    // list on top of an already rebuilt one.
    if (PostUser.prototype._lrBadgeLabelsPatched) return;
    PostUser.prototype._lrBadgeLabelsPatched = true;

    extendMethod(PostUser.prototype, 'userViewItems', function (items, user) {
      const s = settings();

      if (!items || typeof items.has !== 'function' || !items.has('postUser-badges')) return;
      if (!user || typeof user.badges !== 'function') return;

      try {
        const children = badgeItems(user, s.labels);

        if (s.postCount) {
          const count = postCountItem(user);
          if (count) children.push(count);
        }

        // badges--packed (the overlapping-icon strip) is kept so phones still
        // get Flarum's compact header when the admin hasn't opted into labels
        // there; the stylesheet unpacks the list everywhere it does apply.
        const className = 'PostUser-badges badges badges--packed LrBadgeLabels-list';

        items.setContent('postUser-badges', m('ul', { className: className }, children));
      } catch (e) {
        // Leave core's own badge list in place rather than blanking the author
        // area if a badge from another extension surprises us.
        console.error('[' + EXT_ID + ']', e);
      }
    });
  });
});
