export class Player {
    constructor(scene, id, config) {
        this.scene = scene;
        this.id = id;
        this.keys = config.keys;
        this.color = config.color;
        this.x = config.x;
        this.y = config.y;

        // Game constants
        this.MAX_SPEED = 350; // Increased significantly (was 200) for faster races
        this.ACCELERATION_RATE = 0.1;
        this.DECEL_RATE = 0.05;
        this.STUMBLE_PENALTY = 0.75;

        // State
        this.speed = 0;
        this.targetSpeed = 0;
        this.distance = 0;
        this.rank = null;
        this.finished = false;
        this.nextKeyIndex = 0;
        this.tapTimestamps = [];
        this.isFalseStart = false;

        // Visuals
        this.container = this.scene.add.container(this.x, this.y);

        // --- ARCADE SPRITE SETUP ---
        // Colors
        const skinColor = 0xffccaa;
        const strokeColor = 0xffffff;

        // Dimensions
        const bodyW = 50, bodyH = 80;
        const limbW = 15, limbH = 40;
        const headR = 25;

        // Create Limbs (Anchored at top)
        // Groups for Z-ordering: [Left Arm, Left Leg] (Back) -> [Body, Head] -> [Right Leg, Right Arm] (Front)
        // Actually, typical run cycle: Opposites.

        // 1. Left Leg (Back)
        this.leftLeg = this.scene.add.rectangle(0, 30, limbW, limbH, this.color).setOrigin(0.5, 0);
        this.leftLeg.setStrokeStyle(2, strokeColor);

        // 2. Left Arm (Back)
        this.leftArm = this.scene.add.rectangle(0, -30, limbW, limbH, skinColor).setOrigin(0.5, 0);
        this.leftArm.setStrokeStyle(2, strokeColor);

        // 3. Body
        this.bodySprite = this.scene.add.rectangle(0, 0, bodyW, bodyH, this.color).setOrigin(0.5, 0.5);
        this.bodySprite.setStrokeStyle(4, strokeColor);

        // 4. Head
        this.head = this.scene.add.circle(0, -55, headR, skinColor);
        this.head.setStrokeStyle(2, strokeColor);

        // 5. Right Leg (Front)
        this.rightLeg = this.scene.add.rectangle(0, 30, limbW, limbH, this.color).setOrigin(0.5, 0);
        this.rightLeg.setStrokeStyle(2, strokeColor);

        // 6. Right Arm (Front)
        this.rightArm = this.scene.add.rectangle(0, -30, limbW, limbH, skinColor).setOrigin(0.5, 0);
        this.rightArm.setStrokeStyle(2, strokeColor);

        // Label
        this.label = this.scene.add.text(-60, -110, `P${this.id}`, {
            fontSize: '32px',
            fontStyle: 'bold',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.container.add([
            this.leftLeg, this.leftArm,
            this.bodySprite, this.head,
            this.rightLeg, this.rightArm,
            this.label
        ]);

        // Input setup
        this.validKeys = [
            this.scene.input.keyboard.addKey(this.keys[0]),
            this.scene.input.keyboard.addKey(this.keys[1])
        ];

        // Boost Key
        if (config.boostKey) {
            this.boostKeyInfo = this.scene.input.keyboard.addKey(config.boostKey);
            this.boostKeyInfo.on('down', () => this.activateBoost());
        }

        this.validKeys.forEach((key, index) => {
            key.on('down', () => this.handleInput(index));
        });
    }

    activateBoost() {
        if (this.finished || !this.scene.isRacing) return;
        if (this.boostUsed || this.isBoosting || this.isBurnout) return;

        this.isBoosting = true;
        this.boostUsed = true;
        this.boostStartTime = this.scene.time.now;

        // Visual cue
        this.label.setColor('#00ffff');
        this.label.setText('BOOST!');
    }

    handleInput(keyIndex) {
        // Handle False Start
        if (this.scene.state === 'SET') {
            this.triggerFalseStart();
            return;
        }

        if (this.finished || !this.scene.isRacing) return;

        if (this.isFalseStart) return;
        if (this.isBurnout) return;

        const now = this.scene.time.now;

        if (keyIndex === this.nextKeyIndex) {
            this.tapTimestamps.push(now);
            this.tapTimestamps = this.tapTimestamps.filter(t => now - t < 1000);
            this.nextKeyIndex = 1 - this.nextKeyIndex;

            // Reaction Boost (First step)
            if (!this.stepsTaken) {
                this.stepsTaken = 0;
            }
            if (this.stepsTaken === 0) {
                const reactionTime = now - this.scene.startTime;

                let boostFactor = 0;
                let text = '';
                let color = '#ffffff';

                if (reactionTime < 100) {
                    boostFactor = 1.0; // 100% Speed
                    text = 'PERFECT!';
                    color = '#00ffff';
                } else if (reactionTime < 200) {
                    boostFactor = 0.8; // 80% Speed
                    text = 'GREAT!';
                    color = '#00ff00';
                } else if (reactionTime < 300) {
                    boostFactor = 0.6; // 60% Speed
                    text = 'GOOD!';
                    color = '#ffff00';
                }

                if (boostFactor > 0) {
                    this.speed = this.MAX_SPEED * boostFactor;
                    this.targetSpeed = this.speed;
                    this.label.setText(text);
                    this.label.setColor(color);

                    // Reset label after 1s
                    this.scene.time.delayedCall(1000, () => {
                        if (!this.finished && !this.isBoosting && !this.isBurnout) {
                            this.label.setText(`P${this.id}`);
                            this.label.setColor('#ffffff');
                        }
                    });
                }
            }
            this.stepsTaken++;

        } else {
            this.speed *= this.STUMBLE_PENALTY;
            this.targetSpeed *= this.STUMBLE_PENALTY;
            this.scene.cameras.main.shake(100, 0.005);
            this.tapTimestamps = [];
        }
    }

    triggerFalseStart() {
        if (this.isFalseStart) return;
        this.isFalseStart = true;
        this.label.setText('FALSE\nSTART!');
        this.label.setColor('#ff0000');
    }

    update(delta, time) {
        if (this.finished) {
            // Stop animation check
            this.bodySprite.rotation = 0;
            return;
        }

        // Handle Boost Logic
        if (this.isBoosting) {
            const elapsed = time - this.boostStartTime;
            const duration = 2500; // 2.5s duration
            const peakSpeed = this.MAX_SPEED * 1.5; // Start at 150% speed

            if (elapsed > duration) {
                // Boost Over -> Burnout
                this.isBoosting = false;
                this.isBurnout = true;
                this.speed = 0;
                this.targetSpeed = 0;
                this.label.setText('BURNOUT');
                this.label.setColor('#555555');
            } else {
                // Decay Curve
                const progress = elapsed / duration;

                this.speed = peakSpeed * (1 - progress);

                if (this.speed > this.MAX_SPEED) {
                    this.label.setText('BOOST!');
                    this.label.setColor('#00ffff');
                } else {
                    this.label.setText('SLOWING');
                    this.label.setColor('#ffaa00');
                }
            }

            this.updatePhysicsAndAnim(delta, time);
            return;
        }

        // Handle Burnout (Standstill)
        if (this.isBurnout) {
            this.speed = 0;
            this.updatePhysicsAndAnim(delta, time); // To stop anim
            return;
        }

        // Handle False Start Penalty Release
        if (this.isFalseStart && this.scene.isRacing) {
            if (!this.penaltyEndTime) {
                this.penaltyEndTime = time + 1000;
            }
            if (time > this.penaltyEndTime) {
                this.isFalseStart = false;
                this.label.setText(`P${this.id}`);
                this.label.setColor('#ffffff');
            } else {
                return;
            }
        }

        // Calculate Target Speed based on TPS
        const now = this.scene.time.now;
        this.tapTimestamps = this.tapTimestamps.filter(t => now - t < 1000);

        const tps = this.tapTimestamps.length;
        const tpsFactor = Math.min(tps / 12, 1);

        this.targetSpeed = this.MAX_SPEED * tpsFactor;

        // Interpolate actual speed towards target
        if (this.speed < this.targetSpeed) {
            this.speed += (this.targetSpeed - this.speed) * this.ACCELERATION_RATE;
        } else {
            this.speed += (this.targetSpeed - this.speed) * this.DECEL_RATE;
        }

        // Hard cap
        if (this.speed > this.MAX_SPEED) this.speed = this.MAX_SPEED;

        this.updatePhysicsAndAnim(delta, time);
    }

    updatePhysicsAndAnim(delta, time) {
        // Update distance
        const moveStep = this.speed * (delta / 1000);
        this.distance += moveStep;
        this.container.x = 100 + this.distance;

        // --- ANIMATION LOGIC ---
        // Speed Factor: 0 to 1
        const speedRatio = Math.min(this.speed / this.MAX_SPEED, 1.5);

        if (speedRatio > 0.05) {
            // Running
            const freq = 0.02 * this.speed; // Frequency based on speed

            // Arm/Leg Swings (Opposite phases)
            // Left Leg: matches Right Arm
            // Right Leg: matches Left Arm

            // Standard Run Cycle:
            // Left Leg goes Forward (Rotation negative) when Right Leg goes Back (Rotation positive)

            const maxRot = 1.2; // Max rotation in radians (~70 degrees)
            const swing = Math.sin(time * freq) * maxRot;

            this.leftLeg.rotation = swing;
            this.rightLeg.rotation = -swing;

            this.leftArm.rotation = -swing;
            this.rightArm.rotation = swing;

            // Slight Body/Head Bob
            this.bodySprite.y = Math.abs(Math.cos(time * freq * 2)) * 5; // Bobs up and down twice per cycle
            this.head.y = -55 + this.bodySprite.y;
        } else {
            // Idle
            this.leftLeg.rotation = 0;
            this.rightLeg.rotation = 0;
            this.leftArm.rotation = 0;
            this.rightArm.rotation = 0;
            this.bodySprite.y = 0;
            this.head.y = -55;
        }
    }
}
