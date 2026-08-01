// Badge Labels: shows each badge's full title next to its icon, moves the post
// author's badge list below or beside the avatar, can show the author's post
// count in either of those places, and can give a discussion's own badges the
// same treatment.
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
const LABEL_MODES = ['all', 'first', 'none'];
const DEFAULT_LABELS = 'all';
const POST_COUNT_PLACEMENTS = ['badges', 'below', 'beside'];
const DEFAULT_POST_COUNT_PLACEMENT = 'badges';
const DEFAULT_COLUMN_WIDTH = 150;
const MIN_COLUMN_WIDTH = 85;
const MAX_COLUMN_WIDTH = 400;
// Flarum's post avatar at tablet and up, which the badges below it clear.
const AVATAR_HEIGHT = 64;
const DEFAULT_AVATAR_GAP = 4;
const MIN_AVATAR_GAP = 0;
const MAX_AVATAR_GAP = 60;

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
  const gap = parseInt(forumAttribute(ATTR + 'AvatarGap', DEFAULT_AVATAR_GAP), 10);
  const placement = String(forumAttribute(ATTR + 'PostCountPlacement', DEFAULT_POST_COUNT_PLACEMENT));

  // Up to v1.0.1 the labels setting was a checkbox, and a forum that upgrades
  // still has a boolean in the payload until the admin saves the page again.
  const rawLabels = forumAttribute(ATTR + 'Labels', DEFAULT_LABELS);
  const labels = typeof rawLabels === 'string' ? rawLabels : truthy(rawLabels) ? 'all' : 'none';

  cached = {
    layout: LAYOUTS.indexOf(layout) >= 0 ? layout : DEFAULT_LAYOUT,
    labels: LABEL_MODES.indexOf(labels) >= 0 ? labels : DEFAULT_LABELS,
    postCount: truthy(forumAttribute(ATTR + 'PostCount', true)),
    postCountPlacement: POST_COUNT_PLACEMENTS.indexOf(placement) >= 0 ? placement : DEFAULT_POST_COUNT_PLACEMENT,
    discussionBadges: truthy(forumAttribute(ATTR + 'DiscussionBadges', false)),
    phone: truthy(forumAttribute(ATTR + 'Phone', false)),
    columnWidth: Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, isNaN(width) ? DEFAULT_COLUMN_WIDTH : width)),
    avatarGap: Math.max(MIN_AVATAR_GAP, Math.min(MAX_AVATAR_GAP, isNaN(gap) ? DEFAULT_AVATAR_GAP : gap)),
  };

  // The count either follows the badges or has a placement of its own.
  cached.countLayout = cached.postCountPlacement === 'badges' ? cached.layout : cached.postCountPlacement;

  return cached;
}

// What the author column has in it: the badges, the post count, or both. The
// column only exists (and only has to be widened) when something is in it.
function columnHasContent(s) {
  return s.layout === 'below' || (s.postCount && s.countLayout === 'below');
}

