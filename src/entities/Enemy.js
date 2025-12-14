import Phaser from 'phaser';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'police');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.health = 100;
        this.speed = 80;
        this.attackRange = 200;
        this.isChasing = false;
        this.frustrationLevel = 0;
        this.isEnraged = false;

        // Bullet Time / Esquiva
        this.isDodging = false;
        this.dodgeCooldown = 0;
        this.hasUsedDodge = false;
        this.berserkerLevel = 1;
        this.baseSpeed = 80;

        this.setCollideWorldBounds(true);

        // Ajustar tamaño del sprite
        this.setScale(0.05);

        // Movimiento aleatorio inicial
        this.changeDirection();
        this.directionTimer = 0;
    }

    update(player) {
        if (!player || !player.active) return;

        // Forzar límites manualmente
        const margin = 8;
        if (this.x < margin) this.x = margin;
        if (this.x > 800 - margin) this.x = 800 - margin;
        if (this.y < margin) this.y = margin;
        if (this.y > 600 - margin) this.y = 600 - margin;

        // Calcular distancia al jugador
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            player.x, player.y
        );

        // === BULLET TIME: Detectar balas cercanas ===
        if (!this.isDodging && this.dodgeCooldown <= 0) {
            const nearbyBullets = this.detectNearbyBullets();
            if (nearbyBullets.length > 0) {
                this.attemptDodge();
            }
        }

        // Reducir cooldown
        if (this.dodgeCooldown > 0) {
            this.dodgeCooldown -= this.scene.game.loop.delta;
        }

        // Determinar si está persiguiendo
        const shouldChase = distance < this.attackRange;

        // Si está cerca, perseguir al jugador
        if (shouldChase) {
            // Detectar si está atascado durante persecución
            if (!this.chaseLastPos) {
                this.chaseLastPos = { x: this.x, y: this.y };
                this.chaseStuckTimer = 0;
            }

            this.chaseStuckTimer += this.scene.game.loop.delta;

            if (this.chaseStuckTimer > 300) {
                const moved = Math.abs(this.x - this.chaseLastPos.x) > 10 ||
                    Math.abs(this.y - this.chaseLastPos.y) > 10;

                // Detectar bloqueo físico
                const isBlocked = this.body.blocked.up || this.body.blocked.down ||
                    this.body.blocked.left || this.body.blocked.right;

                if (isBlocked) {
                    // AUMENTAR FRUSTRACIÓN solo cuando está bloqueado físicamente
                    this.frustrationLevel += 300;

                    // ADVERTENCIAS SONORAS
                    if (this.frustrationLevel === 1500 && this.scene.soundManager) {
                        this.scene.soundManager.playHit(); // Primera advertencia
                    } else if (this.frustrationLevel === 3000 && this.scene.soundManager) {
                        this.scene.soundManager.playBerserkerRoar(); // GRUÑIDO a los 3s (advertencia final)
                    }

                    // Si lleva más de 4 segundos bloqueado → MODO BERSERKER
                    if (this.frustrationLevel > 4000 && !this.isEnraged) {
                        this.activateBerserkerMode(); // Solo visual (gruñido ya sonó a los 3s)
                    }

                    // Si está en modo berserker, destruir paredes CADA VEZ
                    if (this.isEnraged) {
                        this.destroyNearbyWalls();
                        this.scene.physics.moveToObject(this, player, this.speed * 2);
                    } else {
                        // Intentar escapar normalmente
                        let escapeAngle = 0;

                        if (this.body.blocked.left) {
                            escapeAngle = 0;
                        } else if (this.body.blocked.right) {
                            escapeAngle = Math.PI;
                        } else if (this.body.blocked.up) {
                            escapeAngle = Math.PI / 2;
                        } else if (this.body.blocked.down) {
                            escapeAngle = -Math.PI / 2;
                        }

                        escapeAngle += (Math.random() - 0.5) * 0.5;
                        const vel = this.scene.physics.velocityFromRotation(escapeAngle, this.speed * 1.5);
                        this.setVelocity(vel.x, vel.y);
                    }
                } else if (moved) {
                    // Se está moviendo libremente - reducir frustración
                    this.frustrationLevel = Math.max(0, this.frustrationLevel - 150);
                    this.scene.physics.moveToObject(this, player, this.isEnraged ? this.speed * 2 : this.speed);
                }

                this.chaseLastPos = { x: this.x, y: this.y };
                this.chaseStuckTimer = 0;
            } else {
                this.scene.physics.moveToObject(this, player, this.isEnraged ? this.speed * 2 : this.speed);
            }

            // Limitar velocidad máxima
            const maxSpeed = this.isEnraged ? this.speed * 2.5 : this.speed * 1.2;
            const currentSpeed = Math.sqrt(this.body.velocity.x ** 2 + this.body.velocity.y ** 2);
            if (currentSpeed > maxSpeed) {
                const scale = maxSpeed / currentSpeed;
                this.setVelocity(this.body.velocity.x * scale, this.body.velocity.y * scale);
            }
        } else {
            // Fuera de rango - resetear frustración y berserker
            this.frustrationLevel = 0;
            if (this.isEnraged) {
                this.deactivateBerserkerMode();
            }

            // Movimiento aleatorio
            this.directionTimer += this.scene.game.loop.delta;

            if (!this.lastPosition) {
                this.lastPosition = { x: this.x, y: this.y };
                this.stuckCheckTimer = 0;
            }

            this.stuckCheckTimer += this.scene.game.loop.delta;

            if (this.stuckCheckTimer > 500) {
                const moved = Math.abs(this.x - this.lastPosition.x) > 5 ||
                    Math.abs(this.y - this.lastPosition.y) > 5;

                if (!moved) {
                    this.changeDirection();
                }

                this.lastPosition = { x: this.x, y: this.y };
                this.stuckCheckTimer = 0;
            }

            if (this.directionTimer > 2000) {
                this.changeDirection();
                this.directionTimer = 0;
            }
        }
    }

    activateBerserkerMode() {
        this.isEnraged = true;


        // Solo efecto visual (gruñido ya sonó a los 3s)

        // Efecto visual - más grande y rojo brillante
        this.setTint(0xff6666); // Rojo muy brillante
        this.setScale(0.07); // Más grande
    }

    deactivateBerserkerMode() {
        this.isEnraged = false;
        this.clearTint();
        this.setScale(0.05); // Volver a tamaño normal
    }

    destroyNearbyWalls() {
        // Radio escala con nivel: nivel 1 = 35px, nivel 10+ = 60px
        const baseRadius = 35;
        const level = this.scene.currentLevel || 1;
        const searchRadius = Math.min(baseRadius + (level * 2.5), 60);
        const wallsToDestroy = [];

        // Buscar paredes cercanas
        this.scene.walls.children.entries.forEach(wall => {
            if (!wall.active) return;

            const dist = Phaser.Math.Distance.Between(this.x, this.y, wall.x, wall.y);
            if (dist < searchRadius) {
                wallsToDestroy.push(wall);
            }
        });

        // Destruir paredes encontradas
        wallsToDestroy.forEach(wall => {
            // Efecto visual
            this.scene.tweens.add({
                targets: wall,
                alpha: 0,
                scaleX: 2,
                scaleY: 2,
                duration: 150,
                onComplete: () => {
                    this.scene.walls.remove(wall, true, true); // Remover del grupo y destruir
                }
            });
        });
    }

    changeDirection() {
        const angle = Phaser.Math.Between(0, 360);
        const velocity = this.scene.physics.velocityFromAngle(angle, this.speed);
        this.setVelocity(velocity.x, velocity.y);
    }

    takeDamage(amount) {
        this.health -= amount;

        // Efecto visual de daño
        if (!this.isEnraged) {
            this.setTint(0xffffff);
            this.scene.time.delayedCall(100, () => {
                if (this.active) this.clearTint();
            });
        }

        // Knockback
        const angle = Phaser.Math.Angle.Between(
            this.scene.player.x, this.scene.player.y,
            this.x, this.y
        );
        const knockback = this.scene.physics.velocityFromAngle(
            Phaser.Math.RadToDeg(angle), 200
        );
        this.setVelocity(knockback.x, knockback.y);
    }

    // === BULLET TIME / ESQUIVA ===

    detectNearbyBullets() {
        const detectionRadius = 100;
        const nearbyBullets = [];

        if (!this.scene.bullets) return nearbyBullets;

        this.scene.bullets.children.entries.forEach(bullet => {
            if (!bullet.active) return;
            const dist = Phaser.Math.Distance.Between(this.x, this.y, bullet.x, bullet.y);
            if (dist < detectionRadius) {
                nearbyBullets.push(bullet);
            }
        });

        return nearbyBullets;
    }

    attemptDodge() {
        // No intentar si ya usó su esquiva
        if (this.hasUsedDodge) return false;

        // Cooldown
        if (this.dodgeCooldown > 0) return false;

        // Probabilidad según nivel
        const level = this.scene.currentLevel || 1;
        const attemptChance = Math.min(0.2 + (level * 0.05), 0.5);

        if (Math.random() < attemptChance) {
            this.startDodge();
            return true;
        }

        return false;
    }

    startDodge() {
        console.log('🎯 ENEMIGO INTENTANDO ESQUIVAR!');
        this.isDodging = true;
        this.hasUsedDodge = true; // Solo 1 vez por vida
        this.dodgeCooldown = 3000; // 3s cooldown

        // === SLOW MOTION COMPLETO ===
        this.scene.physics.world.timeScale = 3;
        console.log('⏱️ SLOW MOTION ACTIVADO');

        // Efecto visual: agacharse
        this.clearTint(); // Limpiar tints anteriores
        this.setScale(0.05, 0.025); // Achatado
        this.setTint(0xffff33); // Amarillo brillante (más visible)
        console.log('💛 Sprite achatado y amarillo');

        // 60% probabilidad de éxito
        const success = Math.random() < 0.6;

        // Después de 3 SEGUNDOS volver a normal
        this.scene.time.delayedCall(3000, () => {
            this.isDodging = false;

            // === DESACTIVAR SLOW MOTION ===
            this.scene.physics.world.timeScale = 1;
            console.log('⏱️ SLOW MOTION DESACTIVADO');

            if (success) {
                // ÉXITO - Activar Berserker x3
                this.activateBerserkerX3();
            } else {
                // FALLO - Volver a normal
                this.setScale(0.05);
                this.clearTint();
            }
        });
    }

    activateBerserkerX3() {
        console.log('🔥🔥🔥 BERSERKER X3 ACTIVADO!');
        this.isEnraged = true;
        this.berserkerLevel = 3;

        // Sonido de furia
        if (this.scene.soundManager) {
            this.scene.soundManager.playBerserkerRoar();
        }

        // Visual MÁS intenso que berserker normal
        this.setTint(0xff0000); // Rojo puro
        this.setScale(0.09); // Más grande

        // Velocidad x3
        this.speed = this.baseSpeed * 3;

        // Duración: 5 segundos
        this.scene.time.delayedCall(5000, () => {
            if (this.active) {
                this.deactivateBerserkerMode();
            }
        });
    }
}
