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
      setting: PREFIX + 'labels',
      label: trans('titles_label'),
      help: trans('titles_help'),
      type: 'select',
      options: {
        always: trans('titles_always'),
        expand: trans('titles_expand'),
        off: trans('titles_off'),
      },
      default: 'always',
    },
    {
      setting: PREFIX + 'post_count',
      label: trans('post_count_label'),
      help: trans('post_count_help'),
      type: 'boolean',
      default: true,
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
