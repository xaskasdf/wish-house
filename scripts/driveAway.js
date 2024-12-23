// Configuración inicial
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let keys = {};
let images = {};

// Variables del juego
const NUM_LANES = 3;
let ROAD_WIDTH;
let LANE_WIDTH;
let VEHICLE_WIDTH;
let VEHICLE_HEIGHT;

let player = {
    laneIndex: 1, // Carril central (0, 1, 2)
};

let enemyVehicles = [];
let roadMarks = [];

// Variables para el control de colisiones
let collisionEnabled = false;
let collisionTimer = 0;

// Variables globales para el control de framerate
let lastFrameTime = 0;
const TARGET_FPS = 30; // Objetivo de 30 FPS
const FRAME_DURATION = 1000 / TARGET_FPS; // Duración de cada frame en milisegundos

// Cargar imágenes
function loadImages() {
    const imageSources = {
        player: 'static/driveAway/player.png',
        enemy1: 'static/driveAway/enemy1.png',
        enemy2: 'static/driveAway/enemy2.png',
    };

    let loadedImages = 0;
    const totalImages = Object.keys(imageSources).length;

    return new Promise((resolve) => {
        for (let key in imageSources) {
            images[key] = new Image();
            images[key].src = imageSources[key];
            images[key].onload = () => {
                loadedImages++;
                if (loadedImages === totalImages) {
                    resolve();
                }
            };
        }
    });
}

// Obtener el centro de un carril
function getLaneCenter(laneIndex, z) {
    const roadCenterX = canvas.width / 2;
    const roadTopWidth = ROAD_WIDTH * 0.4; // Ancho de la carretera en el horizonte
    const roadBottomWidth = ROAD_WIDTH; // Ancho de la carretera en la parte inferior
    const roadWidthAtZ = roadTopWidth + (roadBottomWidth - roadTopWidth) * (1 - z);

    // Calcular el borde izquierdo de la carretera en la profundidad actual
    const leftEdgeOfRoadAtZ = roadCenterX - roadWidthAtZ / 2;

    // Calcular el centro dinámico del carril
    const laneWidthAtZ = roadWidthAtZ / NUM_LANES;
    return leftEdgeOfRoadAtZ + laneWidthAtZ / 2 + laneIndex * laneWidthAtZ;
}


// Ajustar el canvas al tamaño de la ventana
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Ajustar dimensiones basadas en el tamaño del lienzo
    ROAD_WIDTH = canvas.width * 0.8;
    LANE_WIDTH = ROAD_WIDTH / NUM_LANES;
    VEHICLE_WIDTH = LANE_WIDTH * 0.8; // Mantener el ancho fijo basado en el carril
    VEHICLE_HEIGHT = (canvas.height / 15) * 1.3; // Aumentar la altura en un 30%
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Eventos de teclado
document.addEventListener('keydown', function (e) {
    keys[e.key] = true;
});

document.addEventListener('keyup', function (e) {
    keys[e.key] = false;
});

// Clase EnemyVehicle
class EnemyVehicle {
    constructor() {
        this.reset();
    }

    // Calcular distancia mínima entre vehículos
    isTooCloseTo(otherVehicle) {
        const minDistance = 0.2; // Distancia mínima en el eje z
        return Math.abs(this.z - otherVehicle.z) < minDistance && this.laneIndex === otherVehicle.laneIndex;
    }

    draw() {
        if (!images[this.imageKey] || !images[this.imageKey].complete) {
            return; // No dibujar si la imagen no está lista
        }

        if (this.z <= 0.1 || this.z > 1) return; // Fuera de rango visible

        // Calcular perspectiva para el escalado
        const perspective = Math.max(canvas.height / (this.z * canvas.height * 2), 0.2);
        const maxLaneWidth = LANE_WIDTH - 20;
        const vehicleWidth = Math.min(VEHICLE_WIDTH * perspective, maxLaneWidth);
        const vehicleHeight = vehicleWidth * 2;

        // Calcular el centro dinámico del carril
        const x = getLaneCenter(this.laneIndex, this.z) - vehicleWidth / 2;

        // Calcular posición vertical basada en el horizonte
        const horizonY = canvas.height * 0.5; // Línea del horizonte
        const y = horizonY + (canvas.height / 2) * (1 - this.z) - vehicleHeight / 2;

        ctx.drawImage(images[this.imageKey], x, y, vehicleWidth, vehicleHeight);
    }

