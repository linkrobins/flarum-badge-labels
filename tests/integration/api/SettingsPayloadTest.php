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

    #[Test]
    public function the_defaults_reach_the_frontend(): void
    {
        $attributes = $this->forumAttributes();

        $this->assertEquals('below', $attributes['linkrobinsBadgeLabelsLayout']);
        $this->assertTrue($attributes['linkrobinsBadgeLabelsLabels']);
        $this->assertTrue($attributes['linkrobinsBadgeLabelsPostCount']);
        $this->assertFalse($attributes['linkrobinsBadgeLabelsPhone']);
        $this->assertEquals(Settings::DEFAULT_COLUMN_WIDTH, $attributes['linkrobinsBadgeLabelsColumnWidth']);
    }

    #[Test]
    public function saved_settings_reach_the_frontend(): void
    {
        $this->setting(Settings::LAYOUT, 'beside');
        $this->setting(Settings::LABELS, '0');
        $this->setting(Settings::POST_COUNT, '0');
        $this->setting(Settings::PHONE, '1');
        $this->setting(Settings::COLUMN_WIDTH, '220');

        $attributes = $this->forumAttributes();

        $this->assertEquals('beside', $attributes['linkrobinsBadgeLabelsLayout']);
        $this->assertFalse($attributes['linkrobinsBadgeLabelsLabels']);
        $this->assertFalse($attributes['linkrobinsBadgeLabelsPostCount']);
        $this->assertTrue($attributes['linkrobinsBadgeLabelsPhone']);
        $this->assertEquals(220, $attributes['linkrobinsBadgeLabelsColumnWidth']);
    }

    #[Test]
    public function a_hand_edited_settings_row_is_normalized_before_it_is_sent(): void
    {
        // These values land in a class name and a CSS custom property, so they
        // are normalized on the way out rather than trusted as stored.
        $this->setting(Settings::LAYOUT, 'somewhere-else');
        $this->setting(Settings::COLUMN_WIDTH, '9999');

        $attributes = $this->forumAttributes();

        $this->assertEquals(Settings::DEFAULT_LAYOUT, $attributes['linkrobinsBadgeLabelsLayout']);
        $this->assertEquals(Settings::MAX_COLUMN_WIDTH, $attributes['linkrobinsBadgeLabelsColumnWidth']);
    }
}
