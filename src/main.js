
import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js';
import { Gun } from './gun.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false });
renderer.setSize(innerWidth, innerHeight*0.72);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth/(innerHeight*0.72), 0.1, 100);
camera.position.set(1.1, 0.6, 1.4);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 0.6;
controls.maxDistance = 3.0;

scene.add(new THREE.DirectionalLight(0xffffff, 1).position.set(2,2,2));
scene.add(new THREE.AmbientLight(0xffffff, 0.35));

// Ground shadow-ish plane for context
const ground = new THREE.Mesh(new THREE.PlaneGeometry(5,5), new THREE.MeshStandardMaterial({color:'#0b0d12', roughness:1, metalness:0}));
ground.rotation.x = -Math.PI/2; ground.position.y = -0.25; ground.receiveShadow = false; scene.add(ground);

const gun = new Gun();
scene.add(gun.group);

const statusEl = document.getElementById('status');
const spinBtn = document.getElementById('spin');
const newBtn = document.getElementById('new');
const toySkin = document.getElementById('toySkin');

function setStatus(msg){ statusEl.textContent = msg; }

async function spinAndFire(){
  spinBtn.disabled = true;
  setStatus('Spinning...');
  const bang = await gun.spinAndFire();
  if(bang){ setStatus('Bang! Press “New Game” to respawn. 🔁'); }
  else { setStatus('Safe! RNGesus approves. 🙏'); spinBtn.disabled = false; }
}

function newGame(){ gun.newGame(); setStatus('New game started.'); spinBtn.disabled = false; }

document.getElementById('spin').onclick = spinAndFire;
document.getElementById('new').onclick = newGame;
document.getElementById('toySkin').onchange = (e)=> gun.setToySkin(e.target.checked);

document.addEventListener('keydown', (e)=>{
  if((e.key==='Enter' || e.code==='Space') && !spinBtn.disabled){ e.preventDefault(); spinAndFire(); }
});

let lastW = 0, lastH = 0;
function resize(){
  const w = canvas.clientWidth; const h = window.innerHeight*0.72;
  if (w!==lastW || h!==lastH){
    lastW = w; lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w/h; camera.updateProjectionMatrix();
  }
}

const clock = new THREE.Clock();
function loop(){
  requestAnimationFrame(loop);
  resize();
  const dt = clock.getDelta();
  gun.update(dt);
  controls.update();
  renderer.render(scene, camera);
}
loop();

// initial
newGame();
