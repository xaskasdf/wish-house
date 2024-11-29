// Initialize the Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Grid Parameters
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const GRID_DEPTH = 10;
const BLOCK_SIZE = 1;

// Initialize the Orthographic Camera
const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 30;

const camera = new THREE.OrthographicCamera(
    (frustumSize * aspect) / -2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    frustumSize / -2,
    0.1,
    1000
);

// Set camera position for isometric view
const isoAngle = (Math.PI / 180) * 35.264; // 35.264 degrees
const isoRotation = (Math.PI / 180) * 45;  // 45 degrees

camera.position.set(
    GRID_WIDTH / 2 + GRID_HEIGHT * Math.cos(isoRotation) * Math.cos(isoAngle),
    GRID_HEIGHT * Math.sin(isoAngle),
    GRID_DEPTH / 2 + GRID_HEIGHT * Math.sin(isoRotation) * Math.cos(isoAngle)
);

camera.lookAt(new THREE.Vector3(GRID_WIDTH / 2, GRID_HEIGHT / 2, GRID_DEPTH / 2));

// Initialize the Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Include OrbitControls (make sure to include the script in index.html)
const controls = new THREE.OrbitControls(camera, renderer.domElement);

// Configure controls
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 1.2;
controls.minZoom = 0.5;
controls.maxZoom = 2;
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 2;

// Ambient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Directional Light
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 20, 10);
scene.add(directionalLight);

// Create a GridHelper for the floor grid on the XY plane at z = 0
const floorGrid = new THREE.GridHelper(GRID_WIDTH, GRID_WIDTH);
floorGrid.rotation.y = Math.PI / 2; // Rotate to lie on the XZ plane
floorGrid.position.set(GRID_WIDTH / 2, 0.5, GRID_DEPTH / 2);

// Create 2D Grid
// scene.add(floorGrid);

// Create 3D Grid
create3DGrid(GRID_WIDTH, GRID_HEIGHT, GRID_DEPTH, BLOCK_SIZE);

// Tetromino Shapes
const tetrominoShapes = [
  // I Shape
  [
    [0, 0, 0],
    [0, BLOCK_SIZE, 0],
    [0, BLOCK_SIZE * 2, 0],
    [0, BLOCK_SIZE * 3, 0]
  ],
  // O Shape
  [
    [0, 0, 0],
    [BLOCK_SIZE, 0, 0],
    [0, BLOCK_SIZE, 0],
    [BLOCK_SIZE, BLOCK_SIZE, 0]
  ],
  // L Shape
  [
    [0, 0, 0],
    [0, BLOCK_SIZE, 0],
    [0, BLOCK_SIZE * 2, 0],
    [BLOCK_SIZE, 0, 0]
  ],
  // T Shape
  [
    [0, 0, 0],
    [-BLOCK_SIZE, 0, 0],
    [BLOCK_SIZE, 0, 0],
    [0, BLOCK_SIZE, 0]
  ],
  // S Shape
  [
    [0, 0, 0],
    [BLOCK_SIZE, 0, 0],
    [0, BLOCK_SIZE, 0],
    [-BLOCK_SIZE, BLOCK_SIZE, 0]
  ],
  // Z Shape
  [
    [0, 0, 0],
    [-BLOCK_SIZE, 0, 0],
    [0, BLOCK_SIZE, 0],
    [BLOCK_SIZE, BLOCK_SIZE, 0]
  ],
  // J Shape
  [
    [0, 0, 0],
    [0, BLOCK_SIZE, 0],
    [0, BLOCK_SIZE * 2, 0],
    [-BLOCK_SIZE, 0, 0]
  ],
];

// Tetromino Colors
const tetrominoColors = [
  0xff0000, // Red for I shape
  0xffff00, // Yellow for O shape
  0x0000ff, // Blue for L shape
  0x800080, // Purple for T shape
  0x00ff00, // Green for S shape
  0xffa500, // Orange for Z shape
  0x00ffff, // Cyan for J shape
];

// Create Tetromino Function
function createTetromino(shapeCoords, color) {
  const group = new THREE.Group();
  const material = new THREE.MeshPhongMaterial({ color });

  shapeCoords.forEach(coord => {
    const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(...coord);
    group.add(cube);
  });

  scene.add(group);
  return group;
}

// Game Variables
let currentTetromino;
let dropStart = Date.now();
const DROP_INTERVAL = 1000;
const occupiedPositions = [];

// Initialize First Tetromino
spawnNewTetromino();

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  const now = Date.now();
  const delta = now - dropStart;

  if (delta > DROP_INTERVAL) {
    moveTetrominoDown();
    dropStart = now;
  }

  controls.update(); // Update OrbitControls

  renderer.render(scene, camera);
}

// Move Tetromino Down
function moveTetrominoDown() {
  currentTetromino.position.y -= BLOCK_SIZE;

  if (checkCollision(currentTetromino)) {
    currentTetromino.position.y += BLOCK_SIZE; // Revert move
    lockTetromino(currentTetromino);
  }
}

