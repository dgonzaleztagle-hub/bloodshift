import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import SoundManager from '../utils/SoundManager.js';
import LevelGenerator from '../utils/LevelGenerator.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.currentLevel = 1;
        this.levelGenerator = new LevelGenerator();
    }

    create() {
        const { width, height } = this.cameras.main;

        // Inicializar sistema de sonido
        this.soundManager = new SoundManager(this);

        // Texto de inicio de nivel
        const levelText = this.add.text(width / 2, height / 2, 'TURNO 1\nSOBREVIVE.', {
            fontSize: '32px',
            fontFamily: 'Courier New',
            color: '#ff0000',
            align: 'center'
        }).setOrigin(0.5);

        // Desaparecer después de 2 segundos
        this.time.delayedCall(2000, () => {
            levelText.destroy();
            this.startGame();
        });
    }

    startGame() {
        // Generar nivel
        const levelData = this.levelGenerator.generate(this.currentLevel);

        // Grupos
        this.bullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.walls = this.physics.add.staticGroup();
        this.portals = [];

        // Crear paredes del nivel
        this.createWalls(levelData.grid);

        // Crear portales
        this.createPortals(levelData.portals);

        // Crear jugador
        this.player = new Player(this, 400, 550);

        // Crear enemigos
        this.spawnEnemies(levelData.enemyCount);

        // Colisiones
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.bullets, this.walls, (bullet) => bullet.destroy());

        // UI
        this.createUI();

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    createWalls(grid) {
        const tileSize = 40;

        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x] === 1) {
                    // Usar sprite de pared cyberpunk
                    const wall = this.add.image(
                        x * tileSize + tileSize / 2,
                        y * tileSize + tileSize / 2,
                        'wall'
                    );
                    wall.setDisplaySize(tileSize, tileSize);
                    this.walls.add(wall);
                }
            }
        }
    }

    createPortals(portalData) {
        portalData.forEach(portal => {
            // Portal 1
            const p1 = this.add.circle(portal.x1, portal.y1, 15, portal.color, 0.7);
            // Portal 2
            const p2 = this.add.circle(portal.x2, portal.y2, 15, portal.color, 0.7);

            // Efecto de pulso
            this.tweens.add({
                targets: [p1, p2],
                alpha: 0.3,
                scale: 1.2,
                duration: 1000,
                yoyo: true,
                repeat: -1
            });

            this.portals.push({ x1: portal.x1, y1: portal.y1, x2: portal.x2, y2: portal.y2 });
        });
    }

    spawnEnemies(count) {
        // Crear enemigos en posiciones aleatorias
        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(50, 750);
            const y = Phaser.Math.Between(50, 200);
            const enemy = new Enemy(this, x, y);
            this.enemies.add(enemy);

            // Darles movimiento inmediato en dirección aleatoria
            const angle = Phaser.Math.Between(0, 360);
            const velocity = this.physics.velocityFromAngle(angle, 80);
            enemy.setVelocity(velocity.x, velocity.y);
        }
    }

    createUI() {
        // Nivel actual
        this.levelText = this.add.text(16, 16, `TURNO: ${this.currentLevel}`, {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#ff0000'
        });

        // Barra de vida
        this.healthText = this.add.text(16, 40, 'VIDA: 100', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#ff0000'
        });

        // Contador de enemigos
        this.enemyText = this.add.text(16, 64, 'AMENAZAS: 5', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#ff0000'
        });
    }

    hitEnemy(bullet, enemy) {
        // Si el enemigo está esquivando, la bala pasa sin daño
        if (enemy.isDodging) {
            console.log('💨 Esquiva en progreso - bala ignorada');
            return; // No destruir bala ni hacer daño
        }

        bullet.destroy();
        enemy.takeDamage(50); // 2 disparos para matar

        // Sonido de impacto
        this.soundManager.playHit();

        if (enemy.health <= 0) {
            enemy.destroy();
            this.updateEnemyCount();

            // Sonido de muerte
            this.soundManager.playEnemyDeath();

            // Victoria si no quedan enemigos
            if (this.enemies.countActive() === 0) {
                this.gameWin();
            }
        }
    }

    hitPlayer(player, enemy) {
        player.takeDamage(10);
        this.healthText.setText('VIDA: ' + player.health);

        // Sonido de daño
        this.soundManager.playPlayerHit();

        // Efecto de daño
        this.cameras.main.shake(100, 0.005);

        if (player.health <= 0) {
            this.gameOver();
        }
    }

    updateEnemyCount() {
        this.enemyText.setText('AMENAZAS: ' + this.enemies.countActive());
    }

    gameOver() {
        this.physics.pause();

        // Sonido de derrota
        this.soundManager.playDefeat();

        const { width, height } = this.cameras.main;
        this.add.text(width / 2, height / 2, 'TURNO FALLIDO\nREEMPLAZO EN CAMINO', {
            fontSize: '32px',
            fontFamily: 'Courier New',
            color: '#ff0000',
            align: 'center'
        }).setOrigin(0.5);

        this.time.delayedCall(3000, () => {
            this.scene.start('MenuScene');
        });
    }

    gameWin() {
        this.physics.pause();

        // Sonido de victoria
        this.soundManager.playVictory();

        // Incrementar nivel
        this.currentLevel++;

        const { width, height } = this.cameras.main;
        const levelText = this.add.text(width / 2, height / 2,
            `TURNO ${this.currentLevel - 1} COMPLETADO\n\nPREPARANDO TURNO ${this.currentLevel}...`, {
            fontSize: '28px',
            fontFamily: 'Courier New',
            color: '#ff0000',
            align: 'center'
        }).setOrigin(0.5);

        this.time.delayedCall(2500, () => {
            // Limpiar escena
            levelText.destroy();
            this.bullets.clear(true, true);
            this.enemies.clear(true, true);
            this.walls.clear(true, true);
            this.children.removeAll();

            // Reiniciar física
            this.physics.resume();

            // Recrear UI base
            this.soundManager = new SoundManager(this);

            // Texto de inicio de nivel
            const newLevelText = this.add.text(width / 2, height / 2,
                `TURNO ${this.currentLevel}\nSOBREVIVE.`, {
                fontSize: '32px',
                fontFamily: 'Courier New',
                color: '#ff0000',
                align: 'center'
            }).setOrigin(0.5);

            this.time.delayedCall(2000, () => {
                newLevelText.destroy();
                this.startGame();
            });
        });
    }

    update() {
        if (this.player && this.player.active) {
            this.player.update(this.cursors, this.spaceKey, this.bullets);

            // Verificar portales
            this.checkPortals();
        }

        // Actualizar enemigos
        if (this.enemies && this.enemies.children) {
            this.enemies.children.entries.forEach(enemy => {
                if (enemy.active && this.player && this.player.active) {
                    enemy.update(this.player);
                }
            });
        }

        // === TRAILS DE BALAS ===
        if (this.bullets && this.bullets.children) {
            this.bullets.children.entries.forEach(bullet => {
                if (!bullet.active) {
                    // Limpiar trails de balas destruidas
                    if (bullet.trail) {
                        bullet.trail.forEach(t => t.destroy());
                    }
                    return;
                }

                // Crear trail point
                const trailPoint = this.add.circle(bullet.x, bullet.y, 3, 0xff0000, 0.6);

                // Agregar a trail array
                if (!bullet.trail) bullet.trail = [];
                bullet.trail.push(trailPoint);

                // Limitar longitud del trail
                if (bullet.trail.length > bullet.maxTrailLength) {
                    const old = bullet.trail.shift();
                    old.destroy();
                }

                // Fade out gradual
                bullet.trail.forEach((point, index) => {
                    point.alpha = (index / bullet.trail.length) * 0.6;
                });
            });
        }
    }

    checkPortals() {
        if (!this.portals || this.portals.length === 0) return;

        // Cooldown para evitar teleportación infinita
        if (!this.portalCooldown) this.portalCooldown = 0;
        if (this.portalCooldown > 0) {
            this.portalCooldown -= this.game.loop.delta;
            return;
        }

        this.portals.forEach(portal => {
            const dist1 = Phaser.Math.Distance.Between(this.player.x, this.player.y, portal.x1, portal.y1);
            const dist2 = Phaser.Math.Distance.Between(this.player.x, this.player.y, portal.x2, portal.y2);

            if (dist1 < 20) {
                this.player.setPosition(portal.x2, portal.y2);
                this.soundManager.playShoot(); // Sonido de teleport
                this.portalCooldown = 500; // 500ms de cooldown
            } else if (dist2 < 20) {
                this.player.setPosition(portal.x1, portal.y1);
                this.soundManager.playShoot(); // Sonido de teleport
                this.portalCooldown = 500; // 500ms de cooldown
            }
        });
    }
}
