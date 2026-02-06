import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader';
import { GameScene } from './scenes/GameScene';
import { MainMenu } from './scenes/MainMenu';
import { SettingsScene } from './scenes/SettingsScene';
import { UIScene } from './scenes/UIScene';

import { SetupScene } from './scenes/SetupScene';

const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'app', // Ensure this ID exists in index.html
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [Preloader, MainMenu, SetupScene, SettingsScene, GameScene, UIScene]
};

export default new Phaser.Game(config);
