export class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }

    create() {
        console.log('UIScene: create started');
        const { width, height } = this.scale;

        // --- HUD Background ---
        const hudHeight = 80;
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.9);
        graphics.fillRect(0, 0, width, hudHeight);
        graphics.lineStyle(4, 0x00ffff, 1);
        graphics.moveTo(0, hudHeight);
        graphics.lineTo(width, hudHeight);
        graphics.strokePath();

        // --- Buttons ---
        // Menu Button (Top Left)
        const menuBtn = this.add.text(20, 20, ' MENU ', {
            fontSize: '28px',
            fill: '#00ffff',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            stroke: '#00ffff',
            strokeThickness: 2
        })
            .setPadding({ x: 10, y: 5 })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.scene.stop('GameScene');
                this.scene.start('MainMenu');
                this.scene.stop();
            })
            .on('pointerover', () => menuBtn.setStyle({ fill: '#ffffff', backgroundColor: '#00ffff', stroke: '#ffffff' }))
            .on('pointerout', () => menuBtn.setStyle({ fill: '#00ffff', backgroundColor: '#000000', stroke: '#00ffff' }));

        // Restart Button (Top Left - Next to Menu)
        const restartBtn = this.add.text(140, 20, ' RESTART ', {
            fontSize: '28px',
            fill: '#ff00ff',
            fontStyle: 'bold',
            backgroundColor: '#000000',
            stroke: '#ff00ff',
            strokeThickness: 2
        })
            .setPadding({ x: 10, y: 5 })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                const gameScene = this.scene.get('GameScene');
                gameScene.scene.restart();
            })
            .on('pointerover', () => restartBtn.setStyle({ fill: '#ffffff', backgroundColor: '#ff00ff', stroke: '#ffffff' }))
            .on('pointerout', () => restartBtn.setStyle({ fill: '#ff00ff', backgroundColor: '#000000', stroke: '#ff00ff' }));

        // --- Timer (Top Center) ---
        this.timerText = this.add.text(width / 2, 40, '0.00', {
            fontSize: '48px',
            fill: '#ffff00',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // --- Status Text (Centered in Screen - Below HUD) ---
        this.statusText = this.add.text(width / 2, height / 2, 'Press SPACE to Start', {
            fontSize: '80px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            shadow: { blur: 10, color: '#00ffff', fill: true }
        }).setOrigin(0.5);

        // --- Listen for events from GameScene ---
        const gameScene = this.scene.get('GameScene');

        gameScene.events.on('update-timer', (value) => {
            this.timerText.setText(value);
        });

        gameScene.events.on('update-status', (value) => {
            this.statusText.setText(value);
            this.statusText.setVisible(true);
        });

        gameScene.events.on('hide-status', () => {
            this.statusText.setVisible(false);
        });

        // Clean up on shutdown
        this.events.on('shutdown', () => {
            gameScene.events.off('update-timer');
            gameScene.events.off('update-status');
            gameScene.events.off('hide-status');
        });
        console.log('UIScene: create finished');
    }
}
