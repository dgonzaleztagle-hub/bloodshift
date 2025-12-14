import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Cargar sprites con fondo transparente
        this.load.image('criminal', '/criminal_transparent.png');
        this.load.image('police', '/police_transparent.png');
        this.load.image('wall', '/wall.png');

        // Cargar sonidos
        this.load.audio('berserker_roar', '/gruñido.mp3');
    }

    create() {
        // Debug: verificar que el audio se cargó
        console.log('Audio cargado:', this.cache.audio.exists('berserker_roar'));
        this.scene.start('MenuScene');
    }
}
