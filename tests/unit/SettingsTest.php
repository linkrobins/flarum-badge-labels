<?php

/*
 * This file is part of linkrobins/badge-labels.
 *
 * For detailed copyright and license information, please view the
 * LICENSE file that was distributed with this source code.
 */

namespace LinkRobins\BadgeLabels\Tests\unit;

use Flarum\Testing\unit\TestCase;
use LinkRobins\BadgeLabels\Settings;
use PHPUnit\Framework\Attributes\Test;

class SettingsTest extends TestCase
{
    #[Test]
    public function known_layouts_pass_through(): void
    {
        $this->assertEquals('below', Settings::layout('below'));
        $this->assertEquals('beside', Settings::layout('beside'));
    }

    #[Test]
    public function an_unknown_layout_falls_back_to_the_default(): void
    {
        // A layout name reaches the frontend as a class on the root element,
        // so anything unrecognised has to become a known value rather than be
        // passed along.
        $this->assertEquals('below', Settings::layout('sidebar'));
        $this->assertEquals('below', Settings::layout(''));
        $this->assertEquals('below', Settings::layout(null));
        $this->assertEquals('below', Settings::layout(42));
        $this->assertEquals('below', Settings::layout(['below']));
    }

    #[Test]
    public function layouts_are_read_case_insensitively_and_trimmed(): void
    {
        $this->assertEquals('beside', Settings::layout(' Beside '));
    }

    #[Test]
    public function the_column_width_is_clamped_to_a_usable_range(): void
    {
        // Narrower than the column Flarum ships would clip the avatar; wider
        // than this would squeeze the post body off the page.
        $this->assertEquals(Settings::MIN_COLUMN_WIDTH, Settings::columnWidth(10));
        $this->assertEquals(Settings::MIN_COLUMN_WIDTH, Settings::columnWidth(-500));
        $this->assertEquals(Settings::MAX_COLUMN_WIDTH, Settings::columnWidth(10000));
        $this->assertEquals(200, Settings::columnWidth(200));
        $this->assertEquals(200, Settings::columnWidth('200'));
    }

    #[Test]
    public function a_non_numeric_column_width_falls_back_to_the_default(): void
    {
        $this->assertEquals(Settings::DEFAULT_COLUMN_WIDTH, Settings::columnWidth('wide'));
        $this->assertEquals(Settings::DEFAULT_COLUMN_WIDTH, Settings::columnWidth(null));
        $this->assertEquals(Settings::DEFAULT_COLUMN_WIDTH, Settings::columnWidth([]));
    }

    #[Test]
    public function known_label_modes_pass_through(): void
    {
        $this->assertEquals('all', Settings::labels('all'));
        $this->assertEquals('first', Settings::labels('first'));
        $this->assertEquals('none', Settings::labels('none'));
        $this->assertEquals('first', Settings::labels(' First '));
    }

    #[Test]
    public function the_label_mode_reads_the_checkbox_it_used_to_be(): void
    {
        // Up to v1.0.1 this setting was a checkbox, so a forum that upgrades
        // has a '1' or a '0' in the settings table where a mode is now.
        $this->assertEquals('all', Settings::labels('1'));
        $this->assertEquals('all', Settings::labels(true));
        $this->assertEquals('none', Settings::labels('0'));
        $this->assertEquals('none', Settings::labels(false));
    }

    #[Test]
    public function an_unknown_label_mode_falls_back_to_the_default(): void
    {
        $this->assertEquals(Settings::DEFAULT_LABELS, Settings::labels('sometimes'));
        $this->assertEquals(Settings::DEFAULT_LABELS, Settings::labels(''));
        $this->assertEquals(Settings::DEFAULT_LABELS, Settings::labels(null));
        $this->assertEquals(Settings::DEFAULT_LABELS, Settings::labels(['all']));
    }

    #[Test]
    public function known_post_count_placements_pass_through(): void
    {
        $this->assertEquals('badges', Settings::postCountPlacement('badges'));
        $this->assertEquals('below', Settings::postCountPlacement('below'));
        $this->assertEquals('beside', Settings::postCountPlacement(' Beside '));
    }

    #[Test]
    public function an_unknown_post_count_placement_falls_back_to_the_default(): void
    {
        $this->assertEquals(Settings::DEFAULT_POST_COUNT_PLACEMENT, Settings::postCountPlacement('sidebar'));
        $this->assertEquals(Settings::DEFAULT_POST_COUNT_PLACEMENT, Settings::postCountPlacement(null));
        $this->assertEquals(Settings::DEFAULT_POST_COUNT_PLACEMENT, Settings::postCountPlacement(7));
    }

    #[Test]
    public function the_avatar_gap_is_clamped_to_a_usable_range(): void
    {
        // A negative gap would put the first badge over the avatar, and a huge
        // one would leave the stack floating away from it.
        $this->assertEquals(Settings::MIN_AVATAR_GAP, Settings::avatarGap(-20));
        $this->assertEquals(Settings::MAX_AVATAR_GAP, Settings::avatarGap(9999));
        $this->assertEquals(0, Settings::avatarGap(0));
        $this->assertEquals(12, Settings::avatarGap('12'));
    }

    #[Test]
    public function a_non_numeric_avatar_gap_falls_back_to_the_default(): void
    {
        $this->assertEquals(Settings::DEFAULT_AVATAR_GAP, Settings::avatarGap('snug'));
        $this->assertEquals(Settings::DEFAULT_AVATAR_GAP, Settings::avatarGap(null));
        $this->assertEquals(Settings::DEFAULT_AVATAR_GAP, Settings::avatarGap([]));
    }

    #[Test]
    public function settings_stored_as_strings_read_as_booleans(): void
    {
        $this->assertTrue(Settings::bool('1'));
        $this->assertTrue(Settings::bool(1));
        $this->assertTrue(Settings::bool(true));
        $this->assertTrue(Settings::bool('true'));

        $this->assertFalse(Settings::bool('0'));
        $this->assertFalse(Settings::bool(0));
        $this->assertFalse(Settings::bool(''));
        $this->assertFalse(Settings::bool(null));
        $this->assertFalse(Settings::bool('yes'));
    }
}
