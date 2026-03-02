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
        { name: 'Vulnerability to Fire', effect: 'Fire-based attacks deal +1 damage to all Intruders.' },
        { name: 'Photosensitivity', effect: 'Intruders in fully powered rooms suffer 1 additional damage from all sources.' },
        { name: 'Thin Exoskeleton', effect: 'All physical attacks deal +1 damage to Intruders.' },
        { name: 'Chemical Vulnerability', effect: 'Decontamination rooms deal 2 damage to any Intruder passing through.' },
        { name: 'Acoustic Disruption', effect: 'Noise markers in adjacent corridors force Intruders to retreat one room.' },
        { name: 'Thermal Instability', effect: 'Malfunctioning rooms deal 1 damage to any Intruder at the end of each round.' }
    ];

    var RESEARCH_OBJECTS = [
        { id: 'carcass', name: 'Carcass' },
        { id: 'egg', name: 'Egg' },
        { id: 'secretion', name: 'Secretion' }
    ];

    // ===== State =====

    var numPlayers = 2;
    var diceType = 'noise';
    var objectives = [];
    var research = [null, null, null];
    var revealed = [false, false, false];
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
                revealed: revealed
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
                '<div class="research-unknown">?</div>' +
                '<div class="research-hint">Tap to research</div>' +
                '</div>';
        }).join('');

        el.querySelectorAll('.research-card:not(.revealed)').forEach(function (card) {
            card.addEventListener('click', function () {
                revealResearch(parseInt(card.dataset.index));
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

        var hadSavedState = loadState();
        if (!hadSavedState) {
            research = shuffle(WEAKNESSES).slice(0, 3);
        }

        setPlayerCount(numPlayers);
        renderObjectives();
        renderResearch();
    }

    document.addEventListener('DOMContentLoaded', init);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js');
    }
})();
