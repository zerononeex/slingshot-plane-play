# Music slots

Drop your own MP3s here (nothing is shipped). Every slot is optional: a missing file means silence.

## Flight music: which file plays (best first)
1. `flight-<world>-1.mp3`, `flight-<world>-2.mp3`, `flight-<world>-3.mp3`. If any of these exist, they **rotate**: a different song each flight, never the same one twice in a row (1 → 2 → 3 → 1, skipping missing ones). The last one played is remembered per world.
2. `flight-<world>.mp3`: a single song for that world.
3. Space only: `space.mp3`.
4. `flight.mp3`: every world.
5. Nothing: silence.

World ids: `plains`, `canyon`, `city`, `snow`, `desert`, `ocean`, `space`, `jetstream`. For example, `flight-canyon-2.mp3`.

## Menu
`menu.mp3`: Home / hangar, upgrades, save codes, transfer, results.

Tracks loop seamlessly at volume 0.5 and crossfade over about 600 ms. Music starts after the first tap. Each world's three numbered files are checked once per session, in the background; the game never waits for them. MUSIC ON/OFF is on Home and in pause.