// And the same question for the post header line, where the phone copy of the
// column list also ends up.
function headerHasContent(s) {
  return s.layout === 'beside' || (s.postCount && s.countLayout === 'beside') || (s.phone && columnHasContent(s));
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

  if (s.labels !== 'none') classes.push('lrBadgeLabels--labels');
  if (s.postCount) classes.push('lrBadgeLabels--postCount');
  if (s.discussionBadges) classes.push('lrBadgeLabels--discussions');
  if (s.phone) classes.push('lrBadgeLabels--phone');

  classes.push(s.layout === 'beside' ? 'lrBadgeLabels--beside' : 'lrBadgeLabels--below');

  // The author column has to make room for whatever is in it, which is the
  // badges, the post count, or both. When it is empty (badges and count both
  // beside the username) it is left exactly as Flarum ships it.
  if (columnHasContent(s)) classes.push('lrBadgeLabels--column', 'lrBadgeLabels--wide');
  if (headerHasContent(s)) classes.push('lrBadgeLabels--header');

  // 1.x compiles the author column width in as a LESS variable; 2.x exposes it
  // as a custom property. The two need different overrides.
  classes.push(isTwoPointX() ? 'lrBadgeLabels--v2' : 'lrBadgeLabels--v1');

  classes.forEach((name) => root.classList.add(name));
  root.style.setProperty('--lrbl-column-width', s.columnWidth + 'px');
  // The gap the admin sets is the space between the avatar and the first badge,
  // measured from the top of the author column, which is where the avatar
  // starts.
  root.style.setProperty('--lrbl-avatar-offset', AVATAR_HEIGHT + s.avatarGap + 'px');
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

// Rebuild a list of badges, wrapping each one the way core's listItems() does
// (same item- class and key, so other extensions' styles keep matching) and
// adding the label beside it.
//
// `mode` is the labels setting: every badge, only the first (which is a user's
// primary badge, and the discussion's most important one), or none at all.
function badgeItems(badges, mode) {
  const m = window.m;

  return badges
    .filter((badge) => badge)
    .map((badge, index) => {
      const name = badge.itemName;
      const key = (badge.attrs && badge.attrs.key) || name || 'badge' + index;
      const label = mode === 'all' || (mode === 'first' && index === 0) ? labelFor(badge) : null;

      const children = [badge];

      if (label) {
        children.push(
          m(
            'span',
            {
              className: 'LrBadgeLabels-label' + contrastClass(label.color),
              title: label.title,
            },
            label.content
          )
        );
      }

      const attrs = {
        // The labelled marker is what lets the stylesheet stretch the badge
        // into one pill behind the icon and the title; a badge with no title
        // keeps its circle.
        className: 'LrBadgeLabels-item' + (label ? ' LrBadgeLabels-item--labelled' : '') + (name ? ' item-' + name : ''),
        // The pill's own colour, for the rare badge that draws no .Badge
        // element to take its colour from. A badge that names no colour (a
        // sticky or a locked one, say) paints itself through a class instead,
        // and that is exactly the case the stylesheet lets the badge cover.
        style: label && label.color ? { '--lrbl-accent': label.color } : undefined,
        key: key,
      };

      return m('li', attrs, children);
    });
}

// A user who has never been counted (or a serializer that withholds it) has no
// post count to draw, which is different from having written no posts.
function postCountFor(user) {
  const count = user && typeof user.commentCount === 'function' ? user.commentCount() : null;

  return typeof count === 'number' && !isNaN(count) ? count : null;
}

function postCountItem(user) {
  const m = window.m;
  const count = postCountFor(user);

  if (count === null) return null;

  // Built from the same two halves as a labelled badge, so it reads as one of
  // them instead of as another piece of post metadata sitting next to the
  // timestamp. It keeps the theme's neutral badge colour, though, so it can't
  // be mistaken for a group someone belongs to.
  return m(
    'li',
    {
      className: 'LrBadgeLabels-item LrBadgeLabels-item--labelled LrBadgeLabels-countItem',
      key: 'lrBadgeLabels-postCount',
    },
    [
      m('span', { className: 'Badge LrBadgeLabels-countBadge' }, m('i', { className: 'icon fas fa-comment Badge-icon', 'aria-hidden': 'true' })),
      m(
        'span',
        { className: 'LrBadgeLabels-label LrBadgeLabels-countLabel' },
        window.app.translator.trans(EXT_ID + '.forum.post_count', { count: count })
      ),
    ]
  );
}

function userBadges(user) {
  if (!user || typeof user.badges !== 'function') return [];

  const list = user.badges();

  return (list && typeof list.toArray === 'function' ? list.toArray() : []).filter((badge) => badge);
}

// What goes in a given placement: the badges if that is where they were sent,
// and the post count if that is where it was sent. Either can be empty, which
// is what lets the count sit under the avatar while the badges stay beside the
// username.
function itemsFor(user, where) {
  const s = settings();
  const children = s.layout === where ? badgeItems(userBadges(user), s.labels) : [];

  if (s.postCount && s.countLayout === where) {
    const count = postCountItem(user);
    if (count) children.push(count);
  }

  return children;
}

// How many rows the below-avatar stack comes to. The stylesheet takes the list
// out of flow there, so this is what tells it how much room to keep for it: in
// that placement every item is a row of its own, badge or post count.
function stackCount(user) {
  try {
    return itemsFor(user, 'below').length;
  } catch (e) {
    return 0;
  }
}

// One list of pills. `variant` says where it is being rendered, since a list in
// the post header has none of core's author-column rules to work around, and a
// phone copy of the column list is only for the phone breakpoint.
function badgeList(children, variant) {
  const m = window.m;

  if (!children || !children.length) return null;

  // badges--packed (the overlapping-icon strip) is kept so phones still get
  // Flarum's compact header when the admin hasn't opted into labels there; the
  // stylesheet unpacks the list everywhere it does apply.
  let className = 'PostUser-badges badges badges--packed LrBadgeLabels-list';

  if (variant === 'header' || variant === 'phone') className += ' LrBadgeLabels-list--header';
  if (variant === 'phone') className += ' LrBadgeLabels-list--phone';

  return m('ul', { className: className }, children);
}

// ------------------------------------------------------- discussion badges

// Discussions carry badges too (sticky, locked, and whatever else a forum has
// added), and they already hand Flarum a translated name for them, so the same
// pills work there.
//
// The hero keeps core's own badge slot, which has a whole page width to sit in.
// A discussion row does not: core tucks its badges into a 48px strip over the
// avatar, absolutely positioned and nowrap, which is exactly the arrangement a
// title does not fit. So the row's pills are moved down to the line under the
// discussion title, which has the width for them and already carries the row's
// other labels, and the strip over the avatar is dropped so they aren't shown
// twice.
function discussionBadges(discussion) {
  if (!discussion || typeof discussion.badges !== 'function') return [];

  const list = discussion.badges();

  return (list && typeof list.toArray === 'function' ? list.toArray() : []).filter((badge) => badge);
}

function discussionBadgeList(discussion, variant) {
  const m = window.m;
  const children = badgeItems(discussionBadges(discussion), settings().labels);

  if (!children.length) return null;

  const className =
    variant === 'hero'
      ? 'DiscussionHero-badges badges LrBadgeLabels-list LrBadgeLabels-list--hero'
      : 'badges LrBadgeLabels-list LrBadgeLabels-list--row';

  return m('ul', { className: className }, children);
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

// Minimal `extend()` / `override()` so we don't depend on flarum/common/extend
// resolving the same way on both majors.
function extendMethod(proto, method, callback) {
  const original = proto[method];

  proto[method] = function (...args) {
    const value = original.apply(this, args);
    callback.call(this, value, ...args);
    return value;
  };
}

function overrideMethod(proto, method, callback) {
  const original = proto[method];

  proto[method] = function (...args) {
    return callback.call(this, original.bind(this), ...args);
  };
}

// Never patch twice: a re-fired module callback would otherwise rebuild a list
// on top of an already rebuilt one.
function patchOnce(component, flag, patch) {
  if (!component || !component.prototype) return;
  if (component.prototype[flag]) return;
  component.prototype[flag] = true;

  patch(component.prototype);
}

window.app.initializers.add(EXT_ID, () => {
  applyRootClasses();

  onCoreModule('forum/components/PostUser', (PostUser) => {
    patchOnce(PostUser, '_lrBadgeLabelsPatched', (proto) => {
      extendMethod(proto, 'userViewItems', function (items, user, post) {
        if (!items || typeof items.has !== 'function' || !items.has('postUser-badges')) return;
        if (!user || typeof user.badges !== 'function') return;

        try {
          // Whatever the author column is holding: the badges, the post count,
          // or both. When it is holding neither (they are all on the header
          // line) core's own list goes with them, so that the timestamp keeps
          // the username's company rather than being pushed below the badges.
          const list = badgeList(itemsFor(user, 'below'), 'column');

          if (list) {
            items.setContent('postUser-badges', list);
          } else {
            items.remove('postUser-badges');
          }
        } catch (e) {
          // Leave core's own badge list in place rather than blanking the author
          // area if a badge from another extension surprises us.
          console.error('[' + EXT_ID + ']', e);
        }
      });
    });
  });

  onCoreModule('forum/components/CommentPost', (CommentPost) => {
    patchOnce(CommentPost, '_lrBadgeLabelsPatched', (proto) => patchCommentPost(proto));
  });

  const s = settings();

  // Nothing to label on a discussion when titles are turned off everywhere.
  if (s.discussionBadges && s.labels !== 'none') {
    onCoreModule('forum/components/DiscussionListItem', (DiscussionListItem) => {
      patchOnce(DiscussionListItem, '_lrBadgeLabelsPatched', (proto) => {
        // The pills go on the line under the title, where there is room for
        // them, so core's strip over the avatar would only repeat them. It is
        // emptied rather than dropped: this list's content goes through an
        // ItemList, which turns anything that is not an object into one, and an
        // empty string or a null would reach Mithril as an object with no tag
        // and take the whole discussion list down with it. An empty list draws
        // nothing on either major.
        overrideMethod(proto, 'badgesView', function (original) {
          try {
            if (!discussionBadges(this.attrs && this.attrs.discussion).length) return original();

            return window.m('ul', { className: 'DiscussionListItem-badges badges' });
          } catch (e) {
            console.error('[' + EXT_ID + ']', e);
            return original();
          }
        });

        extendMethod(proto, 'infoItems', function (items) {
          if (!items || typeof items.add !== 'function') return;

          try {
            const list = discussionBadgeList(this.attrs && this.attrs.discussion, 'row');

            // First on the line, ahead of the tags and the last-post
            // information, since that is the order they read in.
            if (list) items.add('linkrobinsBadgeLabels', list, 100);
          } catch (e) {
            console.error('[' + EXT_ID + ']', e);
          }
        });
      });
    });

    onCoreModule('forum/components/DiscussionHero', (DiscussionHero) => {
      patchOnce(DiscussionHero, '_lrBadgeLabelsPatched', (proto) => {
        extendMethod(proto, 'items', function (items) {
          if (!items || typeof items.has !== 'function' || !items.has('badges')) return;

          try {
            const list = discussionBadgeList(this.attrs && this.attrs.discussion, 'hero');

            if (list) items.setContent('badges', list);
          } catch (e) {
            console.error('[' + EXT_ID + ']', e);
          }
        });
      });
    });
  }
});

function patchCommentPost(proto) {
  // Below the avatar, the stylesheet lifts the badge list out of the document
  // flow (a float that tall dragged the post's height with it and knocked the
  // body out of line with the avatar). Out of flow, nothing reserves room for
  // the stack any more, and CSS cannot count badges to work out how much room
  // that is, so the count is published on the post element for it to read.
  extendMethod(proto, 'elementAttrs', function (attrs) {
    if (!attrs || typeof attrs !== 'object') return;

    try {
      const post = this.attrs && this.attrs.post;
      const user = post && typeof post.user === 'function' ? post.user() : null;
      const count = stackCount(user);

      if (!count) return;

      // Another extension may already have styled the post element, as either
      // a string or an object, so add to whichever of the two it left behind.
      if (typeof attrs.style === 'string') {
        attrs.style = attrs.style.replace(/;\s*$/, '') + '; --lrbl-stack-count: ' + count;
      } else if (attrs.style && typeof attrs.style === 'object') {
        attrs.style['--lrbl-stack-count'] = String(count);
      } else {
        attrs.style = '--lrbl-stack-count: ' + count;
      }
    } catch (e) {
      console.error('[' + EXT_ID + ']', e);
    }
  });

  // Anything the admin has put on the header line renders here: the badges, the
  // post count, or both.
  //
  // The author column's own list is copied here as well, but only when the
  // admin has asked for labels on phones, because that is the one case where
  // the author column does not exist: core collapses it, so a list left in
  // there sits between the username and the timestamp and pushes the timestamp
  // onto a line of its own. In the header it lands after the timestamp instead,
  // the way it does on a desktop, and the stylesheet shows whichever copy
  // belongs to the width. The copy is not rendered at all unless it can be
  // needed, so default settings produce exactly the markup they did before.
  extendMethod(proto, 'headerItems', function (items) {
    const s = settings();
    if (!items || typeof items.add !== 'function') return;

    try {
      const post = this.attrs && this.attrs.post;
      const user = post && typeof post.user === 'function' ? post.user() : null;
      if (!user || typeof user.badges !== 'function') return;

      // Added last, so they follow the timestamp (and anything else another
      // extension puts on the header line) instead of interrupting it.
      const header = badgeList(itemsFor(user, 'beside'), 'header');
      if (header) items.add('linkrobinsBadgeLabels', header, -10);

      if (s.phone) {
        const phone = badgeList(itemsFor(user, 'below'), 'phone');
        // Whichever copy holds the badges goes first, so a post count that has
        // been sent to the other placement still reads as following them.
        if (phone) items.add('linkrobinsBadgeLabelsPhone', phone, s.layout === 'below' ? -9 : -11);
      }
    } catch (e) {
      console.error('[' + EXT_ID + ']', e);
    }
  });
}
