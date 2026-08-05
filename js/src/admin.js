// Admin settings for Badge Labels.
//
// Every setting is a plain typed entry (boolean / select / number), which both
// majors' auto-built settings pages render without any custom components.
//
import app from 'flarum/admin/app';

const EXT_ID = 'linkrobins-badge-labels';
const PREFIX = EXT_ID + '.';

const trans = (key) => app.translator.trans(EXT_ID + '.admin.settings.' + key);

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
      setting: PREFIX + 'header_position',
      label: trans('header_position_label'),
      help: trans('header_position_help'),
      type: 'select',
      options: {
        after: trans('header_position_after'),
        before: trans('header_position_before'),
      },
      default: 'after',
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

app.initializers.add(EXT_ID, () => {
  const registry = app.registry.for(EXT_ID);

  // Resolved here rather than at module load, so the labels come back in the
  // admin's own language instead of frozen to the English fallback.
  settings().forEach((setting, index) => registry.registerSetting(setting, 100 - index));
});
