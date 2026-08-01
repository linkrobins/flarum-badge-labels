<?php

use Flarum\Extend;
use LinkRobins\BadgeLabels\Settings;

// Nothing here touches serialization. The post count the forum bundle renders
// is core's own `commentCount`, which both majors already send with a post's
// author (1.x serializes them with the full UserSerializer, 2.x with the one
// UserResource), so this extension only has to decide whether to draw it.
return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js'),

    new Extend\Locales(__DIR__.'/locale'),

    (new Extend\Settings())
        ->default(Settings::LAYOUT, Settings::DEFAULT_LAYOUT)
        ->serializeToForum('linkrobinsBadgeLabelsLayout', Settings::LAYOUT, fn ($value) => Settings::layout($value))

        ->default(Settings::ARRANGEMENT, Settings::DEFAULT_ARRANGEMENT)
        ->serializeToForum('linkrobinsBadgeLabelsArrangement', Settings::ARRANGEMENT, fn ($value) => Settings::arrangement($value))

        ->default(Settings::LABELS, Settings::DEFAULT_LABELS)
        ->serializeToForum('linkrobinsBadgeLabelsLabels', Settings::LABELS, fn ($value) => Settings::labels($value))

        ->default(Settings::POST_COUNT, '1')
        ->serializeToForum('linkrobinsBadgeLabelsPostCount', Settings::POST_COUNT, fn ($value) => Settings::bool($value))

        ->default(Settings::POST_COUNT_PLACEMENT, Settings::DEFAULT_POST_COUNT_PLACEMENT)
        ->serializeToForum('linkrobinsBadgeLabelsPostCountPlacement', Settings::POST_COUNT_PLACEMENT, fn ($value) => Settings::postCountPlacement($value))

        ->default(Settings::DISCUSSION_BADGES, '0')
        ->serializeToForum('linkrobinsBadgeLabelsDiscussionBadges', Settings::DISCUSSION_BADGES, fn ($value) => Settings::bool($value))

        ->default(Settings::PHONE, '0')
        ->serializeToForum('linkrobinsBadgeLabelsPhone', Settings::PHONE, fn ($value) => Settings::bool($value))

        ->default(Settings::COLUMN_WIDTH, (string) Settings::DEFAULT_COLUMN_WIDTH)
        ->serializeToForum('linkrobinsBadgeLabelsColumnWidth', Settings::COLUMN_WIDTH, fn ($value) => Settings::columnWidth($value))

        ->default(Settings::AVATAR_GAP, (string) Settings::DEFAULT_AVATAR_GAP)
        ->serializeToForum('linkrobinsBadgeLabelsAvatarGap', Settings::AVATAR_GAP, fn ($value) => Settings::avatarGap($value)),
];