// Handle User Input
document.addEventListener('keydown', event => {
  switch (event.code) {
    case 'ArrowLeft':
      currentTetromino.position.x -= BLOCK_SIZE;
      if (checkCollision(currentTetromino)) {
        currentTetromino.position.x += BLOCK_SIZE;
      }
      break;
    case 'ArrowRight':
      currentTetromino.position.x += BLOCK_SIZE;
      if (checkCollision(currentTetromino)) {
        currentTetromino.position.x -= BLOCK_SIZE;
      }
      break;
    case 'KeyW':
      currentTetromino.position.z -= BLOCK_SIZE;
      if (checkCollision(currentTetromino)) {
        currentTetromino.position.z += BLOCK_SIZE;
      }
      break;
    case 'KeyS':
      currentTetromino.position.z += BLOCK_SIZE;
      if (checkCollision(currentTetromino)) {
        currentTetromino.position.z -= BLOCK_SIZE;
      }
      break;
    case 'ArrowUp':
      rotateTetromino(currentTetromino, 'y');
      if (checkCollision(currentTetromino)) {
        rotateTetromino(currentTetromino, 'y', -1);
      }
      break;
    case 'ArrowDown':
      rotateTetromino(currentTetromino, 'x');
      if (checkCollision(currentTetromino)) {
        rotateTetromino(currentTetromino, 'x', -1);
      }
      break;
    case 'Space':
      while (!checkCollision(currentTetromino)) {
        currentTetromino.position.y -= BLOCK_SIZE;
      }
      currentTetromino.position.y += BLOCK_SIZE;
      lockTetromino(currentTetromino);
      break;
  }
});

// Rotate Tetromino
function rotateTetromino(tetromino, axis, direction = 1) {
  const angle = direction * Math.PI / 2;
  tetromino.rotation[axis] += angle;
}

// Check Collision
function checkCollision(tetromino) {
  const tetrominoBox = new THREE.Box3().setFromObject(tetromino);

  if (
      tetrominoBox.min.x < 0 ||
      tetrominoBox.max.x > GRID_WIDTH ||
      tetrominoBox.min.y < 0 ||
      tetrominoBox.min.z < 0 ||
      tetrominoBox.max.z > GRID_DEPTH
  ) {
    return true;
  }

  return checkCollisionWithOccupiedPositions(tetromino);
}

// Check Collision with Occupied Positions
function checkCollisionWithOccupiedPositions(tetromino) {
  tetromino.updateMatrixWorld(true);

  for (let pos of occupiedPositions) {
    if (
        tetromino.children.some(block => {
          const blockPos = block.getWorldPosition(new THREE.Vector3());
          blockPos.x = Math.round(blockPos.x);
          blockPos.y = Math.round(blockPos.y);
          blockPos.z = Math.round(blockPos.z);

          return blockPos.x === pos.x && blockPos.y === pos.y && blockPos.z === pos.z;
        })
    ) {
      return true;
    }
  }
  return false;
}

// Lock Tetromino in Place
function lockTetromino(tetromino) {
  tetromino.updateMatrixWorld(true);

  const blocks = tetromino.children.slice();

  blocks.forEach(block => {
    // Apply tetromino's world matrix to block
    block.applyMatrix4(tetromino.matrixWorld);

    // Remove block from tetromino group and add to scene
    tetromino.remove(block);
    scene.add(block);

    // Round the block's position to align with grid
    block.position.x = Math.round(block.position.x);
    block.position.y = Math.round(block.position.y);
    block.position.z = Math.round(block.position.z);

    // Record the position
    occupiedPositions.push(block.position.clone());
  });

  scene.remove(tetromino);

  clearCompletedLines();

  spawnNewTetromino();
}

// Clear Completed Lines (Placeholder)
function clearCompletedLines() {
  // Implement line-clearing logic here
}

// Spawn New Tetromino
function spawnNewTetromino() {
  const randomIndex = Math.floor(Math.random() * tetrominoShapes.length);
  const shape = tetrominoShapes[randomIndex];
  const color = tetrominoColors[randomIndex] || 0xffffff;

  currentTetromino = createTetromino(shape, color);

  // Start at the center top of the grid
  currentTetromino.position.set(
      Math.floor(GRID_WIDTH / 2),
      GRID_HEIGHT - 1,
      Math.floor(GRID_DEPTH / 2)
  );

  if (checkCollisionWithOccupiedPositions(currentTetromino)) {
    gameOver();
  }
}

// Game Over
function gameOver() {
  alert('Game Over!');
  location.reload();
}

// Responsive Design
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight;

  camera.left = (-frustumSize * aspect) / 2;
  camera.right = (frustumSize * aspect) / 2;
  camera.top = frustumSize / 2;
  camera.bottom = -frustumSize / 2;

  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start Animation
animate();

// Create 3D Grid Function
function create3DGrid(width, height, depth, spacing) {
  const grid = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color: 0x333333 });

  spacing = 5* spacing

  // Vertical lines along Y-axis
  for (let x = 0; x <= width; x += spacing) {
    for (let z = 0; z <= depth; z += spacing) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, z),
        new THREE.Vector3(x, height, z)
      ]);
      const line = new THREE.Line(geometry, material);
      grid.add(line);
    }
  }

  // Horizontal lines along X-axis
  for (let y = 0; y <= height; y += spacing) {
    for (let z = 0; z <= depth; z += spacing) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, y, z),
        new THREE.Vector3(width, y, z)
      ]);
      const line = new THREE.Line(geometry, material);
      grid.add(line);
    }
  }

  // Horizontal lines along Z-axis
  for (let x = 0; x <= width; x += spacing) {
    for (let y = 0; y <= height; y += spacing) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, y, 0),
        new THREE.Vector3(x, y, depth)
      ]);
      const line = new THREE.Line(geometry, material);
      grid.add(line);
    }
  }

  scene.add(grid);
}