    update() {
        this.z -= this.speed;

        // Si el vehículo sale completamente de la pantalla, reiniciarlo
        if (this.z < 0 || this.z > 1.5) {
            this.reset();
        }
    }

    reset() {
        this.z = 1; // Aparecen exactamente en el horizonte
        this.laneIndex = Math.floor(Math.random() * NUM_LANES); // Elegir un carril aleatorio
        this.speed = 0.002 + Math.random() * 0.003; // Velocidad aleatoria
        this.imageKey = ['enemy1', 'enemy2'][Math.floor(Math.random() * 2)]; // Asignar imagen

        // Validar posición horizontal para evitar vehículos fuera de pista
        const laneCenter = getLaneCenter(this.laneIndex);
        const leftEdgeOfRoad = (canvas.width - ROAD_WIDTH) / 2;
        const rightEdgeOfRoad = leftEdgeOfRoad + ROAD_WIDTH;

        // Comprobar si el vehículo está dentro de la carretera
        if (laneCenter - VEHICLE_WIDTH / 2 < leftEdgeOfRoad || laneCenter + VEHICLE_WIDTH / 2 > rightEdgeOfRoad) {
            // Recalcular si está fuera de la carretera
            this.laneIndex = Math.floor(Math.random() * NUM_LANES);
        }
    }
}

// Inicializar enemigos
function initEnemies() {
    enemyVehicles = [];
    const enemyCount = 5;

    for (let i = 0; i < enemyCount; i++) {
        let attempts = 0;
        let enemy = new EnemyVehicle();

        // Validar distancia mínima entre vehículos
        while (
            enemyVehicles.some((existingEnemy) => enemy.isTooCloseTo(existingEnemy)) &&
            attempts < 10 // Evitar bucles infinitos
            ) {
            enemy = new EnemyVehicle();
            attempts++;
        }

        enemyVehicles.push(enemy);
    }
}


// Marcas de carretera
function initRoadMarks() {
    roadMarks = [];
    const markCount = 3; // Menos marcas para mayor espacio
    for (let i = 0; i < markCount; i++) {
        roadMarks.push({
            z: i / markCount,
        });
    }
}

function updateRoadMarks() {
    roadMarks.forEach((mark) => {
        mark.z -= 0.025; // Mover más rápido para aumentar el espacio entre líneas
        if (mark.z < 0) {
            mark.z += 1;
        }
    });
}

function drawRoadMarks() {
    const MAX_MARK_WIDTH = LANE_WIDTH * 0.1; // Ancho máximo razonable
    const MAX_MARK_HEIGHT = canvas.height * 0.1; // Altura máxima razonable

    roadMarks.forEach((mark) => {
        // Ajustar perspectiva de las marcas
        const perspective = Math.max(canvas.height / (mark.z * canvas.height * 2), 0.1); // Perspectiva ajustada
        let markWidth = LANE_WIDTH * 0.02 * perspective; // Marcas delgadas
        let markHeight = canvas.height * 0.08 * perspective; // Marcas largas

        // Limitar las dimensiones máximas
        markWidth = Math.min(markWidth, MAX_MARK_WIDTH);
        markHeight = Math.min(markHeight, MAX_MARK_HEIGHT);

        // Dibujar marcas entre carriles
        for (let i = 0; i < NUM_LANES - 1; i++) {
            // Calcular posición entre carriles
            const laneCenterLeft = getLaneCenter(i, mark.z);
            const laneCenterRight = getLaneCenter(i + 1, mark.z);
            const x = (laneCenterLeft + laneCenterRight) / 2 - markWidth / 2;

            // Posición vertical ajustada al punto de fuga
            const horizonY = canvas.height * 0.5; // Punto de fuga
            const y = horizonY + (canvas.height / 2) * (1 - mark.z) - markHeight;

            // Dibujar la marca si está visible
            if (mark.z > 0.1 && mark.z <= 1) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(x, y, markWidth, markHeight);
            }
        }
    });
}


