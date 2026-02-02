export class SettingsScene extends Phaser.Scene {
    constructor() {
        super('SettingsScene');
    }

    create() {
        const { width, height } = this.scale;
        const currentCount = this.registry.get('playerCount');

        this.add.text(width / 2, 100, 'SETTINGS', {
            fontSize: '64px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, 250, 'PLAYER COUNT', {
            fontSize: '32px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        // Player Count Buttons
        for (let i = 1; i <= 4; i++) {
            const isSelected = i === currentCount;
            const color = isSelected ? '#00ff00' : '#ffffff';
            const size = isSelected ? '48px' : '32px';

            const btn = this.add.text((width / 2) + ((i - 2.5) * 100), 350, `${i}`, {
                fontSize: size,
                fill: color
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    this.registry.set('playerCount', i);
                    this.scene.restart(); // Refresh to update UI
                });
        }

        // Back Button
        const backBtn = this.add.text(width / 2, 600, 'BACK', {
            fontSize: '32px',
            fill: '#ffffff',
            backgroundColor: '#000'
        })
            .setPadding(15)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('MainMenu'));
    }
}
