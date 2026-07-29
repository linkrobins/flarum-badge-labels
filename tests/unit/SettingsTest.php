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
    public function known_title_modes_pass_through(): void
    {
        $this->assertEquals('always', Settings::titles('always'));
        $this->assertEquals('expand', Settings::titles('expand'));
        $this->assertEquals('off', Settings::titles('off'));
        $this->assertEquals('expand', Settings::titles(' Expand '));
    }

    #[Test]
    public function a_title_mode_saved_as_the_old_on_off_switch_still_reads(): void
    {
        // Before the expand-on-hover mode this setting was a checkbox, so a
        // forum that saved one has to keep the behaviour it chose.
        $this->assertEquals('always', Settings::titles('1'));
        $this->assertEquals('always', Settings::titles(true));
        $this->assertEquals('off', Settings::titles('0'));
        $this->assertEquals('off', Settings::titles(''));
        $this->assertEquals('off', Settings::titles(false));
    }

    #[Test]
    public function an_unknown_title_mode_falls_back_to_the_default(): void
    {
        $this->assertEquals(Settings::DEFAULT_TITLES, Settings::titles('sometimes'));
        $this->assertEquals(Settings::DEFAULT_TITLES, Settings::titles(null));
        $this->assertEquals(Settings::DEFAULT_TITLES, Settings::titles(['expand']));
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
