import { Countries } from '../config/Countries';
import { Player } from '../objects/Player';

export class SetupScene extends Phaser.Scene {
    constructor() {
        super('SetupScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#10102a');
        const { width, height } = this.scale;

        // Title
        this.add.text(width / 2, 50, 'SELECT TEAMS', {
            fontSize: '64px',
            fontStyle: 'bold',
            fill: '#ffffff',
            stroke: '#00ffff',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(width / 2, 110, 'Press Boost Key to Join / Start', {
            fontSize: '24px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        // Grid for 4 Players
        this.players = [];
        this.maxPlayers = 4;

        // Define controls for selection
        // Keys to cycle Left/Right and Join/Ready (Boost)
        this.controls = [
            { id: 1, left: 'LEFT', right: 'RIGHT', join: 'UP', color: 0xff0055 },
            { id: 2, left: 'ONE', right: 'TWO', join: 'THREE', color: 0x00ff00 },
            { id: 3, left: 'V', right: 'B', join: 'N', color: 0x00ffff },
            { id: 4, left: 'NINE', right: 'ZERO', join: 'QUOTES', color: 0xffff00 }
        ];

        // State for each player slot
        // { active: false, countryIndex: 0, ready: false }
        this.slots = this.controls.map(c => ({
            active: false,
            countryIndex: 0,
            ready: false,
            config: c
        }));

        // Activate P1 and P2 by default for easy playing
        this.slots[0].active = true;
        this.slots[1].active = true;

        this.previewContainers = [];

        // Create UI for 4 slots
        const startX = 140;
        const gapX = 250;

        this.slots.forEach((slot, index) => {
            const x = startX + (index * gapX);
            const y = height / 2;

            const container = this.add.container(x, y);
            this.previewContainers.push(container);

            // Background Card
            const bg = this.add.rectangle(0, 0, 230, 400, 0x000000, 0.5).setStrokeStyle(4, 0x555555);
            container.add(bg);
            slot.bg = bg;

            // Labels
            const pLabel = this.add.text(0, -160, `P${slot.config.id}`, { fontSize: '32px', fontStyle: 'bold' }).setOrigin(0.5);
            container.add(pLabel);

            // Country Name
            const cName = this.add.text(0, 140, '...', { fontSize: '24px', fontStyle: 'bold' }).setOrigin(0.5);
            container.add(cName);
            slot.cNameText = cName;

            // Status (Join / Ready)
            const status = this.add.text(0, 180, 'OFFLINE', { fontSize: '20px', fill: '#555' }).setOrigin(0.5);
            container.add(status);
            slot.statusText = status;

            // Preview Dummy (visual)
            const kitPreview = this.add.container(0, -20);

            // Shirt
            const shirt = this.add.rectangle(0, 0, 80, 60, 0xffffff).setOrigin(0.5, 0); // Upper body
            const shorts = this.add.rectangle(0, 60, 80, 40, 0xffffff).setOrigin(0.5, 0); // Lower body
            // Head & Eyes (Side view)
            const headContainer = this.add.container(0, -40);
            const headShape = this.add.circle(0, 0, 30, 0xffccaa).setStrokeStyle(2, 0xffffff);

            // Single Eye looking right
            const eye = this.add.circle(15, -5, 6, 0xffffff);
            const pupil = this.add.circle(18, -5, 3, 0x000000);

            headContainer.add([headShape, eye, pupil]);

            const head = headContainer; // logic uses 'head' variable
            const badge = this.add.circle(0, 30, 15, 0x000000).setStrokeStyle(2, 0xffffff); // Center of shirt (0 + height/2)

            kitPreview.add([shirt, shorts, badge, head]);
            container.add(kitPreview);

            slot.preview = { shirt, shorts, badge, head, container: kitPreview };

            this.updateSlotVisuals(index);
        });

        // Input Handling
        this.input.keyboard.on('keydown', (event) => {
            this.handleInput(event);
        });

        // Start Race with Space
        this.input.keyboard.on('keydown-SPACE', () => {
            this.forceStart();
        });
    }

    handleInput(event) {
        // Map Keys
        this.slots.forEach((slot, index) => {
            const keys = slot.config;
            const leftKey = Phaser.Input.Keyboard.KeyCodes[keys.left];
            const rightKey = Phaser.Input.Keyboard.KeyCodes[keys.right];
            const joinKey = Phaser.Input.Keyboard.KeyCodes[keys.join]; // Boost is Join/Ready

            if (event.keyCode === joinKey) {
                if (!slot.active) {
                    slot.active = true;
                } else {
                    // Toggle Ready
                    slot.ready = !slot.ready;
                }
                this.updateSlotVisuals(index);
                // Removed checkStart() call here since we want explicit start or space
            }

            if (slot.active) { // Removed !slot.ready check so you can change team even if ready
                if (event.keyCode === leftKey) {
                    slot.countryIndex--;
                    if (slot.countryIndex < 0) slot.countryIndex = Countries.length - 1;
                    this.updateSlotVisuals(index);
                } else if (event.keyCode === rightKey) {
                    slot.countryIndex++;
                    if (slot.countryIndex >= Countries.length) slot.countryIndex = 0;
                    this.updateSlotVisuals(index);
                }
            }
        });
    }

    updateSlotVisuals(index) {
        const slot = this.slots[index];
        const country = Countries[slot.countryIndex];

        if (!slot.active) {
            slot.bg.setStrokeStyle(4, 0x333333);
            slot.preview.container.setVisible(false);
            slot.cNameText.setText("PRESS BOOST");
            slot.statusText.setText("TO JOIN");
            slot.statusText.setColor('#555555');
            return;
        }

        slot.preview.container.setVisible(true);

        // Update Standard Kit Colors
        slot.preview.shirt.setFillStyle(country.colors.primary);
        slot.preview.shorts.setFillStyle(country.colors.secondary);

        // Re-create Badge based on Country
        if (slot.preview.badge) slot.preview.badge.destroy();

        if (country.code === 'GER') {
            // German Flag Overlay (Black/Red/Yellow stripes) covering the shirt
            // Shirt is 80x60. Stripes are 20px high.
            // Anchor is top-center (0,0) for shirt? No, shirt is (0,0) Origin(0.5, 0).
            // Shirt coords in kitPreview are (0,0). So top-left is (-40, 0).
            const w = 80;
            const h = 20;

            const top = this.add.rectangle(0, 10, w, h, 0x000000);
            const mid = this.add.rectangle(0, 30, w, h, 0xDD0000);
            const bot = this.add.rectangle(0, 50, w, h, 0xFFCE00);

            slot.preview.badge = this.add.container(0, 0, [top, mid, bot]);
            slot.preview.container.add(slot.preview.badge);
            // Ensure badge is below head but above shirt
            // hierarchy: shirt(0), shorts(1), badge(2), head(3)
            slot.preview.container.moveBelow(slot.preview.badge, slot.preview.head);

        } else if (country.code === 'USA') {
            // Stars
            const stars = this.add.container(0, 30); // Center of shirt
            const s1 = this.add.text(-20, -10, '★', { fontSize: '20px', fill: '#ffffff' }).setOrigin(0.5);
            const s2 = this.add.text(20, -10, '★', { fontSize: '20px', fill: '#ffffff' }).setOrigin(0.5);
            const s3 = this.add.text(0, 15, '★', { fontSize: '20px', fill: '#ffffff' }).setOrigin(0.5);
            stars.add([s1, s2, s3]);

            slot.preview.badge = stars;
            slot.preview.container.add(stars);
            slot.preview.container.moveBelow(stars, slot.preview.head);

        } else if (country.code === 'SUI') {
            // Cross
            const badgeColor = 0xffffff;
            const cross = this.add.container(0, 30); // Center of shirt
            const vBar = this.add.rectangle(0, 0, 12, 36, badgeColor);
            const hBar = this.add.rectangle(0, 0, 36, 12, badgeColor);
            cross.add([vBar, hBar]);

            slot.preview.badge = cross;
            slot.preview.container.add(cross);
            slot.preview.container.moveBelow(cross, slot.preview.head);

        } else {
            // Standard Badge
            const badgeColor = country.colors.badge !== undefined ? country.colors.badge : 0xffffff;
            slot.preview.badge = this.add.circle(0, 30, 15, badgeColor).setStrokeStyle(2, 0xffffff); // Center of shirt height (0 to 60) is 30
            slot.preview.container.add(slot.preview.badge);
            slot.preview.container.moveBelow(slot.preview.badge, slot.preview.head);
        }


        slot.cNameText.setText(country.name); // Using Name "USA", "Jamaica"

        if (slot.ready) {
            slot.bg.setStrokeStyle(6, 0x00ff00);
            slot.statusText.setText("READY!");
            slot.statusText.setColor('#00ff00');
            slot.preview.container.setAlpha(1);
        } else {
            slot.bg.setStrokeStyle(4, 0xffffff);
            slot.statusText.setText("SELECT TEAM");
            slot.statusText.setColor('#ffff00');
            slot.preview.container.setAlpha(0.8);
        }
    }

    forceStart() {
        const activeSlots = this.slots.filter(s => s.active);
        if (activeSlots.length > 0) {
            // ALL READY -> START
            this.add.text(this.scale.width / 2, this.scale.height - 100, "STARTING...", {
                fontSize: '48px', fill: '#fff'
            }).setOrigin(0.5);

            this.time.delayedCall(1000, () => {
                this.scene.start('GameScene', {
                    playerData: activeSlots.map(s => ({
                        id: s.config.id,
                        countryIndex: s.countryIndex, // Pass index or full data
                        keys: s.config // Pass control config? No, GameScene has it.
                    }))
                });
            });
        }
    }
}
