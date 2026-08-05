<?php

/*
 * This file is part of linkrobins/badge-labels.
 *
 * For detailed copyright and license information, please view the
 * LICENSE file that was distributed with this source code.
 */

namespace LinkRobins\BadgeLabels\Tests\integration\api;

use Flarum\Testing\integration\RetrievesAuthorizedUsers;
use Flarum\Testing\integration\TestCase;
use LinkRobins\BadgeLabels\Settings;
use PHPUnit\Framework\Attributes\Test;

class SettingsPayloadTest extends TestCase
{
    use RetrievesAuthorizedUsers;

    public function setUp(): void
    {
        parent::setUp();

        $this->extension('linkrobins-badge-labels');
    }

    /**
     * @return array<string, mixed>
     */
    private function forumAttributes(): array
    {
        $response = $this->send($this->request('GET', '/api/'));

        $this->assertEquals(200, $response->getStatusCode());

        return json_decode($response->getBody()->getContents(), true)['data']['attributes'];
    }

    /** @test */
    #[Test]
    public function the_defaults_reach_the_frontend(): void
    {
        $attributes = $this->forumAttributes();

        $this->assertEquals('below', $attributes['linkrobinsBadgeLabelsLayout']);
        $this->assertEquals(Settings::DEFAULT_HEADER_POSITION, $attributes['linkrobinsBadgeLabelsHeaderPosition']);
        $this->assertEquals(Settings::DEFAULT_ARRANGEMENT, $attributes['linkrobinsBadgeLabelsArrangement']);
        $this->assertEquals(Settings::DEFAULT_LABELS, $attributes['linkrobinsBadgeLabelsLabels']);
        $this->assertTrue($attributes['linkrobinsBadgeLabelsPostCount']);
        $this->assertEquals(Settings::DEFAULT_POST_COUNT_PLACEMENT, $attributes['linkrobinsBadgeLabelsPostCountPlacement']);
        $this->assertFalse($attributes['linkrobinsBadgeLabelsDiscussionBadges']);
        $this->assertFalse($attributes['linkrobinsBadgeLabelsPhone']);
        $this->assertEquals(Settings::DEFAULT_COLUMN_WIDTH, $attributes['linkrobinsBadgeLabelsColumnWidth']);
        $this->assertEquals(Settings::DEFAULT_AVATAR_GAP, $attributes['linkrobinsBadgeLabelsAvatarGap']);
    }

    /** @test */
    #[Test]
    public function saved_settings_reach_the_frontend(): void
    {
        $this->setting(Settings::LAYOUT, 'beside');
        $this->setting(Settings::HEADER_POSITION, 'before');
        $this->setting(Settings::ARRANGEMENT, 'grid');
        $this->setting(Settings::LABELS, 'first');
        $this->setting(Settings::POST_COUNT, '0');
        $this->setting(Settings::POST_COUNT_PLACEMENT, 'below');
        $this->setting(Settings::DISCUSSION_BADGES, '1');
        $this->setting(Settings::PHONE, '1');
        $this->setting(Settings::COLUMN_WIDTH, '220');
        $this->setting(Settings::AVATAR_GAP, '18');

        $attributes = $this->forumAttributes();

        $this->assertEquals('beside', $attributes['linkrobinsBadgeLabelsLayout']);
        $this->assertEquals('before', $attributes['linkrobinsBadgeLabelsHeaderPosition']);
        $this->assertEquals('grid', $attributes['linkrobinsBadgeLabelsArrangement']);
        $this->assertEquals('first', $attributes['linkrobinsBadgeLabelsLabels']);
        $this->assertFalse($attributes['linkrobinsBadgeLabelsPostCount']);
        $this->assertEquals('below', $attributes['linkrobinsBadgeLabelsPostCountPlacement']);
        $this->assertTrue($attributes['linkrobinsBadgeLabelsDiscussionBadges']);
        $this->assertTrue($attributes['linkrobinsBadgeLabelsPhone']);
        $this->assertEquals(220, $attributes['linkrobinsBadgeLabelsColumnWidth']);
        $this->assertEquals(18, $attributes['linkrobinsBadgeLabelsAvatarGap']);
    }

    /**
     * Up to v1.0.1 the labels setting was a checkbox, and its value is still in
     * the settings table until the admin saves the page again. The two states
     * are separate tests because settings are staged into the app as it boots,
     * which the first request of a test does.
     *
     * @test
     */
    #[Test]
    public function a_ticked_label_checkbox_from_before_reads_as_every_badge(): void
    {
        $this->setting(Settings::LABELS, '1');

        $this->assertEquals('all', $this->forumAttributes()['linkrobinsBadgeLabelsLabels']);
    }

    /** @test */
    #[Test]
    public function an_unticked_label_checkbox_from_before_reads_as_no_titles(): void
    {
        $this->setting(Settings::LABELS, '0');

        $this->assertEquals('none', $this->forumAttributes()['linkrobinsBadgeLabelsLabels']);
    }

    /** @test */
    #[Test]
    public function a_hand_edited_settings_row_is_normalized_before_it_is_sent(): void
    {
        // These values land in a class name and a CSS custom property, so they
        // are normalized on the way out rather than trusted as stored.
        $this->setting(Settings::LAYOUT, 'somewhere-else');
        $this->setting(Settings::HEADER_POSITION, 'above');
        $this->setting(Settings::LABELS, 'sometimes');
        $this->setting(Settings::POST_COUNT_PLACEMENT, 'sidebar');
        $this->setting(Settings::COLUMN_WIDTH, '9999');
        $this->setting(Settings::AVATAR_GAP, '-40');

        $attributes = $this->forumAttributes();

        $this->assertEquals(Settings::DEFAULT_LAYOUT, $attributes['linkrobinsBadgeLabelsLayout']);
        $this->assertEquals(Settings::DEFAULT_HEADER_POSITION, $attributes['linkrobinsBadgeLabelsHeaderPosition']);
        $this->assertEquals(Settings::DEFAULT_LABELS, $attributes['linkrobinsBadgeLabelsLabels']);
        $this->assertEquals(Settings::DEFAULT_POST_COUNT_PLACEMENT, $attributes['linkrobinsBadgeLabelsPostCountPlacement']);
        $this->assertEquals(Settings::MAX_COLUMN_WIDTH, $attributes['linkrobinsBadgeLabelsColumnWidth']);
        $this->assertEquals(Settings::MIN_AVATAR_GAP, $attributes['linkrobinsBadgeLabelsAvatarGap']);
    }
}
