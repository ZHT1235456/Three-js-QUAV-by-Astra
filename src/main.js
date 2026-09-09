import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createDrone } from './drone.js';
import './style.css';

const host=document.querySelector('#viewport'),status=document.querySelector('#status');
try{
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;host.prepend(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#e8edf0');
const pmrem=new T.PMREMGenerator(renderer),env=new RoomEnvironment();scene.environment=pmrem.fromScene(env,.04).texture;env.dispose();pmrem.dispose();scene.environmentIntensity=.75;
const camera=new T.PerspectiveCamera(36,1,.05,100);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=3.6;controls.maxDistance=16;controls.maxPolarAngle=Math.PI*.495;controls.target.set(0,1,0);controls.autoRotateSpeed=.6;
scene.add(new T.HemisphereLight(0xeef6ff,0x6d7880,2));
const key=new T.DirectionalLight(0xfff5e7,3);key.position.set(-3,7,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:20});key.shadow.normalBias=.008;key.shadow.bias=-.0001;key.shadow.radius=3;scene.add(key);
const fill=new T.DirectionalLight(0xd0e3ff,1.8);fill.position.set(4,3,-4);scene.add(fill);
const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:'#e8edf0',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=.022;ground.receiveShadow=true;scene.add(ground);
const grid=new T.GridHelper(16,64,0xa7b6c0,0xc7d2d9);grid.position.y=.024;grid.material.transparent=true;grid.material.opacity=.3;scene.add(grid);
const drone=createDrone();scene.add(drone.root);
const views={perspective:[4.4,3.5,6.3],front:[0,2.05,7.8],top:[0,8.7,.001],side:[8,2.15,0]};
function view(name){camera.position.set(...views[name]);controls.target.set(0,1,0);controls.update();document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));}
view('perspective');
const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(host);resize();
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
const $=id=>document.getElementById(id);
$('orbit').onchange=e=>controls.autoRotate=e.target.checked;
$('grid').onchange=e=>grid.visible=e.target.checked;
function wire(value){drone.root.traverse(o=>{if(o.isMesh)for(const material of (Array.isArray(o.material)?o.material:[o.material]))material.wireframe=value;});}
$('wire').onchange=e=>wire(e.target.checked);
function explode(value){drone.parts.forEach(p=>p.group.position.copy(p.offset).multiplyScalar(value));$('explode-value').value=`${Math.round(value*100)}%`;ground.visible=value===0;}
$('explode').oninput=e=>explode(+e.target.value);
$('pitch').oninput=e=>{drone.cameraPivot.rotation.x=-T.MathUtils.degToRad(+e.target.value);$('pitch-value').value=`${e.target.value}°`;};
$('reset').onclick=()=>{for(const id of ['spin','orbit','wire'])$(id).checked=false;controls.autoRotate=false;wire(false);$('grid').checked=true;grid.visible=true;$('explode').value=0;explode(0);$('pitch').value=0;$('pitch-value').value='0°';drone.cameraPivot.rotation.x=0;drone.rotors.forEach((r,i)=>r.rotation.y=i%2?-.55:.55);view('perspective');};
document.querySelectorAll('[data-ref]').forEach(b=>b.onclick=()=>{$('reference').querySelector('img').src=new URL(`../figures/${b.dataset.ref}.png`,import.meta.url).href;$('reference').showModal();});$('close-ref').onclick=()=>$('reference').close();$('reference').onclick=e=>{if(e.target===$('reference'))$('reference').close();};
$('export').onclick=async()=>{const button=$('export');button.disabled=true;status.textContent='正在导出 GLB…';try{const data=await new GLTFExporter().parseAsync(drone.root,{binary:true});const url=URL.createObjectURL(new Blob([data],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download='quadrotor.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);status.textContent='GLB 模型已导出';}catch(e){status.textContent='导出失败，请重试';console.error(e);}finally{button.disabled=false;}};
let last=performance.now();renderer.setAnimationLoop(now=>{const dt=Math.min((now-last)/1000,.05);last=now;if($('spin').checked)drone.rotors.forEach((r,i)=>r.rotation.y+=dt*24*(i===0||i===3?1:-1));controls.update();renderer.render(scene,camera);});
status.textContent='模型就绪 / 4 组旋翼';
window.__drone={scene,drone,renderer,camera};
}catch(error){console.error(error);status.textContent='无法初始化 3D 视图，请启用浏览器硬件加速后刷新。';}
