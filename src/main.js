import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';

// === RESPONSIVE: Detectar tamaño de pantalla ===
const isMobile = window.innerWidth < 768; // Móvil si ancho < 768px
const gameWidth = isMobile ? 360 : 800;
const gameHeight = isMobile ? 640 : 600;

// Guardar en window para acceso global
window.GAME_CONFIG = {
    isMobile,
    width: gameWidth,
    height: gameHeight
};

const config = {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight,
    parent: 'game-container',
    backgroundColor: '#000000',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT, // Escalar para ajustar a pantalla
        autoCenter: Phaser.Scale.CENTER_BOTH // Centrar
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene]
};

const game = new Phaser.Game(config);
