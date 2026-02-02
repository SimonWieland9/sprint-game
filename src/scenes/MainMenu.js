export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;

        this.add.text(width / 2, 150, '100m SPRINT', {
            fontSize: '84px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Start Button
        const startBtn = this.add.text(width / 2, 400, 'START RACE', {
            fontSize: '48px',
            fill: '#00ff00',
            backgroundColor: '#000'
        })
            .setPadding(20)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                console.log('MainMenu: Start Race clicked');
                this.scene.stop('MainMenu');
                this.scene.start('GameScene');
            })
            .on('pointerover', () => startBtn.setStyle({ fill: '#fff' }))
            .on('pointerout', () => startBtn.setStyle({ fill: '#00ff00' }));

        // Settings Button
        const settingsBtn = this.add.text(width / 2, 550, 'SETTINGS', {
            fontSize: '32px',
            fill: '#aaaaaa',
            backgroundColor: '#000'
        })
            .setPadding(15)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('SettingsScene'))
            .on('pointerover', () => settingsBtn.setStyle({ fill: '#fff' }))
            .on('pointerout', () => settingsBtn.setStyle({ fill: '#aaaaaa' }));

        // Initialize default settings if not exists
        if (this.registry.get('playerCount') === undefined) {
            this.registry.set('playerCount', 2); // Default to 2 players
        }
    }
}
