(function () {
    'use strict';

    // ===== Game Data =====

    var NOISE_DIE = [
        { value: '1', label: 'Corridor 1', type: 'number' },
        { value: '2', label: 'Corridor 2', type: 'number' },
        { value: '3', label: 'Corridor 3', type: 'number' },
        { value: '4', label: 'Corridor 4', type: 'number' },
        { value: '\u2014', label: 'Silence', type: 'silence' },
        { value: '!', label: 'Danger', type: 'danger' }
    ];

    var DAMAGE_DIE = [
        { value: '\u2715', label: 'Miss', type: 'miss' },
        { value: '1', label: '1 Damage', type: 'hit' },
        { value: '1', label: '1 Damage', type: 'hit' },
        { value: '2', label: '2 Damage', type: 'heavy' },
        { value: '\u00d72', label: 'Double Damage', type: 'double' },
        { value: '3', label: 'Critical Hit', type: 'critical' }
    ];

    var COOP_OBJECTIVES = [
        { name: 'No Man Left Behind', description: 'Send the Signal AND all Rooms on the ship must be explored.', flavor: 'There are some empty hibernation pods here. We need to make sure everyone is accounted for.' },
        { name: 'Clean-Up Crew', description: 'Send the Signal AND the Nest must have been destroyed. OR Send the Signal AND the ship must have been destroyed.', flavor: 'When the briefing mentioned \'sanitizing the interior\', I had something quite different in mind...' },
        { name: 'Special Delivery', description: 'Finish the game in Escape Pod or Hibernation with an Intruder Egg Object.', flavor: 'I know a guy in New Tokyo who keeps buying all this weird s**t from deep space crews...' },
        { name: 'Emergency Post-Mortem', description: 'Place the blue Character Corpse Object in the Surgery Room.', flavor: 'Whatever happened to our friend might be happening to us next.' },
        { name: 'Cutting Off the Head', description: 'Send the Signal AND the Queen must have been killed. OR Send the Signal AND the ship must have been destroyed.', flavor: 'In a no-win situation, the least you can do is to go out with a bang.' },
        { name: 'Destination: Earth', description: 'The ship must reach Earth.', flavor: 'They\'ve sent us out there to die. Now they should clean their own mess.' },
        { name: 'First Contact Protocol', description: 'At least 2 Intruder Weaknesses must be discovered.', flavor: '11.8b \u2013 Involved parties are NOT allowed to break contact until enough operable knowledge is gathered.' }
    ];

    var WEAKNESSES = [
        { name: 'Reaction to Danger', effect: 'Surprise Attacks are resolved by subtracting 1 from the Intruder token value (always milder result).' },
        { name: 'Species on the Brink of Extinction', effect: 'All Intruders are killed when they suffer 1 fewer Injury than normal (Adults after 2 instead of 3, Queen after 4 instead of 5, etc.).' },
        { name: 'Susceptibility to Phosphates', effect: 'Any Intruder affected by a Fire Extinguisher item or the Security Room\'s Fire Control System immediately Retreats from the room. Larvae are killed outright instead of just retreating.' },
        { name: 'The Way of Fighting', effect: 'Characters gain a combat advantage against Intruders (Intruder Attack cards are resolved less effectively / crew side gets better results in melee).' },
        { name: 'The Way of Moving', effect: 'Intruders that are not Breeders or the Queen cannot destroy closed doors. When they try to move through a corridor with a closed door, nothing happens (door stays, Intruder stays in place).' },
        { name: 'Vital Places', effect: 'Intruders are more vulnerable to critical hits \u2014 crosshair/target symbols on Attack or Combat cards deal an extra Injury or enhanced effect.' },
        { name: 'Vulnerability to Energy', effect: 'Energy-based weapons and effects (e.g. certain crafted items, specific attacks) deal 1 additional Injury to all Intruders.' },
        { name: 'Vulnerability to Fire', effect: 'Intruders suffer 1 additional Injury for each damage instance from any fire source (Flamethrower, Molotov, fire markers, etc.). Additionally, if fire is present in a room with eggs, 2 eggs are destroyed per turn instead of 1.' }
    ];

    var RESEARCH_OBJECTS = [
        { id: 'corpse', name: 'Character Corpse' },
        { id: 'egg', name: 'Intruder Egg' },
        { id: 'carcass', name: 'Intruder Carcass' }
    ];

    var BAG_TOKEN_TYPES = [
        { id: 'blank',   name: 'Blank'   },
        { id: 'larva',   name: 'Larva'   },
        { id: 'creeper', name: 'Creeper' },
        { id: 'adult',   name: 'Adult'   },
        { id: 'breeder', name: 'Breeder' },
        { id: 'queen',   name: 'Queen'   }
    ];


    var TOKEN_INNER = {
        blank:   '<circle cx="12" cy="12" r="9"/>',
        larva:   '<circle cx="12" cy="12" r="9"/><line x1="8.8" y1="12" x2="15.2" y2="12"/>',
        // outer circle + inner 240° arc (missing bottom 120°) at r=5.5
        creeper: '<circle cx="12" cy="12" r="9"/><path d="M15.81 14.2A4.4 4.4 0 1 0 8.19 14.2"/>',
        // outer circle + S-curve of two semicircles (horizontal yin-yang, no dots)
        // left arc CCW → bulges up; right arc CW → bulges down
        adult:   '<circle cx="12" cy="12" r="9"/><path d="M3 12A4.5 4.5 0 0 0 12 12A4.5 4.5 0 0 1 21 12"/>',
        // outer circle + 3 semicircles of r=4.5 (= R/2) from centre to each junction (120° apart)
        // CW (sweep=1): each arm curves upward from centre then out to its junction
        breeder: '<circle cx="12" cy="12" r="9"/>' +
                 '<path d="M12 12A4.5 4.5 0 0 1 21 12"/>' +
                 '<g transform="rotate(120 12 12)"><path d="M12 12A4.5 4.5 0 0 1 21 12"/></g>' +
                 '<g transform="rotate(240 12 12)"><path d="M12 12A4.5 4.5 0 0 1 21 12"/></g>',
        // Same as breeder + 3 filled dots between the arms (at 60°, 180°, 300° CW, r=5)
        queen:   '<circle cx="12" cy="12" r="9"/>' +
                 '<path d="M12 12A4.5 4.5 0 0 1 21 12"/>' +
                 '<g transform="rotate(120 12 12)"><path d="M12 12A4.5 4.5 0 0 1 21 12"/></g>' +
                 '<g transform="rotate(240 12 12)"><path d="M12 12A4.5 4.5 0 0 1 21 12"/></g>' +
                 '<circle cx="16.5" cy="12" r="1.2" fill="currentColor" stroke="none"/>' +
                 '<circle cx="9.75" cy="15.9" r="1.2" fill="currentColor" stroke="none"/>' +
                 '<circle cx="9.75" cy="8.1" r="1.2" fill="currentColor" stroke="none"/>'
    };

    function tokenSvg(id, size) {
        var attrs = size ? ' width="' + size + '" height="' + size + '"' : '';
        return '<svg' + attrs + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + TOKEN_INNER[id] + '</svg>';
    }

    function defaultBag() {
        return { blank: 1, larva: 4, creeper: 1, adult: 3 + numPlayers, breeder: 0, queen: 1 };
    }

    // ===== State =====

    var numPlayers = 2;
    var diceType = 'noise';
    var objectives = [];
    var research = [null, null, null];
    var revealed = [false, false, false];
    var bag = {};
    var rolling = false;

    // ===== Utility =====

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }
        return a;
    }

    function $(sel) { return document.querySelector(sel); }
    function $$(sel) { return document.querySelectorAll(sel); }

    // ===== Persistence =====

    var STORAGE_KEY = 'nemesis-companion-state';

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                numPlayers: numPlayers,
                objectives: objectives,
                research: research,
                revealed: revealed,
                bag: bag
            }));
        } catch (e) { /* storage unavailable */ }
    }

    function loadState() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            var saved = JSON.parse(raw);
            if (saved && typeof saved.numPlayers === 'number') {
                numPlayers = saved.numPlayers;
                objectives = saved.objectives || [];
                research = saved.research || [];
                revealed = saved.revealed || [false, false, false];
                bag = saved.bag || {};
                return true;
            }
        } catch (e) { /* parse error */ }
        return false;
    }

    // ===== Tab Navigation =====

    function switchTab(id) {
        $$('.tab-content').forEach(function (el) { el.classList.remove('active'); });
        $$('.tab-btn').forEach(function (el) { el.classList.remove('active'); });
        $('#tab-' + id).classList.add('active');
        $('.tab-btn[data-tab="' + id + '"]').classList.add('active');
    }

    // ===== Settings =====

    function setPlayerCount(n) {
        numPlayers = n;
        $$('.player-btn').forEach(function (btn) {
            btn.classList.toggle('selected', parseInt(btn.dataset.count) === n);
        });
    }

    // ===== New Game =====

    function newGame() {
        objectives = shuffle(COOP_OBJECTIVES).slice(0, numPlayers);
        research = shuffle(WEAKNESSES).slice(0, 3);
        revealed = [false, false, false];
        resetBag();
        renderObjectives();
        renderResearch();
        saveState();
        showToast('New game started!');
    }

    // ===== Dice =====

    function setDiceType(type) {
        diceType = type;
        $$('.dice-type-btn').forEach(function (btn) {
            btn.classList.toggle('selected', btn.dataset.type === type);
        });
        $('#die-value').textContent = '?';
        $('#die-label').innerHTML = '\u00a0';
        $('#die').className = '';
    }

    function rollDie() {
        if (rolling) return;
        rolling = true;

        var faces = diceType === 'noise' ? NOISE_DIE : DAMAGE_DIE;
        var die = $('#die');
        var valueEl = $('#die-value');
        var labelEl = $('#die-label');
        var btn = $('#roll-btn');

        btn.disabled = true;
        die.classList.add('rolling');
        labelEl.innerHTML = '\u00a0';

        var count = 0;
        var totalFrames = 14;
        var interval = setInterval(function () {
            var face = faces[Math.floor(Math.random() * faces.length)];
            valueEl.textContent = face.value;
            count++;

            if (count >= totalFrames) {
                clearInterval(interval);
                var result = faces[Math.floor(Math.random() * faces.length)];
                valueEl.textContent = result.value;
                labelEl.textContent = result.label;
                die.className = 'result-' + result.type;
                rolling = false;
                btn.disabled = false;
            }
        }, 50);
    }

    // ===== Research =====

    function revealResearch(index) {
        if (revealed[index] || !research[index]) return;
        revealed[index] = true;
        renderResearch();
        saveState();
    }

    // ===== Rendering =====

    function renderObjectives() {
        var el = $('#objectives-list');
        if (!objectives.length) {
            el.innerHTML = '<p class="placeholder">Press NEW GAME in Settings<br>to assign cooperative objectives</p>';
            return;
        }
        el.innerHTML = objectives.map(function (obj, i) {
            return '<div class="objective-card">' +
                '<div class="objective-name">' + (i + 1) + '. ' + obj.name + '</div>' +
                '<div class="objective-desc">' + obj.description + '</div>' +
                (obj.flavor ? '<div class="objective-flavor">' + obj.flavor + '</div>' : '') +
                '</div>';
        }).join('');
        var footer = $('#objectives-footer');
        if (footer) footer.style.display = objectives.length > 1 ? '' : 'none';
    }

    function renderResearch() {
        var el = $('#research-grid');
        el.innerHTML = RESEARCH_OBJECTS.map(function (obj, i) {
            var isRevealed = revealed[i];
            var weakness = research[i];

            if (isRevealed && weakness) {
                return '<div class="research-card revealed">' +
                    '<div class="research-name">' + obj.name + '</div>' +
                    '<div class="research-status">RESEARCHED</div>' +
                    '<div class="weakness-name">' + weakness.name + '</div>' +
                    '<div class="weakness-effect">' + weakness.effect + '</div>' +
                    '</div>';
            }

            return '<div class="research-card" data-index="' + i + '">' +
                '<div class="research-name">' + obj.name + '</div>' +
                '<div class="research-hint">Tap to research</div>' +
                '<div class="research-unknown">?</div>' +
                '</div>';
        }).join('');

        el.querySelectorAll('.research-card:not(.revealed)').forEach(function (card) {
            card.addEventListener('click', function () {
                revealResearch(parseInt(card.dataset.index));
            });
        });
    }

    // ===== Intruder Bag =====

    function resetBag() {
        bag = {};
        var d = defaultBag();
        for (var k in d) bag[k] = d[k];
        $('#bag-drawn').textContent = '?';
        $('#bag-drawn').className = '';
        $('#bag-drawn-label').innerHTML = '\u00a0';
        $('#bag-drawn-name').innerHTML = '\u00a0';
        $('#bag-drawn-name').className = '';
        $('#bag-drawn-effect').innerHTML = '\u00a0';
        renderBag();
        saveState();
    }

    function bagTotal() {
        var total = 0;
        for (var k in bag) total += bag[k];
        return total;
    }

    function drawFromBag(mode) {
        var total = bagTotal();
        if (total === 0) {
            showToast('Bag is empty!');
            return;
        }
        var encBtn = $('#encounter-btn');
        var devBtn = $('#development-btn');
        encBtn.disabled = true;
        devBtn.disabled = true;
        setTimeout(function () { encBtn.disabled = false; devBtn.disabled = false; }, 4000);

        // Show ? for 2s, then reveal result
        var drawnEl = $('#bag-drawn');
        var labelEl = $('#bag-drawn-label');
        var nameEl = $('#bag-drawn-name');
        var effectEl = $('#bag-drawn-effect');
        labelEl.textContent = '\u00a0';
        drawnEl.textContent = '?';
        drawnEl.className = '';
        nameEl.textContent = '\u00a0';
        nameEl.className = '';
        effectEl.textContent = '\u00a0';

        var roll = Math.floor(Math.random() * total);
        var cumulative = 0;
        var drawn = null;
        for (var i = 0; i < BAG_TOKEN_TYPES.length; i++) {
            var t = BAG_TOKEN_TYPES[i];
            cumulative += (bag[t.id] || 0);
            if (roll < cumulative) {
                drawn = t;
                break;
            }
        }
        if (!drawn) return;

        // Remove drawn token; Development may return it below
        bag[drawn.id]--;

        var effectText = '\u00a0';

        if (mode === 'development') {
            switch (drawn.id) {
                case 'larva':
                    // Remove Larva, add 1 Adult
                    bag['adult'] = (bag['adult'] || 0) + 1;
                    effectText = 'Larva removed, Adult added.';
                    break;
                case 'creeper':
                    // Remove Creeper, add 1 Breeder
                    bag['breeder'] = (bag['breeder'] || 0) + 1;
                    effectText = 'Creeper removed, Breeder added.';
                    break;
                case 'adult':
                    // Return Adult; all players roll for Noise
                    bag[drawn.id]++;
                    effectText = 'All out of combat players roll for Noise.';
                    break;
                case 'breeder':
                    // Return Breeder; all players roll for Noise
                    bag[drawn.id]++;
                    effectText = 'All out of combat players roll for Noise.';
                    break;
                case 'queen':
                    // Return Queen; Nest: place Queen + Encounter / else +1 Egg
                    bag[drawn.id]++;
                    effectText = 'If there are any Characters in the Nest Room, they Encounter the Queen.\nOtherwise, add an additional Egg.';
                    break;
                case 'blank':
                    // Return Blank, add 1 Adult
                    bag[drawn.id]++;
                    bag['adult'] = (bag['adult'] || 0) + 1;
                    effectText = 'Adult added.';
                    break;
            }
        }

        renderBag();
        saveState();

        setTimeout(function () {
            labelEl.textContent = mode === 'encounter' ? 'ENCOUNTER' : 'DEVELOPMENT';
            drawnEl.innerHTML = tokenSvg(drawn.id, 80);
            drawnEl.className = 'type-' + drawn.id;
            nameEl.textContent = drawn.name.toUpperCase();
            nameEl.className = 'type-' + drawn.id;
            effectEl.textContent = effectText;
        }, 2000);
    }

    function adjustBag(id, delta) {
        bag[id] = Math.max(0, (bag[id] || 0) + delta);
        renderBag();
        saveState();
    }

    function renderBag() {
        var el = $('#bag-tokens');
        var intruderTotal = 0;
        for (var k in bag) { if (k !== 'blank') intruderTotal += bag[k]; }
        el.innerHTML = BAG_TOKEN_TYPES.map(function (t) {
            var count = bag[t.id] || 0;
            return '<div class="bag-token-row">' +
                '<div class="bag-token-label type-' + t.id + '">' +
                    '<span class="bag-token-icon">' + tokenSvg(t.id) + '</span>' +
                    '<span class="bag-token-name">' + t.name + '</span>' +
                '</div>' +
                '<div class="bag-token-controls">' +
                '<button class="bag-btn" data-id="' + t.id + '" data-delta="-1">\u2212</button>' +
                '<span class="bag-token-count">' + count + '</span>' +
                '<button class="bag-btn" data-id="' + t.id + '" data-delta="1">+</button>' +
                '</div>' +
                '</div>';
        }).join('') +
        '<div class="bag-total">Total Intruders: ' + intruderTotal + '</div>';

        el.querySelectorAll('.bag-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                adjustBag(btn.dataset.id, parseInt(btn.dataset.delta));
            });
        });
    }

    // ===== Toast =====

    function showToast(msg) {
        var toast = $('#toast');
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 2000);
    }

    // ===== Init =====

    function init() {
        $$('.tab-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { switchTab(btn.dataset.tab); });
        });

        $$('.player-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { setPlayerCount(parseInt(btn.dataset.count)); });
        });

        $('#new-game-btn').addEventListener('click', newGame);

        $$('.dice-type-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { setDiceType(btn.dataset.type); });
        });

        $('#roll-btn').addEventListener('click', rollDie);
        $('#die').addEventListener('click', rollDie);

        $('#encounter-btn').addEventListener('click', function () { drawFromBag('encounter'); });
        $('#development-btn').addEventListener('click', function () { drawFromBag('development'); });
        $('#bag-reset-btn').addEventListener('click', function () {
            resetBag();
            showToast('Bag reset!');
        });

        var hadSavedState = loadState();
        if (!hadSavedState) {
            research = shuffle(WEAKNESSES).slice(0, 3);
            resetBag();
        }
        if (!bag || bagTotal() === undefined) resetBag();

        setPlayerCount(numPlayers);
        renderObjectives();
        renderResearch();
        renderBag();
    }

    document.addEventListener('DOMContentLoaded', init);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js');
    }
})();
