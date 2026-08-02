// Admin settings for Badge Labels.
//
// Every setting is a plain typed entry (boolean / select / number), which both
// majors' auto-built settings pages render without any custom components.
//
// Like the forum bundle, this imports nothing from flarum/* and feature-detects
// the globals instead, so one artifact runs on Flarum 1.8 and 2.x. The only
// difference between the majors here is the registry object (app.registry in
// 2.x, app.extensionData in 1.x).

const EXT_ID = 'linkrobins-badge-labels';
const PREFIX = EXT_ID + '.';

const trans = (key) => window.app.translator.trans(EXT_ID + '.admin.settings.' + key);

function settings() {
  return [
    {
      setting: PREFIX + 'layout',
      label: trans('layout_label'),
      help: trans('layout_help'),
      type: 'select',
      options: {
        below: trans('layout_below'),
        beside: trans('layout_beside'),
      },
      default: 'below',
    },
    {
      setting: PREFIX + 'arrangement',
      label: trans('arrangement_label'),
      help: trans('arrangement_help'),
      type: 'select',
      options: {
        rows: trans('arrangement_rows'),
        centered: trans('arrangement_centered'),
        grid: trans('arrangement_grid'),
      },
      default: 'rows',
    },
    {
      setting: PREFIX + 'labels',
      label: trans('labels_label'),
      help: trans('labels_help'),
      type: 'select',
      options: {
        all: trans('labels_all'),
        first: trans('labels_first'),
        none: trans('labels_none'),
      },
      default: 'all',
    },
    {
      setting: PREFIX + 'post_count',
      label: trans('post_count_label'),
      help: trans('post_count_help'),
      type: 'boolean',
      default: true,
    },
    {
      setting: PREFIX + 'post_count_placement',
      label: trans('post_count_placement_label'),
      help: trans('post_count_placement_help'),
      type: 'select',
      options: {
        badges: trans('post_count_placement_badges'),
        below: trans('post_count_placement_below'),
        beside: trans('post_count_placement_beside'),
      },
      default: 'badges',
    },
    {
      setting: PREFIX + 'discussion_badges',
      label: trans('discussion_badges_label'),
      help: trans('discussion_badges_help'),
      type: 'boolean',
      default: false,
    },
    {
      setting: PREFIX + 'column_width',
      label: trans('column_width_label'),
      help: trans('column_width_help'),
      type: 'number',
      min: 85,
      max: 400,
      default: 150,
    },
    {
      setting: PREFIX + 'avatar_gap',
      label: trans('avatar_gap_label'),
      help: trans('avatar_gap_help'),
      type: 'number',
      min: 0,
      max: 60,
      default: 4,
    },
    {
      setting: PREFIX + 'phone',
      label: trans('phone_label'),
      help: trans('phone_help'),
      type: 'boolean',
      default: false,
    },
  ];
}

window.app.initializers.add(EXT_ID, () => {
  const app = window.app;

  let registry = null;

  try {
    if (app.registry && typeof app.registry.for === 'function') {
      registry = app.registry.for(EXT_ID); // Flarum 2.x
    } else if (app.extensionData && typeof app.extensionData.for === 'function') {
      registry = app.extensionData.for(EXT_ID); // Flarum 1.x
    }
  } catch (e) {}

  if (!registry || typeof registry.registerSetting !== 'function') {
    console.warn('[' + EXT_ID + '] no settings registry available');
    return;
  }

  // Resolved here rather than at module load, so the labels come back in the
  // admin's own language instead of frozen to the English fallback.
  settings().forEach((setting, index) => registry.registerSetting(setting, 100 - index));
});
