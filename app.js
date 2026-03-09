(function () {
    'use strict';

    // ===== Game Data =====

    // d10: corridors 1–4 twice each, 1 silence, 1 danger
    var NOISE_DIE = [
        { value: '1', label: 'CORRIDOR 1', type: 'number' },
        { value: '1', label: 'CORRIDOR 1', type: 'number' },
        { value: '2', label: 'CORRIDOR 2', type: 'number' },
        { value: '2', label: 'CORRIDOR 2', type: 'number' },
        { value: '3', label: 'CORRIDOR 3', type: 'number' },
        { value: '3', label: 'CORRIDOR 3', type: 'number' },
        { value: '4', label: 'CORRIDOR 4', type: 'number' },
        { value: '4', label: 'CORRIDOR 4', type: 'number' },
        { value: '\u2715', label: 'SILENCE', type: 'silence' },
        { value: '!', label: 'DANGER', type: 'danger' }
    ];

    // d6: Blank (1), Single Hit (1), Double Hit (1), Adult Intruder (1), Creeper Intruder (2)
    var ATTACK_DIE = [
        { value: '', label: 'MISS', type: 'miss' },
        { value: '\u2295', label: 'HIT', type: 'hit' },
        { value: '\u2295\u2295', label: 'DOUBLE HIT', type: 'double' },
        { value: null, label: 'ADULT', type: 'adult' },
        { value: null, label: 'CREEPER', type: 'creeper' },
        { value: null, label: 'CREEPER', type: 'creeper' }
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

    // Surprise encounter: token value = cards in hand needed to avoid Surprise Attack (one value per physical token)
    var SURPRISE_VALUES = {
        larva:   [1, 1, 1, 1, 1, 1, 1, 1],
        creeper: [1, 1, 1],
        adult:   [2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4],
        breeder: [3, 4],
        queen:   [4]
    };

    function surpriseValue(tokenId) {
        var arr = SURPRISE_VALUES[tokenId];
        return arr ? arr[Math.floor(Math.random() * arr.length)] : null;
    }


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
    var objectives = [];
    var research = [null, null, null];
    var revealed = [false, false, false];
    var bag = {};
    var currentTurn = 16;
    var maxTurns = 16;

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

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    var PRESS_DISABLE_MS = 500;
    var bagButtonLocks = {};

    function disableButtonTemporarily(btn, duration) {
        if (!btn) return;
        btn.disabled = true;
        setTimeout(function () { btn.disabled = false; }, duration);
    }

    function bagButtonLockKey(id, delta) {
        return id + ':' + delta;
    }

    function isBagButtonLocked(id, delta) {
        return (bagButtonLocks[bagButtonLockKey(id, delta)] || 0) > Date.now();
    }

    function lockBagButton(id, delta, duration) {
        var key = bagButtonLockKey(id, delta);
        bagButtonLocks[key] = Date.now() + duration;
        setTimeout(function () {
            if ((bagButtonLocks[key] || 0) <= Date.now()) {
                delete bagButtonLocks[key];
            }
            renderBag();
        }, duration);
    }

    function updateUiScale() {
        var width = Math.max(window.innerWidth || 0, 1);
        var height = Math.max(window.innerHeight || 0, 1);
        var shortEdge = Math.min(width, height);
        var longEdge = Math.max(width, height);
        var scale = Math.sqrt((shortEdge / 540) * (longEdge / 960));
        document.documentElement.style.setProperty('--ui-scale', clamp(scale, 1, 4).toFixed(3));
    }

    // ===== Persistence =====

    var STORAGE_KEY = 'nemesis-companion-state';

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                numPlayers: numPlayers,
                objectives: objectives,
                research: research,
                revealed: revealed,
                bag: bag,
                currentTurn: currentTurn,
                maxTurns: maxTurns
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
                var validTurns = [24, 20, 16, 12, 8];
                var savedTurns = typeof saved.maxTurns === 'number' && saved.maxTurns >= 8 && saved.maxTurns <= 24 ? saved.maxTurns : 16;
                maxTurns = validTurns.indexOf(savedTurns) !== -1 ? savedTurns : validTurns.reduce(function (a, b) { return Math.abs(a - savedTurns) <= Math.abs(b - savedTurns) ? a : b; });
                currentTurn = typeof saved.currentTurn === 'number' && saved.currentTurn >= 1 ? saved.currentTurn : maxTurns;
                currentTurn = Math.max(1, Math.min(currentTurn, maxTurns));
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
        $$('#player-selector .player-btn').forEach(function (btn) {
            btn.classList.toggle('selected', parseInt(btn.dataset.count) === n);
        });
        var pods = Math.ceil(n / 2) + 1;
        $('#setup-pod-count').textContent = pods;
    }

    // ===== New Game =====

    function newGame() {
        objectives = shuffle(COOP_OBJECTIVES).slice(0, numPlayers);
        research = shuffle(WEAKNESSES).slice(0, 3);
        revealed = [false, false, false];
        currentTurn = maxTurns;
        resetBag();
        renderObjectives();
        renderResearch();
        renderTurnTracker();
        saveState();
        showToast('New game started!');
    }

    // ===== Dice =====

    function animateDie(type, onDone) {
        var faces = type === 'noise' ? NOISE_DIE : ATTACK_DIE;
        var die = $('#die-' + type);
        var valueEl = $('#die-' + type + '-value');
        var labelEl = $('#die-' + type + '-label');
        labelEl.innerHTML = '\u00a0';
        if (type === 'noise') {
            $('#die-noise-hint').textContent = '\u00a0';
        }
        if (type === 'attack') {
            $('#die-attack-hint').textContent = '\u00a0';
        }
        die.classList.add('rolled', 'rolling');

        function setAttackDieFace(face) {
            if (face.type === 'adult' || face.type === 'creeper') {
                valueEl.innerHTML = tokenSvg(face.type);
            } else {
                valueEl.textContent = face.value;
            }
        }
        var count = 0;
        var totalFrames = 14;
        var interval = setInterval(function () {
            var face = faces[Math.floor(Math.random() * faces.length)];
            if (type === 'attack') {
                setAttackDieFace(face);
            } else {
                valueEl.textContent = face.value;
            }
            count++;
            if (count >= totalFrames) {
                clearInterval(interval);
                var result = faces[Math.floor(Math.random() * faces.length)];
                if (type === 'attack') {
                    setAttackDieFace(result);
                } else {
                    valueEl.textContent = result.value;
                }
                labelEl.textContent = result.label;
                if (type === 'noise') {
                    var hintEl = $('#die-noise-hint');
                    if (result.type === 'number') {
                        hintEl.textContent = 'Place a Noise marker in an adjacent Corridor #' + result.value + '.';
                    } else if (result.type === 'danger') {
                        hintEl.textContent = 'Move all out of combat Intruders from neighboring Rooms to this Room.\nIf there are no such Intruders present, place a Noise marker in each adjacent Corridor without a Noise marker.';
                    } else {
                        hintEl.textContent = 'If the Character has a Slime marker, then resolve "Danger" instead.\nDanger: Move all out of combat Intruders from neighboring Rooms to this Room. If there are no such Intruders present, place a Noise marker in each adjacent Corridor without a Noise marker.';
                    }
                }
                if (type === 'attack') {
                    var attackHintEl = $('#die-attack-hint');
                    if (result.type === 'double') {
                        attackHintEl.textContent = 'Deal 2 Injuries.\nMelee: Deal only 1 Injury.';
                    } else if (result.type === 'hit') {
                        attackHintEl.textContent = 'Deal 1 Injury.';
                    } else if (result.type === 'creeper') {
                        attackHintEl.textContent = 'If your target is Larva or Creeper, deal 1 Injury.\nMelee: If not, your Character suffers 1 Serious Wound.';
                    } else if (result.type === 'adult') {
                        attackHintEl.textContent = 'If your target is Larva, Creeper or Adult, deal 1 Injury.\nMelee: If not, your Character suffers 1 Serious Wound.';
                    } else {
                        attackHintEl.textContent = 'Melee: Your Character suffers 1 Serious Wound.';
                    }
                }
                die.className = 'die result-' + result.type + ' rolled';
                die.classList.remove('rolling');
                onDone();
            }
        }, 50);
    }

    function resetDie(type) {
        var die = $('#die-' + type);
        var valueEl = $('#die-' + type + '-value');
        var labelEl = $('#die-' + type + '-label');
        valueEl.textContent = '?';
        labelEl.innerHTML = '\u00a0';
        if (type === 'noise') {
            $('#die-noise-hint').textContent = '\u00a0';
        }
        if (type === 'attack') {
            $('#die-attack-hint').textContent = '\u00a0';
        }
        die.className = 'die';
    }

    function rollDie(type) {
        var die = $('#die-' + type);
        if (die.classList.contains('rolling')) return;
        resetDie(type === 'noise' ? 'attack' : 'noise');
        animateDie(type, function () {});
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
        var footer = $('#objectives-footer');
        var signalsNote = $('#objectives-footer-signals');
        if (!objectives.length) {
            el.innerHTML = '<p class="placeholder">Press NEW GAME in Settings<br>to assign cooperative objectives</p>';
            el.classList.remove('objectives-list--multi');
            if (footer) footer.style.display = 'none';
            if (signalsNote) signalsNote.style.display = 'none';
            return;
        }
        el.classList.toggle('objectives-list--multi', objectives.length > 1);
        el.innerHTML = objectives.map(function (obj, i) {
            var desc = obj.description;
            desc = desc.split(' OR ').join(' OR<br>');
            return '<div class="objective-card">' +
                '<div class="objective-name">' + (i + 1) + '. ' + obj.name + '</div>' +
                '<div class="objective-desc">' + desc + '</div>' +
                (obj.flavor ? '<div class="objective-flavor">' + obj.flavor + '</div>' : '') +
                '</div>';
        }).join('');
        if (footer) footer.style.display = objectives.length > 1 ? '' : 'none';
        if (signalsNote) {
            var hasSignalObjectives = objectives.some(function (o) { return o.description.indexOf('Send the Signal') !== -1; });
            signalsNote.style.display = objectives.length > 1 && hasSignalObjectives ? '' : 'none';
        }
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
        drawnEl.className = 'bag-drawn-unknown';
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
        var drawnSurpriseValue = null;

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
                    effectText = 'Characters in the Nest Room, Encounter the Queen (4).\nOtherwise, add an additional Egg.';
                    break;
                case 'blank':
                    // Return Blank, add 1 Adult
                    bag[drawn.id]++;
                    bag['adult'] = (bag['adult'] || 0) + 1;
                    effectText = 'Adult added.';
                    break;
            }
        }

        if (mode === 'encounter') {
            if (drawn.id === 'blank') {
                bag['blank'] = (bag['blank'] || 0) + 1;
                effectText = 'Place a Noise marker in each adjacent Corridor.';
                if (bagTotal() === 1) {
                    bag['adult'] = (bag['adult'] || 0) + 1;
                    effectText += '\nAdult added.';
                }
            } else {
                var x = surpriseValue(drawn.id);
                if (x !== null) {
                    drawnSurpriseValue = x;
                    effectText = 'At least ' + x + ' card' + (x === 1 ? '' : 's') + ' in hand needed to avoid a Surprise Attack.';
                }
            }
        }

        setTimeout(function () {
            labelEl.textContent = mode === 'encounter' ? 'ENCOUNTER' : 'DEVELOPMENT';
            drawnEl.innerHTML = tokenSvg(drawn.id);
            drawnEl.className = 'type-' + drawn.id;
            nameEl.textContent = drawn.name.toUpperCase() + (drawnSurpriseValue !== null ? ' ' + drawnSurpriseValue : '');
            nameEl.className = 'type-' + drawn.id;
            effectEl.textContent = effectText;
            if (mode === 'development') {
                setTurn(Math.max(0, currentTurn - 1));
            }
            renderBag();
            saveState();
        }, 2000);
    }

    function adjustBag(id, delta) {
        bag[id] = Math.max(0, (bag[id] || 0) + delta);
        renderBag();
        saveState();
    }

    // ===== Turn Tracker =====

    function setTurn(n) {
        n = Math.max(1, Math.min(maxTurns, n));
        if (n === currentTurn) return;
        currentTurn = n;
        renderTurnTracker();
        saveState();
    }

    function turnTrackerDividerSvg() {
        return '<svg class="turn-segment-divider-icon" viewBox="0 0 80 120" fill="none" aria-hidden="true">' +
            '<rect x="12" y="8" width="56" height="104" rx="8" stroke="currentColor" stroke-width="4"/>' +
            '<circle cx="40" cy="26" r="10" fill="currentColor" stroke="currentColor" stroke-width="4"/>' +
            '<rect x="29" y="36" width="22" height="38" rx="9" fill="currentColor" stroke="currentColor" stroke-width="4"/>' +
            '<line x1="29" y1="42" x2="16" y2="68" stroke="currentColor" stroke-width="6.5" stroke-linecap="round"/>' +
            '<line x1="51" y1="42" x2="64" y2="68" stroke="currentColor" stroke-width="6.5" stroke-linecap="round"/>' +
            '<rect x="8" y="68" width="64" height="52" rx="10" fill="currentColor"/>' +
        '</svg>';
    }

    function renderTurnTracker() {
        var container = $('#turn-segments');
        if (!container) return;
        container.innerHTML = '';
        var lowerThreshold = Math.floor(maxTurns / 2);
        for (var v = maxTurns; v >= 1; v--) {
            if (v === lowerThreshold) {
                var divider = document.createElement('div');
                divider.className = 'turn-segment-divider';
                divider.setAttribute('aria-hidden', 'true');
                divider.innerHTML = turnTrackerDividerSvg();
                container.appendChild(divider);
            }
            var seg = document.createElement('div');
            seg.className = 'turn-segment' + (v <= lowerThreshold ? ' lower-half' : '') + (v === currentTurn ? ' current' : '');
            seg.dataset.value = String(v);
            seg.setAttribute('aria-label', 'Turn ' + v);
            seg.textContent = v;
            container.appendChild(seg);
        }
        container.setAttribute('aria-valuenow', currentTurn);
        container.setAttribute('aria-valuemin', 1);
        container.setAttribute('aria-valuemax', maxTurns);
        updateTurnSegmentNumbersVisibility();
    }

    function updateTurnSegmentNumbersVisibility() {
        var container = $('#turn-segments');
        if (!container) return;
        var smallScreen = window.matchMedia('(max-width: 600px)').matches;
        var bigMaxTurns = maxTurns > 16;
        container.classList.toggle('hide-segment-numbers', smallScreen && bigMaxTurns);
    }

    function renderBag() {
        var el = $('#bag-tokens');
        var intruderTotal = 0;
        for (var k in bag) { if (k !== 'blank') intruderTotal += bag[k]; }
        el.innerHTML = BAG_TOKEN_TYPES.map(function (t) {
            var count = bag[t.id] || 0;
            var minusLocked = isBagButtonLocked(t.id, -1);
            var plusLocked = isBagButtonLocked(t.id, 1);
            return '<div class="bag-token-row">' +
                '<div class="bag-token-label type-' + t.id + '">' +
                    '<span class="bag-token-icon">' + tokenSvg(t.id) + '</span>' +
                    '<span class="bag-token-name">' + t.name + '</span>' +
                '</div>' +
                '<div class="bag-token-controls">' +
                '<button class="bag-btn" data-id="' + t.id + '" data-delta="-1"' + (minusLocked ? ' disabled' : '') + '>\u2212</button>' +
                '<span class="bag-token-count">' + count + '</span>' +
                '<button class="bag-btn" data-id="' + t.id + '" data-delta="1"' + (plusLocked ? ' disabled' : '') + '>+</button>' +
                '</div>' +
                '</div>';
        }).join('') +
        '<div class="bag-total">Total Intruders: ' + intruderTotal + '</div>';

        el.querySelectorAll('.bag-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var delta = parseInt(btn.dataset.delta, 10);
                lockBagButton(btn.dataset.id, delta, PRESS_DISABLE_MS);
                adjustBag(btn.dataset.id, delta);
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
        updateUiScale();

        $$('.tab-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { switchTab(btn.dataset.tab); });
        });

        $$('#player-selector .player-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                disableButtonTemporarily(btn, PRESS_DISABLE_MS);
                setPlayerCount(parseInt(btn.dataset.count));
            });
        });

        $('#new-game-btn').addEventListener('click', function () {
            disableButtonTemporarily(this, PRESS_DISABLE_MS);
            newGame();
        });

        $('#die-noise').addEventListener('click', function () { rollDie('noise'); });
        $('#die-attack').addEventListener('click', function () { rollDie('attack'); });

        $('#encounter-btn').addEventListener('click', function () { drawFromBag('encounter'); });
        $('#development-btn').addEventListener('click', function () { drawFromBag('development'); });

        var hadSavedState = loadState();
        if (!hadSavedState) {
            research = shuffle(WEAKNESSES).slice(0, 3);
            resetBag();
        }
        if (!bag || bagTotal() === undefined) resetBag();

        setPlayerCount(numPlayers);
        $$('#max-turns-selector .player-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                disableButtonTemporarily(btn, PRESS_DISABLE_MS);
                var n = parseInt(btn.dataset.turns, 10);
                maxTurns = n;
                $$('#max-turns-selector .player-btn').forEach(function (b) {
                    b.classList.toggle('selected', parseInt(b.dataset.turns) === n);
                });
                currentTurn = Math.max(1, Math.min(currentTurn, maxTurns));
                renderTurnTracker();
                saveState();
            });
        });
        $$('#max-turns-selector .player-btn').forEach(function (btn) {
            btn.classList.toggle('selected', parseInt(btn.dataset.turns) === maxTurns);
        });
        renderObjectives();
        renderResearch();
        renderBag();
        renderTurnTracker();
        window.addEventListener('resize', function () {
            updateUiScale();
            updateTurnSegmentNumbersVisibility();
        });
    }

    document.addEventListener('DOMContentLoaded', init);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js');
    }
})();
