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

    // Archimedean spiral r = (9/2π)·θ, points every 20°
    // SPIRAL_360: full revolution (center → r=9); SPIRAL_270: 270° (center → r≈6.75)
    var SPIRAL_360 = '12,12 12.47,11.83 12.77,11.36 12.75,10.70 12.35,10.03 11.57,9.54 10.50,9.40 9.32,9.75 8.24,10.63 7.50,12 7.30,13.71 7.79,15.54 9,17.20 10.87,18.40 13.22,18.89 15.75,18.50 18.13,17.14 19.99,14.91 21,12';
    var SPIRAL_270 = '12,12 12.47,11.83 12.77,11.36 12.75,10.70 12.35,10.03 11.57,9.54 10.50,9.40 9.32,9.75 8.24,10.63 7.50,12 7.30,13.71 7.79,15.54 9,17.20 10.87,18.40';
    // Adult arm2 is arm1 reflected through centre (x→24-x, y→24-y)
    var SPIRAL_360_ARM2 = '12,12 11.53,12.17 11.23,12.64 11.25,13.30 11.65,13.97 12.43,14.46 13.50,14.60 14.68,14.25 15.76,13.37 16.50,12 16.70,10.29 16.21,8.46 15,6.80 13.13,5.60 10.78,5.11 8.25,5.50 5.87,6.86 4.01,9.09 3,12';

    var TOKEN_INNER = {
        blank:   '<circle cx="12" cy="12" r="9"/>',
        larva:   '<circle cx="12" cy="12" r="9"/><line x1="8.8" y1="12" x2="15.2" y2="12"/>',
        // outer circle + inner 240° arc (missing bottom 120°) at r=5.5
        creeper: '<circle cx="12" cy="12" r="9"/><path d="M16.76 14.75A5.5 5.5 0 1 0 7.24 14.75"/>',
        adult:   '<polyline points="' + SPIRAL_360 + '"/><polyline points="' + SPIRAL_360_ARM2 + '"/>',
        // Triple spiral: one 270° arm rotated at 0°, 120°, 240°
        breeder: '<polyline points="' + SPIRAL_270 + '"/>' +
                 '<g transform="rotate(120 12 12)"><polyline points="' + SPIRAL_270 + '"/></g>' +
                 '<g transform="rotate(240 12 12)"><polyline points="' + SPIRAL_270 + '"/></g>',
        // Same as breeder + 3 dots in the gaps between arms (at 40°, 160°, 280° CW, r=4.5)
        queen:   '<polyline points="' + SPIRAL_270 + '"/>' +
                 '<g transform="rotate(120 12 12)"><polyline points="' + SPIRAL_270 + '"/></g>' +
                 '<g transform="rotate(240 12 12)"><polyline points="' + SPIRAL_270 + '"/></g>' +
                 '<circle cx="15.45" cy="14.89" r="1.2" fill="currentColor" stroke="none"/>' +
                 '<circle cx="7.77" cy="13.54" r="1.2" fill="currentColor" stroke="none"/>' +
                 '<circle cx="12.78" cy="7.57" r="1.2" fill="currentColor" stroke="none"/>'
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
                    effectText = '+1 Adult added to bag';
                    break;
                case 'creeper':
                    // Remove Creeper, add 1 Breeder
                    bag['breeder'] = (bag['breeder'] || 0) + 1;
                    effectText = '+1 Breeder added to bag';
                    break;
                case 'adult':
                    // Return Adult; all players roll for Noise
                    bag[drawn.id]++;
                    effectText = 'All players roll for Noise';
                    break;
                case 'breeder':
                    // Return Breeder; all players roll for Noise
                    bag[drawn.id]++;
                    effectText = 'All players roll for Noise';
                    break;
                case 'queen':
                    // Return Queen; Nest: place Queen + Encounter / else +1 Egg
                    bag[drawn.id]++;
                    effectText = 'Nest: Queen + Encounter \u2014 No Nest: +1 Egg on board';
                    break;
                case 'blank':
                    // Return Blank, add 1 Adult
                    bag[drawn.id]++;
                    bag['adult'] = (bag['adult'] || 0) + 1;
                    effectText = '+1 Adult added to bag';
                    break;
            }
        }

        var el = $('#bag-drawn');
        el.innerHTML = tokenSvg(drawn.id, 80);
        el.className = 'type-' + drawn.id;
        var label = mode === 'encounter' ? 'Encounter' : 'Development';
        $('#bag-drawn-label').textContent = label + ': ' + drawn.name;
        $('#bag-drawn-effect').textContent = effectText;
        renderBag();
        saveState();
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
