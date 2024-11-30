// Scene setup
const scene = new THREE.Scene();
const width = window.innerWidth;
const height = window.innerHeight;
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

// Earth textures
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load('https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg');
const bumpMap = textureLoader.load('https://2.bp.blogspot.com/-oeguWUXEM8o/UkbyhLmUg-I/AAAAAAAAK-E/kSm3sH_f9fk/s1600/elev_bump_4k.jpg');

// Sphere geometry
const sphereGeometry = new THREE.SphereGeometry(5, 100, 100);

// Material with bump mapping
const material = new THREE.MeshStandardMaterial({
    map: earthTexture,
    bumpMap: bumpMap,
    bumpScale: 0.05,
    roughness: 0.4,
    metalness: 0
});

// Earth mesh
const earthMesh = new THREE.Mesh(sphereGeometry, material);
scene.add(earthMesh);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

// Camera position
camera.position.z = 20;

// Orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 10;
controls.maxDistance = 50;

// Resize handler
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    earthMesh.rotation.y += 0.001; // Rotate Earth
    controls.update();
    renderer.render(scene, camera);
}
animate();
