# Spot Kick

Liverpool vs Real Madrid: a local two-player penalty shootout with alternating kicks and sudden death, plus a five-shot solo practice mode. There are now two separate versions: the original HTML5 Canvas game and an experimental Three.js version.

## Play

Open [penalty.html](penalty.html) directly in a desktop browser. No installation, server, internet connection, or external assets are needed.

For the separate **3D prototype**, open [penalty-3d.html](penalty-3d.html). Keep [scene-3d.js](scene-3d.js) and the [vendor folder](vendor) beside it. It also runs offline without a server, but requires WebGL.

Both versions open on a **game menu**. Choose the game mode and day/night lighting, then select **Start game**. The 3D menu also offers automatic or manual control selection. Each menu links to the other version.

During play, setup controls and long instructions are hidden, leaving a compact **Quit to menu / Sound** bar above the game. **Quit to menu ends the match**, clears the score and any 3D fire-shot rewards, cancels held inputs and stops shot sounds. Starting again begins a fresh match with the selected settings; there is no Resume option. The hidden game does not advance or render while the menu is open.

### Sound on iPhone and iPad (both versions)

Tap **Start game** or **Enable sound** to activate sound. Touch release, clicks and keyboard input can unlock audio; a blocked attempt does not prevent a later gesture from retrying. The button shows **Enable sound** until the audio context is running, then **Sound on**. Tap **Sound on** to mute, or **Sound off** to re-enable it.

If Safari is still silent:

- Turn off iPhone **Silent Mode** and raise the **media volume**.
- Check whether audio is being sent to Bluetooth headphones or another output.
- After returning from another app or unlocking the phone, tap **Enable sound** if it appears.
- If the game displays **Audio unavailable**, reload it and try again.

The game respects device-level muting; it does not force playback over Silent Mode. Browser tests verify audio generation and gesture handling, but cannot verify a physical iPhone's speaker output.

## Host on GitHub Pages

The game is a static website: no backend, package installation or build step is needed. [index.html](index.html) opens the 3D version automatically, using a relative URL that also works under a repository path such as `/Penalties/`. [.nojekyll](.nojekyll) tells Pages to serve the files without Jekyll processing.

**A public repository and its Pages site are visible to anyone, not just your family.** Do not upload private notes or credentials.

### 1. Create the repository

On GitHub, create a **public** repository named **Penalties**. Leave the options to add a README, license or gitignore unchecked: the local folder already contains the publishing files.

### 2. Upload from this folder

In a PowerShell terminal, run:

```powershell
Set-Location C:\Repo\Penalties
git init -b main
git add .
git status --short
```

Review the staged list before committing. [.gitignore](.gitignore) uses an allowlist: only these files should be included:

```text
.gitignore
.nojekyll
index.html
penalty-3d.html
penalty.html
scene-3d.js
README.md
vendor\three.min.js
vendor\three-LICENSE.txt
vendor\manifest.json
```

The game files and Three.js script are required; the license must accompany the library. The README and manifest are retained as useful documentation. Planning notes, editor settings, screenshots, backups and other unlisted files remain local. Add an allowlist entry when introducing any new game asset.

Then replace `YOURUSERNAME` below with your GitHub username and run:

```powershell
git commit -m "Publish Spot Kick game"
git remote add origin https://github.com/YOURUSERNAME/Penalties.git
git push -u origin main
```

Authenticate with GitHub if prompted. These initialization commands are for a new repository; if Git is already configured, use its existing branch and remote instead. A gitignore does not remove files that were already committed or prevent a forced add, so always review the staged list.

### 3. Enable Pages

In the GitHub repository:

1. Open **Settings > Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select **main** and **/ (root)**, then **Save**.
4. Wait for the Pages deployment to finish. The page will show the published address.

For a repository named `Penalties`, the address is normally:

```text
https://YOURUSERNAME.github.io/Penalties/
```

