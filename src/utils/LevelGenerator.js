export default class LevelGenerator {
    constructor(width = 800, height = 600, tileSize = 40) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.cols = Math.floor(width / tileSize);
        this.rows = Math.floor(height / tileSize);
    }

    generate(level = 1) {
        // Crear grid vacío
        const grid = this.createEmptyGrid();

        // Progresión controlada de dificultad
        // Nivel 1: Sin paredes (tutorial)
        // Nivel 2-3: Pocas paredes (15%)
        // Nivel 4-6: Paredes medias (20-25%)
        // Nivel 7+: Paredes altas (30% max)
        let wallDensity = 0;
        if (level === 1) {
            wallDensity = 0.12; // Empezar con paredes desde nivel 1 (antes era 0)
        } else if (level <= 3) {
            wallDensity = 0.12 + (level - 2) * 0.03; // 12-15%
        } else if (level <= 6) {
            wallDensity = 0.18 + (level - 4) * 0.03; // 18-24%
        } else {
            wallDensity = Math.min(0.25 + (level - 7) * 0.01, 0.32); // 25-32% max
        }

        // Colocar paredes aleatorias solo si hay densidad
        if (wallDensity > 0) {
            this.placeRandomWalls(grid, wallDensity);
        }

        // Limpiar spawn areas
        this.clearSpawnAreas(grid);

        // Crear portales (desde nivel 2, incrementando cantidad)
        const portalCount = level >= 2 ? Math.min(Math.floor((level - 1) / 2), 3) : 0;
        const portals = this.createPortals(grid, portalCount);

        // Enemigos: 5 base + 1 cada 2 niveles, máximo 12
        const enemyCount = Math.min(5 + Math.floor(level / 2), 12);

        return {
            grid,
            portals,
            enemyCount,
            wallDensity,
            level
        };
    }

    createEmptyGrid() {
        const grid = [];
        for (let y = 0; y < this.rows; y++) {
            grid[y] = [];
            for (let x = 0; x < this.cols; x++) {
                // Bordes siempre son paredes
                if (x === 0 || x === this.cols - 1 || y === 0 || y === this.rows - 1) {
                    grid[y][x] = 1; // Pared
                } else {
                    grid[y][x] = 0; // Vacío
                }
            }
        }
        return grid;
    }

    placeRandomWalls(grid, density) {
        for (let y = 1; y < this.rows - 1; y++) {
            for (let x = 1; x < this.cols - 1; x++) {
                if (Math.random() < density) {
                    grid[y][x] = 1;
                }
            }
        }

        // Suavizar - eliminar paredes solitarias
        this.smoothWalls(grid);
    }

    smoothWalls(grid) {
        for (let y = 1; y < this.rows - 1; y++) {
            for (let x = 1; x < this.cols - 1; x++) {
                const neighbors = this.countWallNeighbors(grid, x, y);

                // Si una pared tiene muy pocos vecinos, eliminarla
                if (grid[y][x] === 1 && neighbors <= 1) {
                    grid[y][x] = 0;
                }

                // Si un espacio vacío está muy rodeado, convertirlo en pared
                if (grid[y][x] === 0 && neighbors >= 6) {
                    grid[y][x] = 1;
                }
            }
        }
    }

    countWallNeighbors(grid, x, y) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
                    if (grid[ny][nx] === 1) count++;
                }
            }
        }
        return count;
    }

    clearSpawnAreas(grid) {
        // Limpiar área de spawn del jugador (abajo centro)
        const playerX = Math.floor(this.cols / 2);
        const playerY = this.rows - 3;
        this.clearArea(grid, playerX, playerY, 2);

        // Limpiar áreas de spawn de enemigos (arriba)
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(2 + (this.cols - 4) * (i / 4));
            const y = 2;
            this.clearArea(grid, x, y, 1);
        }
    }

    clearArea(grid, centerX, centerY, radius) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (x > 0 && x < this.cols - 1 && y > 0 && y < this.rows - 1) {
                    grid[y][x] = 0;
                }
            }
        }
    }

    createPortals(grid, count = 0) {
        const portals = [];

        if (count === 0) return portals;

        // Colores para diferentes portales
        const colors = [0x00ffff, 0xff00ff, 0xffff00];

        // Crear pares de portales según count
        for (let i = 0; i < count; i++) {
            let portal1, portal2;
            let attempts = 0;

            do {
                portal1 = this.findEmptySpot(grid);
                portal2 = this.findEmptySpot(grid);
                attempts++;
            } while (this.distance(portal1, portal2) < 5 && attempts < 50);

            if (portal1 && portal2) {
                portals.push({
                    x1: portal1.x * this.tileSize + this.tileSize / 2,
                    y1: portal1.y * this.tileSize + this.tileSize / 2,
                    x2: portal2.x * this.tileSize + this.tileSize / 2,
                    y2: portal2.y * this.tileSize + this.tileSize / 2,
                    color: colors[i % colors.length]
                });
            }
        }

        return portals;
    }

    findEmptySpot(grid) {
        for (let attempt = 0; attempt < 100; attempt++) {
            const x = Math.floor(2 + Math.random() * (this.cols - 4));
            const y = Math.floor(2 + Math.random() * (this.rows - 4));

            if (grid[y][x] === 0) {
                return { x, y };
            }
        }
        return null;
    }

    distance(p1, p2) {
        if (!p1 || !p2) return 0;
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }

    getEnemySpawnPositions(count) {
        const positions = [];
        for (let i = 0; i < count; i++) {
            const x = 50 + (700 * (i / (count - 1)));
            const y = 50 + Math.random() * 150;
            positions.push({ x, y });
        }
        return positions;
    }
}
