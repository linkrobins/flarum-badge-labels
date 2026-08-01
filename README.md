# Link Robins Badge Labels

![License](https://img.shields.io/badge/license-MIT-blue.svg) [![Latest Stable Version](https://img.shields.io/packagist/v/linkrobins/badge-labels.svg)](https://packagist.org/packages/linkrobins/badge-labels)

A [Flarum](https://flarum.org) extension that gives the badges in a post their full titles, moves them out from behind the avatar, and can show how many posts the author has written.

Out of the box Flarum shows badges as small icons tucked over the corner of the avatar, and their names only appear when you hover over one. This extension writes each badge's name next to its icon, so a member's groups are readable at a glance.

## What it does

- **Full badge titles.** Each badge becomes one pill: its icon at the rounded left end, its name at the right, in the badge's own colour with readable text on light and dark badges alike. Title every badge, or only the first one, which is a member's main badge.
- **Badge placement.** Put the badges in a column below the avatar (the author column widens to make room), or on the post header line beside the username, where they follow the timestamp.
- **Post count.** Optionally show how many posts the author has written, as a pill of its own in the theme's neutral badge colour, so it is never mistaken for a group. It can follow the badges or take the other placement, so the count sits under the avatar while the badges stay beside the username.
- **Discussion badges.** Optionally give the same pills to a discussion's own badges, such as sticky and locked. In the discussion list they move to the line under the title, where there is room for their names.
- **Phones.** Off by default there, since phones show a compact post header. One switch turns it on.

Every badge is covered, not just group badges: the title comes from whatever each badge already tells Flarum its name is, so badges added by other extensions get labelled too. Badges that have no name are left as plain icons.

## Settings

| Setting | Default | What it does |
| --- | --- | --- |
| Badge placement | Below the avatar | Below the avatar, or beside the username |
| Show full badge titles | On every badge | Every badge, the first badge only, or icons only |
| Show the author's post count | On | The number of posts the author has written |
| Post count placement | With the badges | With the badges, below the avatar, or beside the username |
| Label discussion badges too | Off | The same pills for sticky, locked, and any other discussion badge |
| Author column width | 150px | How much room the column below the avatar gets (85 to 400) |
| Gap below the avatar | 4px | The space between the avatar and the first badge under it (0 to 60) |
| Apply on phones too | Off | Show titles and the post count on phones as well |

## Compatibility

Works on **Flarum 1.8** and **Flarum 2.x** from the same release, with no configuration differences between the two.

Nothing is added to your database and nothing is added to what your forum sends to visitors: the post count is the one Flarum already publishes on member profiles, and the extension only decides whether to draw it.

## Installation

```sh
composer require linkrobins/badge-labels
```

Then enable the extension in the admin panel.

## Updating

```sh
composer update linkrobins/badge-labels
php flarum cache:clear
```

## Credit

Thanks to [mihzor](https://discuss.flarum.org/u/mihzor), [Subarist](https://discuss.flarum.org/u/Subarist), and [sergtsar](https://discuss.flarum.org/u/sergtsar) for the feedback that shaped the settings above.

Thanks to [Tutrix](https://discuss.flarum.org/u/Tutrix), who wrote the original CSS this is based on, in reply to [mihzor's request](https://discuss.flarum.org/d/39621-user-badges-below-or-beside-the-avatar-number-of-posts-and-full-badge-titles) for badges below the avatar with full titles and a post count, and who suggested turning it into an extension.

That CSS revealed each badge's name with `content: attr(aria-label)` on a pseudo-element, and had to reserve room for it with a fixed gap. This extension renders the name as a real element instead, which is what lets it work for every badge (including ones whose name Flarum only computes when the badge is drawn) and lets the column size itself to whatever badges a forum actually has, however many and however long their names are, rather than to one guessed width.

## Links

- [Packagist](https://packagist.org/packages/linkrobins/badge-labels)
- [Source](https://github.com/linkrobins/flarum-badge-labels)
- [Issues](https://github.com/linkrobins/flarum-badge-labels/issues)
