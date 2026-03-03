
import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';

export class Gun{
  constructor(){
    this.group = new THREE.Group();
    this.group.position.set(0, 0, 0);

    // Materials
    this.matMetal = new THREE.MeshStandardMaterial({ color: '#8c94a0', metalness: 0.9, roughness: 0.35 });
    this.matDark = new THREE.MeshStandardMaterial({ color: '#424a55', metalness: 0.7, roughness: 0.5 });
    this.matGrip = new THREE.MeshStandardMaterial({ color: '#6a4630', metalness: 0.2, roughness: 0.9 });
    this.matBlack = new THREE.MeshStandardMaterial({ color: '#0d0f12', metalness: 0.5, roughness: 0.8 });
    this.matBrass = new THREE.MeshStandardMaterial({ color: '#d7a21c', metalness: 1.0, roughness: 0.35, emissive:'#3a2a00', emissiveIntensity:0.15 });
    this.matFlash = new THREE.SpriteMaterial({ color: 0xffcc66, transparent:true, opacity:0 });

    // Rig group pivot around grip bottom for recoil
    this.rig = new THREE.Group();
    this.group.add(this.rig);

    // === Build geometry (approx revolver side profile in 3D) ===
    // Frame block
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.10), this.matMetal);
    frame.position.set(0.18, 0.06, 0);
    frame.castShadow = frame.receiveShadow = false;
    this.rig.add(frame);

    // Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.52, 32), this.matDark);
    barrel.rotation.z = Math.PI/2; // align X
    barrel.position.set(0.43, 0.06, 0);
    this.rig.add(barrel);
    this.barrel = barrel;

    // Muzzle crown
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.002, 16), this.matBlack);
    muzzle.rotation.z = Math.PI/2; muzzle.position.set(0.69, 0.06, 0);
    this.rig.add(muzzle);

    // Cylinder main
    const cylGroup = new THREE.Group();
    cylGroup.position.set(0.26, 0.06, 0);
    this.rig.add(cylGroup);
    this.cylGroup = cylGroup;

    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.07, 48), this.matDark);
    cylinder.rotation.z = Math.PI/2; // make axis X so rotation around X steps holes
    cylGroup.add(cylinder);

    // Cylinder face holes (front)
    const holeR = 0.016; const holeOffset = 0.056;
    const holes = new THREE.Group(); holes.position.set(0.035, 0, 0); // slightly to the front face
    cylGroup.add(holes);
    this.holeDots = [];
    for (let i=0;i<6;i++){
      const a = i * (Math.PI/3);
      const x = 0; const y = Math.cos(a)*holeOffset; const z = Math.sin(a)*holeOffset;
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(holeR, holeR, 0.004, 16), this.matBlack);
      disc.rotation.z = Math.PI/2; // face forward
      disc.position.set(x, y, z);
      holes.add(disc);

      // small brass dot for the loaded chamber marker (we'll toggle visibility)
      const dot = new THREE.Mesh(new THREE.CylinderGeometry(holeR*0.7, holeR*0.7, 0.003, 16), this.matBrass);
      dot.rotation.z = Math.PI/2; dot.position.set(x+0.0025, y, z); dot.visible = false;
      holes.add(dot); this.holeDots.push(dot);
    }

    // Hammer
    const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.02), this.matDark);
    hammer.position.set(0.12, 0.12, 0);
    this.rig.add(hammer); this.hammer = hammer;

    // Trigger (approx )
    const trigger = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.01, 12, 24, Math.PI*1.2), this.matDark);
    trigger.rotation.x = Math.PI/2; trigger.rotation.z = -Math.PI/4;
    trigger.position.set(0.16, -0.02, 0);
    this.rig.add(trigger); this.trigger = trigger;

    // Trigger guard
    const tguard = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.008, 12, 24, Math.PI*1.8), this.matDark);
    tguard.rotation.x = Math.PI/2; tguard.rotation.z = -Math.PI/6; tguard.position.set(0.14, -0.01, 0);
    this.rig.add(tguard);

    // Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.22, 0.06), this.matGrip);
    grip.position.set(0.07, -0.06, 0); grip.rotation.z = -0.25;
    this.rig.add(grip);

    // Muzzle flash (sprite)
    const flash = new THREE.Sprite(this.matFlash);
    flash.scale.set(0.18, 0.18, 1);
    flash.position.set(0.69, 0.06, 0);
    this.rig.add(flash); this.flash = flash;

    // State
    this.bulletIndex = 0;
    this.currentIndex = 0;
    this.anim = { t:0 };
    this.toy = false;
  }

  setToySkin(enabled){
    this.toy = enabled;
    const set = (m, c, r, met)=>{ m.color.set(c); m.roughness=r; if(m.metalness!==undefined) m.metalness=met; };
    if(enabled){
      set(this.matMetal, '#7ab7ff', 0.4, 0.7);
      set(this.matDark, '#4fa7ff', 0.5, 0.6);
      this.matGrip.color.set('#ffd166'); this.matGrip.roughness=0.8; this.matGrip.metalness=0.2;
      this.matBrass.color.set('#ff79c6');
    }else{
      set(this.matMetal, '#8c94a0', 0.35, 0.9);
      set(this.matDark, '#424a55', 0.5, 0.7);
      this.matGrip.color.set('#6a4630'); this.matGrip.roughness=0.9; this.matGrip.metalness=0.2;
      this.matBrass.color.set('#d7a21c');
    }
  }

  newGame(){
    this.bulletIndex = Math.floor(Math.random()*6);
    this.currentIndex = 0;
    this._setCylinderAngle(0);
    this._updateLoadDots();
  }

  _updateLoadDots(){
    this.holeDots.forEach((d,i)=> d.visible = (i===this.bulletIndex));
  }

  _setCylinderAngle(deg){
    // Cylinder rotates around X (since we laid it sideways). Each step=60°
    this.cylGroup.rotation.x = THREE.MathUtils.degToRad(deg);
    this.cylAngle = deg;
  }

  _animate(from, to, ms, fn){
    return new Promise(resolve=>{
      const t0 = performance.now();
      const ease = (t)=> 1-Math.pow(1-t,3);
      const step = ()=>{
        const t = Math.min(1, (performance.now()-t0)/ms);
        const v = from + (to-from)*ease(t);
        fn(v);
        if(t<1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  async spinAndFire(){
    // random spin steps 6..11
    const steps = Math.floor(Math.random()*6)+6;
    this.currentIndex = (this.currentIndex + steps) % 6;

    // while spinning, wiggle hammer slightly
    let wig = true; const wigLoop = ()=>{ if(!wig) return; this.hammer.rotation.z = (-0.15 + Math.sin(performance.now()/60)*0.1); requestAnimationFrame(wigLoop); }; wigLoop();

    await this._animate(this.cylAngle||0, this.currentIndex*60, 420, v=> this._setCylinderAngle(v));
    wig = false; this.hammer.rotation.z = 0;

    // cock hammer & pull trigger
    await Promise.all([
      this._animate(0, -0.66, 160, v=> this.hammer.rotation.z = v),
      this._animate(-Math.PI/4, -Math.PI/4 + 0.4, 160, v=> this.trigger.rotation.z = v)
    ]);

    const bang = (this.currentIndex === this.bulletIndex);
    if(bang){
      this._muzzleFlash();
      this._recoil();
    }

    // reset
    setTimeout(()=>{
      this._animate(this.hammer.rotation.z, 0, 160, v=> this.hammer.rotation.z = v);
      this._animate(this.trigger.rotation.z, -Math.PI/4, 160, v=> this.trigger.rotation.z = v);
    }, 160);

    return bang;
  }

  _muzzleFlash(){
    // sprite pop + barrel slight jiggle
    const start = performance.now();
    const run = ()=>{
      const t = (performance.now()-start)/200; // 0..1
      const k = Math.max(0, 1 - t);
      this.flash.material.opacity = k;
      const s = 0.18 + 0.15*(1-k);
      this.flash.scale.set(s, s, 1);
      this.barrel.rotation.y = 0.02*(1-k);
      if(k>0) requestAnimationFrame(run); else { this.flash.material.opacity=0; this.barrel.rotation.y=0; }
    };
    run();
  }

  _recoil(){
    // rotate rig around grip briefly
    const base = this.rig.rotation.z;
    const start = performance.now();
    const run = ()=>{
      const t = (performance.now()-start)/180; // 0..1
      const k = Math.max(0, 1 - t);
      this.rig.rotation.z = base - 0.12*k;
      this.group.position.x = (Math.random()-0.5)*0.01*k; // tiny shake
      this.group.position.y = (Math.random()-0.5)*0.006*k;
      if(k>0) requestAnimationFrame(run); else { this.rig.rotation.z = base; this.group.position.set(0,0,0); }
    };
    run();
  }

  update(dt){ /* reserved for future particles/smoke */ }
}
