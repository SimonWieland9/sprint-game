import { Player } from '../objects/Player';

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.TRACK_LENGTH_METERS = 150;
        this.PIXELS_PER_METER = 15; // "Arcade Scale": Short track, big players
        this.FINISH_LINE_X = 100 + (this.TRACK_LENGTH_METERS * this.PIXELS_PER_METER);
    }

    create(data) {
        console.log('GameScene: create started', data);
        this.playerData = data ? data.playerData : null;

        this.cameras.main.setBackgroundColor('#10102a'); // Deep Arcade Blue

        // --- Setup World ---
        const worldWidth = this.FINISH_LINE_X + 400;
        const worldHeight = 1500; // Increased height significantly to fix HUD overlap
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

        // --- Static Camera Setup ---
        const requiredWidth = worldWidth;
        const zoom = this.scale.width / requiredWidth;

        this.cameras.main.setZoom(zoom);
        this.cameras.main.centerOn(worldWidth / 2, worldHeight / 2);

        // Draw track
        this.drawTrack();

        // --- Game Logic State ---
        this.state = 'WAITING';
        this.isRacing = false;

        // --- Players ---
        // Use playerData from SetupScene if available, otherwise defaults (for debug/direct load)
        let activeConfigs = [];
        if (this.playerData && this.playerData.length > 0) { // Added check for this.playerData existence
            activeConfigs = this.playerData.map(p => ({
                id: p.id,
                keys: [Phaser.Input.Keyboard.KeyCodes[p.keys.left], Phaser.Input.Keyboard.KeyCodes[p.keys.right]],
                boostKey: Phaser.Input.Keyboard.KeyCodes[p.keys.join],
                countryIndex: p.countryIndex
            }));
        } else {
            // Fallback (for direct dev refresh)
            const playerCount = this.registry.get('playerCount') || 2;
            const defaults = [
                { id: 1, keys: ['LEFT', 'RIGHT'], boostKey: 'UP', countryIndex: 0 },
                { id: 2, keys: ['ONE', 'TWO'], boostKey: 'THREE', countryIndex: 1 },
                { id: 3, keys: ['V', 'B'], boostKey: 'N', countryIndex: 2 },
                { id: 4, keys: ['NINE', 'ZERO'], boostKey: 'QUOTES', countryIndex: 3 }
            ];
            activeConfigs = defaults.slice(0, playerCount).map(d => ({
                id: d.id,
                keys: [Phaser.Input.Keyboard.KeyCodes[d.keys[0]], Phaser.Input.Keyboard.KeyCodes[d.keys[1]]],
                boostKey: Phaser.Input.Keyboard.KeyCodes[d.boostKey],
                countryIndex: d.countryIndex
            }));
        }

        // OLD: laneStart = 320.
        // FIX: Shift down by 180px -> 500
        const laneStart = 500;
        const laneHeight = 140;

        // Player Colors updated to Neon Palette
        // The original playerConfigs array is replaced by activeConfigs logic above.

        this.players = [];
        for (let i = 0; i < activeConfigs.length; i++) {
            const config = activeConfigs[i];
            config.x = 100;
            config.y = laneStart + (i * laneHeight);
            this.players.push(new Player(this, config.id, config));
        }

        // --- UI ---
        console.log('GameScene: queueing UIScene launch');
        this.time.delayedCall(100, () => {
            console.log('GameScene: launching UIScene now');
            if (this.scene.isActive('UIScene')) {
                this.scene.stop('UIScene');
            }
            this.scene.launch('UIScene');
        });

        // Ensure MainMenu is gone (defensive)
        if (this.scene.isActive('MainMenu')) {
            this.scene.stop('MainMenu');
        }

        // Input Keys
        this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R); // Just in case

        // Audio Context for beeps
        console.log('GameScene: setup audio');
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error('AudioContext failed:', e);
        }
        console.log('GameScene: create finished');
    }

    drawTrack() {
        console.log('GameScene: drawTrack');
        const graphics = this.add.graphics();
        const laneHeight = 140;
        const startY = 430; // laneStart (500) - 70 (half lane height) roughly, to center players in lanes
        const totalHeight = laneHeight * 4;

        // --- Background Gfx ---
        // faint grid
        graphics.lineStyle(1, 0xffffff, 0.05);
        for (let x = 0; x < this.FINISH_LINE_X + 1000; x += 100) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, 1500); // Updated height
        }
        for (let y = 0; y < 1500; y += 100) {
            graphics.moveTo(0, y);
            graphics.lineTo(this.FINISH_LINE_X + 1000, y);
        }
        graphics.strokePath();

        // Track Surface (Dark)
        graphics.fillStyle(0x000000, 0.5);
        graphics.fillRect(0, startY, this.FINISH_LINE_X + 1000, totalHeight);

        // Lanes (Neon Glow)
        graphics.lineStyle(4, 0x00ffff, 0.2); // Faint Cyan
        for (let i = 0; i <= 4; i++) {
            const y = startY + (i * laneHeight);
            graphics.moveTo(0, y);
            graphics.lineTo(this.FINISH_LINE_X + 1000, y);
        }
        graphics.strokePath();

        // Finish Line (Holographic Checkers)
        graphics.fillStyle(0xffffff, 0.8);
        const checkSize = 30;
        for (let y = startY; y < startY + totalHeight; y += checkSize) {
            if ((y - startY) % (checkSize * 2) === 0) {
                graphics.fillRect(this.FINISH_LINE_X, y, checkSize, checkSize);
                graphics.fillRect(this.FINISH_LINE_X + checkSize, y + checkSize, checkSize, checkSize);
            } else {
                graphics.fillRect(this.FINISH_LINE_X + checkSize, y, checkSize, checkSize);
                graphics.fillRect(this.FINISH_LINE_X, y + checkSize, checkSize, checkSize);
            }
        }
        // Finish Line Glow
        graphics.lineStyle(10, 0xffffff, 0.3);
        graphics.moveTo(this.FINISH_LINE_X, startY);
        graphics.lineTo(this.FINISH_LINE_X, startY + totalHeight);
        graphics.strokePath();

        // Distance Markers (Neon Text)
        for (let m = 25; m < this.TRACK_LENGTH_METERS; m += 25) { // Less clutter
            const x = 100 + (m * this.PIXELS_PER_METER);
            this.add.text(x, startY + totalHeight + 30, `${m}m`, {
                fontSize: '24px',
                fill: '#00ffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Marker Line
            graphics.lineStyle(2, 0x00ffff, 0.1);
            graphics.moveTo(x, startY);
            graphics.lineTo(x, startY + totalHeight);
            graphics.strokePath();
        }
    }

    update(time, delta) {
        // Handle Start Sequence
        if (this.state === 'WAITING' && Phaser.Input.Keyboard.JustDown(this.startKey)) {
            this.startSequence();
        }

        // Timer Update
        if (this.isRacing) {
            const elapsed = (time - this.startTime) / 1000;
            this.events.emit('update-timer', elapsed.toFixed(2));
        }

        // Update Players
        let finishedCount = 0;

        this.players.forEach(p => {
            p.update(delta, time);

            // Check finish
            if (!p.finished && (100 + p.distance) >= this.FINISH_LINE_X) {
                p.finished = true;
                const finishTime = (time - this.startTime) / 1000;
                p.label.setText(`P${p.id} - ${finishTime.toFixed(2)} s`);
            }
            if (p.finished) finishedCount++;
        });

        // Removed Dynamic Camera to keep entire track visible

        if (this.isRacing && finishedCount === this.players.length) {
            this.state = 'FINISHED';
            this.isRacing = false;
            this.events.emit('update-status', 'RACE OVER\nPress SPACE to Reset');
        }

        if (this.state === 'FINISHED' && Phaser.Input.Keyboard.JustDown(this.startKey)) {
            this.scene.restart();
        }
    }

    startSequence() {
        this.state = 'READY';
        this.events.emit('update-status', 'READY');
        this.textToSpeech("Ready");

        this.time.delayedCall(1000, () => {
            this.state = 'SET';
            this.events.emit('update-status', 'SET');
            this.textToSpeech("Set");

            const randomDelay = Phaser.Math.FloatBetween(1000, 5000);
            this.time.delayedCall(randomDelay, () => {
                this.state = 'GO';
                this.events.emit('update-status', 'GO!');
                this.events.emit('hide-status');
                this.isRacing = true;
                this.startTime = this.time.now;
                this.playGunSound();
            });
        });
    }

    playGunSound() {
        // Simple oscillator based 'gunshot'
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 0.1);

        gain.gain.setValueAtTime(1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
    }

    textToSpeech(text) {
        if ('speechSynthesis' in window) {
            const utterThis = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterThis);
        }
    }
}