// Dibujar la carretera
function drawRoad() {
    const horizonY = canvas.height * 0.5; // Ajustar la posición del horizonte al 50% de la pantalla
    ctx.fillStyle = '#222'; // Color de la carretera

    const roadTopWidth = ROAD_WIDTH * 0.4; // Ancho reducido en el horizonte
    const roadBottomWidth = ROAD_WIDTH;
    const roadTopX = (canvas.width - roadTopWidth) / 2;
    const roadBottomX = (canvas.width - roadBottomWidth) / 2;

    ctx.beginPath();
    ctx.moveTo(roadTopX, horizonY); // Comienza en el horizonte
    ctx.lineTo(roadTopX + roadTopWidth, horizonY);
    ctx.lineTo(roadBottomX + roadBottomWidth, canvas.height); // Extiende hasta el fondo
    ctx.lineTo(roadBottomX, canvas.height);
    ctx.closePath();
    ctx.fill();
}

// Dibujar el jugador
function drawPlayer() {
    const perspective = Math.max(canvas.height / (0.1 * canvas.height * 2), 0.2); // Ajustar perspectiva del jugador
    const vehicleWidth = VEHICLE_WIDTH * perspective;
    const vehicleHeight = vehicleWidth * 2; // Relación de aspecto fija 2:1

    const x = getLaneCenter(player.laneIndex) - vehicleWidth / 2;
    const y = canvas.height * 0.85 - vehicleHeight; // Posición más baja

    ctx.drawImage(images.player, x, y, vehicleWidth, vehicleHeight);
}

function drawHorizon() {
    const horizonY = canvas.height * 0.5; // Posición del horizonte (20% desde arriba)
    const roadTopWidth = ROAD_WIDTH * 0.4; // Ancho de la carretera en el horizonte
    const roadTopX = (canvas.width - roadTopWidth) / 2;

    // Dibujar el fondo del cielo
    ctx.fillStyle = '#87CEEB'; // Azul cielo
    ctx.fillRect(0, 0, canvas.width, horizonY);

    // Dibujar la línea del horizonte
    ctx.fillStyle = '#222'; // Color de la carretera en el horizonte
    ctx.fillRect(roadTopX, horizonY, roadTopWidth, canvas.height - horizonY);
}

// Detección de colisión
function detectCollision(rect1, rect2) {
    return !(
        rect1.x > rect2.x + rect2.width ||
        rect1.x + rect1.width < rect2.x ||
        rect1.y > rect2.y + rect2.height ||
        rect1.y + rect1.height < rect2.y
    );
}

// Función de actualización
function update() {
    if (!collisionEnabled) {
        collisionTimer += 1 / TARGET_FPS;
        if (collisionTimer > 2) collisionEnabled = true;
    }

    if (keys['ArrowLeft'] && player.laneIndex > 0) player.laneIndex -= 1;
    if (keys['ArrowRight'] && player.laneIndex < NUM_LANES - 1) player.laneIndex += 1;

    enemyVehicles.forEach((enemy) => enemy.update());
    updateRoadMarks();
}

// Función de dibujo
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar carretera
    drawRoad();

    // Dibujar horizonte
    drawHorizon();

    // Dibujar marcas de carretera
    drawRoadMarks();

    // Ordenar enemigos por profundidad (z)
    const sortedEnemies = [...enemyVehicles].sort((a, b) => b.z - a.z);

    // Dibujar enemigos en orden
    sortedEnemies.forEach((enemy) => {
        enemy.draw();
    });

    // Dibujar jugador
    drawPlayer();
}

// Reiniciar el juego
function resetGame() {
    player.laneIndex = 1;
    initEnemies();
    collisionEnabled = false;
    collisionTimer = 0;
}

// Bucle principal con control de framerate
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastFrameTime;

    if (deltaTime >= FRAME_DURATION) {
        lastFrameTime = timestamp;
        update();
        draw();
    }

    requestAnimationFrame(gameLoop);
}

// Iniciar el juego
document.addEventListener('DOMContentLoaded', () => {
    loadImages().then(() => {
        initEnemies();
        initRoadMarks();
        requestAnimationFrame(gameLoop);
    });
});