Share that HTTPS link with your family. On iPhone/iPad, open it in Safari; touch controls are detected automatically. Two-player mode still means two people on the same device, not online opponents.

For later updates, review and push the changed files:

```powershell
git add .
git diff --cached --stat
git commit -m "Update Spot Kick"
git push
```

GitHub Pages republishes the site after a successful deployment. If you see old content, reload after deployment finishes.

Official guide: [Configuring a publishing source for GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

### iPhone and iPad controls (3D only)

**Controls: Auto** in the 3D menu enables touch mode on iPhone/iPad, including iPads using a desktop-style Mac user agent. Other computers retain mouse/keyboard controls. Select **Touch** or **Mouse / keys** to override detection.

- **Aim and shoot:** touch and hold the pitch to aim and charge in one gesture, matching the 2D game. Drag that same finger to adjust the target; release to shoot. There is no separate Shoot button.
- **Spin:** once the ball is airborne, drag the cue-ball control. Right/left applies curl; down/up applies backspin/topspin. Drag to the centre to request neutral spin. Applied spin still ramps gradually, and releasing retains the requested setting.
- **Keeper:** in two-player mode, tap one of the nine direction buttons from run-up onward. The first choice locks, just like the physical numpad. The pitch and spin control track separate pointers, so another finger can operate the keeper.
- **Hide aim:** tap **Hide aim / Show aim**. It stays toggled during the shot and resets for the next attempt.
- Interrupted touches, lost pointer capture, leaving the page and quitting to the menu cancel unfinished charges rather than releasing accidental shots. Keyboard controls remain available: focus the pitch, aim with arrows, then hold and release Space.

Portrait play keeps power, the spin control and Restart/Next in a single column below the pitch without sideways wrapping. The touch spin graphic is 64px square inside a fixed 72px panel, retaining a usable drag target without a large control card. In touch shootouts, the keeper pad appears during run-up and flight, with a compact side-by-side spin/keypad layout in portrait. Short landscape layouts omit the spin readout text but retain the labelled cue ball. Smaller screens can scroll vertically; aim projection updates with the field size and browser viewport.

For iPhone/iPad sharing, host the game folder and open its link in Safari rather than relying on local HTML opened through the Files app. This mode has browser-emulation and synthetic input coverage, but still needs physical iPhone/iPad Safari testing for real multi-touch gestures, audio and graphics performance.

- **Mouse:** aim over the goal, hold the primary button to charge, then release to shoot.
- **Keyboard:** focus the pitch, use arrow keys to aim, hold Space to charge, and release to shoot.
- **Next penalty / Next team:** advance after a goal, save, or miss. After the match ends, choose **Play again**.
- **Restart:** reset the round at any time.
- **Game mode:** choose an AI keeper or a second player on the same device from the menu.
- **Sound:** use **Enable sound** if audio is blocked. Once active, **Sound on/off** toggles all sound effects using the button above the pitch. Touch release, clicks and keyboard input can activate audio.
- **Lighting:** choose day or night in the menu. An Anfield- or Bernabeu-inspired venue is randomly selected when starting or restarting a match.
- **Hide aim:** hold the right mouse button to hide the target and native cursor; release to restore them. In the original 2D game, press right before starting a left-button charge. The 3D version supports either button order.
- **In-flight spin:** gently move the mouse left/right for curl, down for backspin, or up for topspin. Arrow keys also work. The cue-ball dot shows applied spin as it ramps up, not an instant full-strength input. Reverse movement to unwind it.

Release locks your initial aim and power and starts the visible kicker's run-up. The ball leaves the spot at boot contact, followed by a follow-through animation. Power changes shot speed, not random accuracy; airborne spin can alter the trajectory. Aim outside the goal and you can miss. Posts and the crossbar rebound the ball, and rebounds remain live and can still score. Losing focus cancels an unfinished charge, but an already-started run-up or shot continues.

For a **Panenka**, aim near the centre, use the marked **22-45% power window**, and add substantial backspin early in flight. The cue indicator highlights the chip when sufficient spin has built up. It is still saveable; timing and the keeper's movement matter.

The goalkeeper has articulated arms and legs, gloves, boots, facial details, and a shaded kit. Save capsules are derived from the character's limb positions, so both position and pose matter.

### Experimental 3D version

- Perspective pitch, textured turf, solid goalposts, a deep net, patterned ball, shadows, day/night lighting, and two procedural stadium backgrounds.
- Original articulated 3D footballers with team colours and jersey names/numbers. These are stylized procedural models, not scanned players, photorealistic likenesses, or motion-captured animations.
- Kicker approach, planting, leg swing and follow-through; keeper loading, distinct high/mid/low dives, jump, crouch, landing and recovery.
- Keeper collision capsules use the same 3D joints as the renderer. Unlike the 2D version, a dive does not remain frozen at full extension: committing too early can leave the keeper landing before the ball arrives.
- Desktop layout uses the browser height, a wide pitch and a right-hand control panel, rather than stacking all controls below a tall canvas. Resizing or switching modes updates the camera and aiming projection. Narrow screens stack the panels and scroll normally; very short windows may also require scrolling.
- Solo practice, alternating club shootouts, sudden death, audio, live rebounds and gentle spin are retained.

Three.js **0.158.0** is pinned locally for classic-script, `file://` compatibility. Its [MIT license](vendor/three-LICENSE.txt) and [dependency manifest](vendor/manifest.json) are included. The legacy build emits a deprecation warning, but does not fetch a CDN or require an internet connection. If WebGL cannot start or its context is lost, the page displays an explicit error and directs you to reload or use the 2D game.

<details>
<summary>3D Easter egg: the crossbar bird (spoilers)</summary>

- On a normal attempt, a bird has a **30% chance** to fly down and perch at a random position along the crossbar. It takes about 1.3 seconds to land.
- Once perched, a ball passing within **0.55 metres** scares it away unharmed. The attacking team earns one fire shot; the shot that scared the bird is still normal.
- The reward applies to that team's **next penalty kick**, not its intervening goalkeeper turn. In solo practice, it applies to the next attempt. Each team can hold its own reward.
- The next taker's striking boot burns. At contact the ball lights up, and **all keeper collisions are bypassed for that one shot**. Aim, spin, goal-line rules, ground bounces and frame rebounds remain unchanged: a fire shot can still miss.
- Scoring a fire shot sets the net ablaze. A miss does not ignite it. Flames, glowing materials and lights clear for the next attempt.
- Cancelling an unfinished charge preserves the reward. Releasing to shoot consumes it, even if the resulting shot misses. Powered attempts do not spawn another bird or earn a chained reward.
- Restarting or changing modes clears both teams' rewards. Bonuses do not carry into another match. Reduced-motion mode keeps flames static and omits the bird's cosmetic flight.

The bird, flame texture and effects are generated locally, with no additional downloads.

</details>

## Teams and shootout rules

- **Player 1: Liverpool**, in red. **Player 2: Real Madrid**, in white.
- Liverpool kicks first. Teams alternate after every attempt; the people swap between shooting controls and numpad goalkeeper controls.
- **Alisson Becker** keeps goal for Liverpool in green. **Thibaut Courtois** keeps goal for Real Madrid in gold. The correct keeper and shirt switch with each turn.
- Each side initially has five kicks. The match ends early if one team cannot catch the other with its remaining kicks.
- If level after five kicks each, sudden death continues without a round cap. A winner is declared only after both teams have taken the same number of kicks and one leads. Scoring the first kick of a sudden-death pair does **not** end the match.
- Each team cycles through eleven named players, including its keeper as the eleventh taker. Nobody takes another penalty until all eleven teammates have taken one.
- Both teams have independent scores, kick histories, and save totals. Misses consume a kick but do not count as a goalkeeper save. Hover over a history marker to see the taker and outcome.
- Solo practice stays Liverpool shooting five times against Real Madrid's AI keeper; it has no alternating AI shooter or sudden death.

### Representative lineups

These are static, editable game lineups, not live squads or official starting elevens.

| Kick order | Liverpool | Real Madrid |
|---|---|---|
| 1 | Mohamed Salah | Kylian Mbappe |
| 2 | Alexis Mac Allister | Vinicius Junior |
| 3 | Dominik Szoboszlai | Jude Bellingham |
| 4 | Cody Gakpo | Federico Valverde |
| 5 | Florian Wirtz | Rodrygo |
| 6 | Alexander Isak | Eduardo Camavinga |
| 7 | Ryan Gravenberch | Aurelien Tchouameni |
| 8 | Virgil van Dijk | Antonio Rudiger |
| 9 | Ibrahima Konate | Eder Militao |
| 10 | Conor Bradley | Dani Carvajal |
| 11 | Alisson Becker | Thibaut Courtois |

Names and shirt numbers appear in the game. The graphics use generic kits and figures, not club logos, licensed artwork, or player portraits.

## Local two-player controls

The attacking team's player uses the mouse or arrow-key/Space shooting controls. The defending team's player uses the **physical number pad** while the pitch has focus. The turn banner names the current taker, keeper, and human players. Directions are from the screen's perspective, not the keeper's.

| | Left | Centre | Right |
|---|---|---|---|
| High | **7** - top-left dive | **8** - jump | **9** - top-right dive |
| Middle | **4** - mid-left dive | **5** - stand still | **6** - mid-right dive |
| Low | **1** - low-left dive | **2** - crouch | **3** - low-right dive |

- One committed move per penalty, available from the start of the run-up until the ball reaches the goal.
- The first valid key locks the choice, including **5**. Later presses and held-key repeats cannot change it.
- No key means the keeper stays standing. Earlier reactions give more time to reach the chosen position.
- Physical numpad keys work with Num Lock on or off; the number row above the letters does not control the keeper.
- Player 1 always owns Liverpool and Player 2 always owns Real Madrid; their shooting/goalkeeping roles alternate.
- Solo mode retains an AI keeper with a reaction delay after boot contact.

## Sound effects

Sound is synthesized locally with the Web Audio API; there are no downloaded recordings or external assets.

- Run-up footsteps and a ball-strike thump timed to boot contact.
- Layered crowd cheers, clapping, and a celebratory whistle for a goal.
- Keeper impact and a disappointed crowd reaction for a save.
- A metallic post/crossbar sound and crowd groan for a frame hit.
- A crowd groan for a miss and a final whistle when the shootout or solo practice actually ends.

Muting immediately stops active and scheduled effects. Next penalty, restart, and mode changes clear the previous shot's sounds. Hiding the tab stops audio; it resumes on the next interaction after returning. If Web Audio cannot start, the game displays an audio-unavailable message and remains playable silently. The sound preference lasts for the current page session only.

This is an arcade prototype: ball flight uses simplified gravity, spin and drag, fixed-step simulation, and swept collision checks, rather than a full football simulation. Touch controls are available in the 3D version only. Online multiplayer and persistence are not included.

## Development

The original self-contained game lives in [penalty.html](penalty.html). The independent 3D fork keeps its gameplay and UI in [penalty-3d.html](penalty-3d.html), with the active WebGL renderer and procedural models in [scene-3d.js](scene-3d.js). Gameplay tuning values are grouped in `CONFIG`; outcome evaluation and keeper geometry are separate from rendering. Changes to the experimental fork do not automatically modify the original. Local planning notes are excluded from the publishing repository.

## Prototype validation

Verified in VS Code's integrated Chromium browser:

- The original prototype passed 35 rule checks, mouse/keyboard rounds, focus/capture checks, and aim/layout checks at widths of 360, 640, and 1280 pixels.
- The two-player update passed 73 deterministic checks covering run-up/contact timing, all nine keeper poses, move locking, save geometry at different heights, AI isolation, late input, delayed frames, and restart.
- Another 41 checks covered numpad event mappings (including simulated Num Lock off navigation keys), keypad highlights, ignored number-row/repeat input, mode reset, and separate save/miss scoring.
- Complete five-shot rounds using actual numpad key events in two-player mode and mouse input in solo mode completed without JavaScript errors.
- The two-player layout had no horizontal overflow at widths of 360, 640, and 1280 pixels; no external resource requests were made.
- Audio checks verified non-silent, finite output below clipping for all seven effect groups, cleanup of finished voices, ten event-timing/outcome checks, and mute/restart/hidden-tab/resume behavior. These are signal and integration checks, not a subjective listening assessment.
- Shootout winner logic passed 5,879 exhaustive legal goal/miss prefixes through 14 kicks against an independent possible-final-scores oracle.
- Another 110 integration assertions covered team/keeper swaps, score ownership, early victory, sudden-death reply rights, extended ties, eleven-player rotation, restart, and the unchanged five-shot solo format.
- The initial 3D fork passed 106 checks for projection round trips, screen directions, finite keeper joints across all nine moves, keeper recovery, post/crossbar rebound-in and rebound-out, gradual spin, fixed-step determinism, and shootout decisions.
- The 3D mouse controls passed both button-down orders and both button-release orders, plus release outside the pitch and cancellation on focus loss.
- Widescreen layout checks at 1920x1080, 1366x768, 1280x720 and 1024x600 found no page overflow in either mode; the Next/Restart buttons stayed visible. Narrow layouts at 900, 640 and 360 pixels remained horizontally contained and retained accurate aiming.
- Another 17 3D integration checks covered numpad locking, alternating takers/keepers and kits, result ownership, a full five-shot solo round, saveable Panenkas, and all venue/lighting combinations. The compact 1024x600 two-player panel also fits its entire keypad without internal scrolling.
- A simulated WebGL context loss displayed the error notice and disabled gameplay controls; reloading restored the 3D scene.
- The bird/fire Easter egg passed 50 deterministic checks covering spawn and proximity thresholds, swept near misses, landing timing, team ownership, goalkeeper-turn preservation, solo play, cancellation, one-shot consumption, all nine keeper moves, unchanged rebounds/misses, effect cleanup, restart/mode reset, fixed-step consistency and reduced-motion flames.
- The earlier separate-button touch prototype passed six device-detection fixtures and 19 synthetic input checks, with pointer capture simulated for routing tests. The current pitch-hold controls were subsequently checked with native browser input as described below.
- Touch layouts were checked at 390x844, 844x390, 667x375, 768x1024, 1024x768 and 1366x768. Aiming remained accurate; the short landscape layouts kept the active keeper keypad fully visible with at least 44-pixel-tall controls.
- The menus passed 68 checks across both versions: starting with selected settings, quitting from all six gameplay phases, cancelling input, clearing scores/rewards, preventing hidden-game advancement, restoring focus/sound controls and restarting.
- Native browser touch checks passed charge/release, cancellation, established pointer-capture loss and quitting while held in both versions. A native two-finger 3D check verified spin plus a simultaneous keeper move without stealing the spin pointer. Mouse/keyboard shooting and the supported mouse-button chords were also rechecked.
- The compact 3D controls passed 72 layout-state checks across solo/duo and all gameplay phases at 390x844, 375x667, 320x568, 844x390, 667x375 and 768x1024. Checks included child-level clipping, the exact 64px spin graphic, stable spin position as readouts change, and the solo Next button fitting within the 375x667 viewport.

Firefox and standalone browser verification remain pending. The narrow-layout checks do not certify mobile touch controls.

Audio-unlock regression checks passed in both versions using native browser touch release, a deliberately pending first resume followed by a successful retry, suspended-state messaging, and mute/unmute. An analyser measured nonzero generated crowd audio and zero output after muting. These checks do not replace physical iPhone Safari testing.
