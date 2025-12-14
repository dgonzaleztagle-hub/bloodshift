import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'criminal');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.health = 100;
        this.speed = 200;
        this.shootCooldown = 0;
        this.shootDelay = 300; // milisegundos entre disparos

        this.setCollideWorldBounds(true);

        // Ajustar tamaño del sprite
        this.setScale(0.05); // Tamaño para pasar por cuadrícula de 40px

        // Crear textura de bala una sola vez
        if (!scene.textures.exists('bullet')) {
            const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xffff00);
            graphics.fillCircle(3, 3, 3);
            graphics.generateTexture('bullet', 6, 6);
            graphics.destroy();
        }
    }

    update(cursors, spaceKey, bulletsGroup) {
        // Movimiento
        this.setVelocity(0);

        if (cursors.left.isDown) {
            this.setVelocityX(-this.speed);
        } else if (cursors.right.isDown) {
            this.setVelocityX(this.speed);
        }

        if (cursors.up.isDown) {
            this.setVelocityY(-this.speed);
        } else if (cursors.down.isDown) {
            this.setVelocityY(this.speed);
        }

        // Disparo
        if (spaceKey.isDown && this.shootCooldown <= 0) {
            this.shoot(bulletsGroup);
            this.shootCooldown = this.shootDelay;
        }

        if (this.shootCooldown > 0) {
            this.shootCooldown -= this.scene.game.loop.delta;
        }
    }

    shoot(bulletsGroup) {
        // Crear bala usando el grupo (esto asegura que tenga física)
        const bullet = bulletsGroup.create(this.x, this.y - 20, 'bullet');
        bullet.setVelocityY(-600);
        bullet.body.setAllowGravity(false);

        // TRAIL (estela) para efecto visual
        bullet.trail = [];
        bullet.maxTrailLength = 8; // Longitud de la estela

        // Sonido de disparo
        if (this.scene.soundManager) {
            this.scene.soundManager.playShoot();
        }

        // Destruir cuando sale de pantalla
        this.scene.time.delayedCall(1500, () => {
            if (bullet && bullet.active) {
                // Limpiar trail
                if (bullet.trail) {
                    bullet.trail.forEach(t => t.destroy());
                }
                bullet.destroy();
            }
        });
    }

    takeDamage(amount) {
        this.health -= amount;

        // Efecto visual de daño
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });
    }
}
