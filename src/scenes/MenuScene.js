import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Título
        this.add.text(width / 2, height / 3, 'SECTOR-9', {
            fontSize: '64px',
            fontFamily: 'Courier New',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Subtítulo
        this.add.text(width / 2, height / 2, 'PROTOCOLO DE EMERGENCIA ACTIVO', {
            fontSize: '20px',
            fontFamily: 'Courier New',
            color: '#ff0000'
        }).setOrigin(0.5);

        // Instrucción
        const startText = this.add.text(width / 2, height / 1.5, 'INICIAR TURNO', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#ff0000'
        }).setOrigin(0.5);

        // Efecto de parpadeo
        this.tweens.add({
            targets: startText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Controles
        this.add.text(width / 2, height - 100, 'FLECHAS: MOVER | ESPACIO: DISPARAR', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#880000'
        }).setOrigin(0.5);

        // Iniciar con cualquier tecla
        this.input.keyboard.once('keydown', () => {
            this.scene.start('GameScene');
        });
    }
}
