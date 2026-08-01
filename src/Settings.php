<?php

namespace LinkRobins\BadgeLabels;

use Flarum\Settings\SettingsRepositoryInterface;

/**
 * Reading and normalizing this extension's settings.
 *
 * Every value here ends up in a class name or a CSS custom property on the
 * frontend, so each one is clamped to a known-good shape on the way out rather
 * than trusted as it was typed. The same normalizers back the settings that go
 * into the forum payload and the ones the tests exercise.
 */
final class Settings
{
    public const PREFIX = 'linkrobins-badge-labels.';

    public const LAYOUT = self::PREFIX.'layout';
    public const LABELS = self::PREFIX.'labels';
    public const POST_COUNT = self::PREFIX.'post_count';
    public const POST_COUNT_PLACEMENT = self::PREFIX.'post_count_placement';
    public const PHONE = self::PREFIX.'phone';
    public const COLUMN_WIDTH = self::PREFIX.'column_width';
    public const AVATAR_GAP = self::PREFIX.'avatar_gap';
    public const DISCUSSION_BADGES = self::PREFIX.'discussion_badges';

    /**
     * Where the badges sit: in a column below the avatar, or in the header row
     * beside the username.
     *
     * There is deliberately no "leave them where Flarum puts them" option:
     * Flarum overlaps the badge icons with the top of the avatar, which has no
     * room for a title beside them, so leaving them there and labelling them
     * would just print the titles over the avatar.
     */
    public const LAYOUTS = ['below', 'beside'];

    public const DEFAULT_LAYOUT = 'below';

    public const DEFAULT_COLUMN_WIDTH = 150;

    /**
     * Never narrower than the column Flarum ships (the 64px avatar plus its
     * gutter), and never so wide that the post body is squeezed off-screen.
     */
    public const MIN_COLUMN_WIDTH = 85;

    public const MAX_COLUMN_WIDTH = 400;

    /**
     * Which badges carry their title: all of them, only the first (a user's
     * primary badge, which is the one most forums want spelled out), or none.
     */
    public const LABEL_MODES = ['all', 'first', 'none'];

    public const DEFAULT_LABELS = 'all';

    /**
     * Where the post count sits: with the badges, wherever those are, or in a
     * placement of its own.
     */
    public const POST_COUNT_PLACEMENTS = ['badges', 'below', 'beside'];

    public const DEFAULT_POST_COUNT_PLACEMENT = 'badges';

    /**
     * How far under the avatar the badges below it start. Flarum's avatar is
     * 64px there, so this is the gap between the two.
     */
    public const DEFAULT_AVATAR_GAP = 4;

    public const MIN_AVATAR_GAP = 0;

    public const MAX_AVATAR_GAP = 60;

    /**
     * @param mixed $value
     */
    public static function layout($value): string
    {
        $layout = is_string($value) ? strtolower(trim($value)) : '';

        return in_array($layout, self::LAYOUTS, true) ? $layout : self::DEFAULT_LAYOUT;
    }

    /**
     * @param mixed $value
     */
    public static function labels($value): string
    {
        if (is_bool($value)) {
            return $value ? 'all' : 'none';
        }

        $mode = is_scalar($value) ? strtolower(trim((string) $value)) : '';

        if (in_array($mode, self::LABEL_MODES, true)) {
            return $mode;
        }

        // Up to v1.0.1 this was a checkbox, so forums that upgrade still have a
        // '1' or a '0' in the settings table for it.
        if ($mode === '1' || $mode === 'true') {
            return 'all';
        }

        if ($mode === '0' || $mode === 'false') {
            return 'none';
        }

        return self::DEFAULT_LABELS;
    }

    /**
     * @param mixed $value
     */
    public static function postCountPlacement($value): string
    {
        $placement = is_string($value) ? strtolower(trim($value)) : '';

        return in_array($placement, self::POST_COUNT_PLACEMENTS, true) ? $placement : self::DEFAULT_POST_COUNT_PLACEMENT;
    }

    /**
     * @param mixed $value
     */
    public static function avatarGap($value): int
    {
        $gap = is_numeric($value) ? (int) $value : self::DEFAULT_AVATAR_GAP;

        return max(self::MIN_AVATAR_GAP, min(self::MAX_AVATAR_GAP, $gap));
    }

    /**
     * @param mixed $value
     */
    public static function columnWidth($value): int
    {
        $width = is_numeric($value) ? (int) $value : self::DEFAULT_COLUMN_WIDTH;

        return max(self::MIN_COLUMN_WIDTH, min(self::MAX_COLUMN_WIDTH, $width));
    }

    /**
     * Settings come back from the repository as strings, so a checkbox is '1'
     * rather than true.
     *
     * @param mixed $value
     */
    public static function bool($value): bool
    {
        return $value === true || $value === 1 || $value === '1' || $value === 'true';
    }

    public static function showsPostCount(SettingsRepositoryInterface $settings): bool
    {
        return self::bool($settings->get(self::POST_COUNT, '1'));
    }
}
