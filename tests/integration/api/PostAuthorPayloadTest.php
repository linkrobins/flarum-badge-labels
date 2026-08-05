<?php

/*
 * This file is part of linkrobins/badge-labels.
 *
 * For detailed copyright and license information, please view the
 * LICENSE file that was distributed with this source code.
 */

namespace LinkRobins\BadgeLabels\Tests\integration\api;

use Carbon\Carbon;
use Flarum\Testing\integration\RetrievesAuthorizedUsers;
use Flarum\Testing\integration\TestCase;
use PHPUnit\Framework\Attributes\Test;

/**
 * The post count the forum bundle renders comes straight off the author that
 * ships with a post stream. It is core's own commentCount field, with no help
 * from this extension, which is exactly why it is worth pinning: if a core
 * release stopped sending it, the post count would quietly disappear, and this
 * test is what says so.
 *
 * (Verified by hand on 1.8 as well, where PostSerializer::user() serializes
 * authors with the full UserSerializer and so also carries commentCount.
 * flarum/testing is 2.x only, so it can't be asserted here.)
 */
class PostAuthorPayloadTest extends TestCase
{
    use RetrievesAuthorizedUsers;

    public function setUp(): void
    {
        parent::setUp();

        $this->extension('linkrobins-badge-labels');

        $this->prepareDatabase([
            'users' => [
                array_merge($this->normalUser(), ['comment_count' => 7]), // id 2
            ],
            'discussions' => [
                ['id' => 1, 'title' => 'First', 'created_at' => Carbon::now()->toDateTimeString(), 'user_id' => 2, 'first_post_id' => 1, 'comment_count' => 1, 'slug' => 'first', 'is_private' => 0],
            ],
            'posts' => [
                ['id' => 1, 'discussion_id' => 1, 'number' => 1, 'created_at' => Carbon::now()->toDateTimeString(), 'user_id' => 2, 'type' => 'comment', 'content' => '<t><p>one</p></t>', 'is_private' => 0],
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function includedAuthor(): array
    {
        $response = $this->send($this->request('GET', '/api/discussions/1'));

        $this->assertEquals(200, $response->getStatusCode());

        $body = json_decode($response->getBody()->getContents(), true);

        foreach ($body['included'] ?? [] as $resource) {
            if ($resource['type'] === 'users' && $resource['id'] === '2') {
                return $resource;
            }
        }

        $this->fail('The post author was not included with the discussion.');
    }

    /** @test */
    #[Test]
    public function a_post_author_carries_their_post_count(): void
    {
        $author = $this->includedAuthor();

        $this->assertArrayHasKey('commentCount', $author['attributes']);
        $this->assertEquals(7, $author['attributes']['commentCount']);
    }

    /** @test */
    #[Test]
    public function a_post_author_carries_the_groups_their_badges_come_from(): void
    {
        // Badges are built from the author's groups on the frontend, so an
        // author sent without them would have nothing to label.
        $author = $this->includedAuthor();

        $this->assertArrayHasKey('groups', $author['relationships']);
    }
}
