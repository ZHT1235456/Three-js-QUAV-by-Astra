import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { propellerGeometry } from './propeller.js';

// Image-derived proportions. Y is up; +Z is the nose. No physical scale is asserted.
export function createDrone() {
  const root = new T.Group(); root.name = 'Reference quadrotor';
  const parts = [], rotors = [];
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d'); ctx.fillStyle='#45494c';ctx.fillRect(0,0,128,128);
  for(let y=0;y<128;y+=8)for(let x=0;x<128;x+=8){const flip=((x+y)/8)%2;ctx.fillStyle=flip?'#33383b':'#515659';ctx.fillRect(x,y,7,7);ctx.strokeStyle=flip?'#555a5c':'#3c4144';for(let n=1;n<7;n+=2){ctx.beginPath();ctx.moveTo(x+(flip?n:0),y+(flip?0:n));ctx.lineTo(x+(flip?n:7),y+(flip?7:n));ctx.stroke();}}
  const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(2,2);texture.rotation=Math.PI/4;texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;
  const mat=(color,metalness=.3,roughness=.5)=>new T.MeshStandardMaterial({color,metalness,roughness});
  const shell=mat('#303438',.22,.57), carbon=new T.MeshPhysicalMaterial({color:'#777d81',map:texture,metalness:.35,roughness:.53,clearcoat:.22,clearcoatRoughness:.38}), black=mat('#141a1e',.55,.34), rubber=mat('#252b2e',.05,.8), silver=mat('#a0a7ab',.8,.26), bladeMat=mat('#34393d',.3,.48), copper=mat('#9e6233',.75,.3);
  function mesh(g,m,p,x=0,y=0,z=0,name=''){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.name=name;o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
  function box(p,w,h,d,x,y,z,m=shell,r=.04){return mesh(new RoundedBoxGeometry(w,h,d,2,r),m,p,x,y,z);}
  function cyl(p,r,h,x,y,z,m=black,r2=r){return mesh(new T.CylinderGeometry(r,r2,h,32),m,p,x,y,z);}
  function link(p,a,b,r,m=carbon){const v=new T.Vector3(...a),w=new T.Vector3(...b),o=cyl(p,r,v.distanceTo(w),...(v.clone().add(w).multiplyScalar(.5).toArray()),m);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),w.sub(v).normalize());return o;}
  function part(name,offset){const p=new T.Group();p.name=name;root.add(p);parts.push({group:p,offset:new T.Vector3(...offset)});return p;}
  function screw(p,x,y,z){cyl(p,.018,.009,x,y,z,black);cyl(p,.011,.011,x,y+.003,z,silver);box(p,.011,.003,.003,x,y+.01,z,black,.001);}
  function decal(p,text,w,h,x,y,z){const c=document.createElement('canvas');c.width=512;c.height=128;const context=c.getContext('2d');context.fillStyle='#b8bec1';context.font='italic 64px Arial';context.textAlign='center';context.textBaseline='middle';context.fillText(text,256,64);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const m=new T.MeshStandardMaterial({map,transparent:true,depthWrite:false,roughness:.6,polygonOffset:true,polygonOffsetFactor:-2});return mesh(new T.PlaneGeometry(w,h),m,p,x,y,z,'Surface marking');}
  // A lofted octagonal shell gives the nose and roof their characteristic chamfers.
  function hull(p,rings,m){const v=[],indices=[];for(const [z,w,lo,hi]of rings){const c=.13;v.push(-w+c,lo,z,w-c,lo,z,w,lo+c,z,w,hi-c,z,w-c,hi,z,-w+c,hi,z,-w,hi-c,z,-w,lo+c,z);}for(let k=0;k<rings.length-1;k++)for(let j=0;j<8;j++){let a=k*8+j,b=k*8+(j+1)%8,c=b+8,d=a+8;indices.push(a,b,d,b,c,d);}for(let j=1;j<7;j++){indices.push(0,j+1,j);const a=(rings.length-1)*8;indices.push(a,a+j,a+j+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(indices);g.computeVertexNormals();return mesh(g,m,p);}
  const body=part('Fuselage',[0,.3,0]);
  const hullMaterial=shell.clone();hullMaterial.flatShading=true;
  const bodyRings=[[-1.12,.38,1.04,1.63],[-.8,.49,.98,1.77],[.22,.56,.97,1.76],[.85,.49,1.05,1.57],[1.04,.39,1.13,1.48]];
  hull(body,bodyRings,hullMaterial);
  // Thin dark seals follow the loft stations instead of floating over the shell.
  for(const [z,w,lo,hi] of bodyRings.slice(1,-1)){
    const points=[[-w+.13,lo,z],[w-.13,lo,z],[w,lo+.13,z],[w,hi-.13,z],[w-.13,hi,z],[-w+.13,hi,z],[-w,hi-.13,z],[-w,lo+.13,z]];
    for(let j=0;j<8;j++)link(body,points[j],points[(j+1)%8],.0035,black);
  }
  const roof=part('Carbon top panels',[0,1.05,0]);
  box(roof,.73,.035,.9,0,1.775,-.3,carbon,.045);
  const hood=box(roof,.77,.035,.71,0,1.667,.5,carbon,.06);hood.rotation.x=.24;
  // Small three-lobed emblem, reconstructed as geometry from the reference.
  for(let i=0;i<3;i++){const petal=new T.Shape();petal.moveTo(0,.018);petal.quadraticCurveTo(-.045,.055,-.016,.091);petal.quadraticCurveTo(.014,.072,.02,.027);petal.closePath();const emblem=mesh(new T.ShapeGeometry(petal),silver,hood,0,.019,0,'Nose emblem');emblem.rotation.set(-Math.PI/2,0,i*Math.PI*2/3);}
  box(roof,.39,.13,.32,0,1.75,-.97,black);
  const power=mesh(new T.TorusGeometry(.063,.008,8,32,Math.PI*1.65),silver,roof,0,1.823,-.97);power.rotation.x=-Math.PI/2;
  box(roof,.012,.008,.07,0,1.826,-1.002,silver,.002);
  for(let i=0;i<9;i++)box(roof,.3,.01,.014,0,1.8,-.35+i*.029,black,.003);
  for(const s of [-1,1]){
    const panel=box(body,.012,.34,.79,s*.535,1.37,-.23,carbon,.006);panel.rotation.y=s*.068;
    box(body,.052,.18,.16,s*.515,1.56,-.73,black,.018);
    const ventFrame=box(body,.15,.018,.32,s*.45,1.66,.43,black,.018);ventFrame.rotation.z=-s*.6;ventFrame.rotation.x=.25;
    for(let i=0;i<10;i++){const fin=box(ventFrame,.132,.009,.008,0,.013,-.136+i*.03,shell,.002);}
    for(const z of [-.59,.07])for(const y of [1.23,1.5]){const bolt=cyl(body,.012,.009,s*.535,y,z,black);bolt.rotation.z=Math.PI/2;}
    for(let z of [-.72,.17,.77]){const screw=cyl(body,.018,.012,s*.43,1.69-(z>.5?.13:0),z,silver);}
  }
  for(const x of [-.29,0,.29]){
    const ring=cyl(body,x===0?.055:.082,.028,x,1.3,1.039,black);ring.rotation.x=Math.PI/2;
    const glass=cyl(body,x===0?.036:.057,.032,x,1.3,1.058,mat('#122a27',.8,.13));glass.rotation.x=Math.PI/2;
    const lens=cyl(body,.022,.034,x,1.3,1.063,black);lens.rotation.x=Math.PI/2;
  }
  // Four independently named motor / arm assemblies.
  for(const [i,s,zSign] of [[0,-1,1],[1,1,1],[2,-1,-1],[3,1,-1]]){
    const arm=part(`Arm ${i+1} and motor`,[s*.6,.12,zSign*.38]);
    const a=new T.Vector3(s*.43,1.3,zSign*.65),b=new T.Vector3(s*1.73,1.39,zSign*1.23);
    const midpoint=a.clone().lerp(b,.5),beam=box(arm,.19,.18,a.distanceTo(b),...midpoint.toArray(),carbon,.035);beam.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),b.clone().sub(a).normalize());
    box(arm,.29,.24,.29,...a.toArray(),shell,.06);
    for(const t of [.13,.86]){const center=a.clone().lerp(b,t);const sleeve=box(arm,.224,.207,.16,...center.toArray(),shell,.023);sleeve.quaternion.copy(beam.quaternion);screw(arm,center.x,center.y+.11,center.z);}
    const hinge=cyl(arm,.1,.025,a.x,1.433,a.z,black);screw(arm,a.x,1.451,a.z);
    // Raised inset on the upper arm and a readable side marking.
    const inset=box(arm,.105,.012,.72,midpoint.x,midpoint.y+.095,midpoint.z,carbon,.016);inset.quaternion.copy(beam.quaternion);
    const marking=decal(beam,'SKYPRO XT',.62,.065,.098,0,0);marking.rotation.y=Math.PI/2;
    cyl(arm,.205,.23,b.x,1.39,b.z,shell);cyl(arm,.157,.08,b.x,1.24,b.z,black,.115);
    cyl(arm,.18,.028,b.x,1.505,b.z,silver);cyl(arm,.17,.19,b.x,1.605,b.z,black);
    cyl(arm,.137,.018,b.x,1.709,b.z,silver);cyl(arm,.102,.027,b.x,1.719,b.z,black);
    for(const y of [1.29,1.46,1.52,1.69]){const band=mesh(new T.TorusGeometry(y<1.5?.201:.17,.006,6,48),black,arm,b.x,y,b.z);band.rotation.x=Math.PI/2;}
    for(let j=0;j<8;j++){const angle=j*Math.PI/4;const slot=box(arm,.041,.043,.012,b.x+Math.sin(angle)*.139,1.239,b.z+Math.cos(angle)*.139,black,.006);slot.rotation.y=angle;}
    for(let j=0;j<12;j++){const t=j*Math.PI/6;cyl(arm,.017,.03,b.x+Math.cos(t)*.126,1.715,b.z+Math.sin(t)*.126,copper);}
    const ledMat=new T.MeshStandardMaterial({color:s<0?'#24dd54':'#e52518',emissive:s<0?'#08ff25':'#ff1004',emissiveIntensity:1.2,toneMapped:false});
    box(arm,.25,.067,.029,b.x,1.38,b.z+zSign*.19,black,.018);
    box(arm,.21,.041,.027,b.x,1.38,b.z+zSign*.194,ledMat,.013);
    const rotor=new T.Group();rotor.name=`Rotor ${i+1}`;rotor.position.set(b.x,1.77,b.z);rotor.rotation.y=i%2?-.55:.55;arm.add(rotor);rotors.push(rotor);
    cyl(rotor,.095,.065,0,0,0,black);
    for(let j=0;j<4;j++){const t=j*Math.PI/2;cyl(rotor,.013,.012,Math.cos(t)*.067,.039,Math.sin(t)*.067,silver);}
    for(const sign of [-1,1]){
      const g=propellerGeometry(i===0||i===3?1:-1);
      const blade=mesh(g,[bladeMat,silver],rotor,0,.005,0,'Twisted two-blade propeller');blade.rotation.y=sign===1?0:Math.PI;
    }
  }
  const gear=part('Landing skids',[0,-.45,0]);
  for(const s of [-1,1]){
    link(gear,[s*.78,.105,-.99],[s*.78,.105,1.14],.048,carbon);
    for(const z of [-.96,1.11]){const cap=cyl(gear,.068,.16,s*.78,.105,z,rubber);cap.rotation.x=Math.PI/2;}
    for(const z of [-.65,.68]){
      link(gear,[s*.38,1.05,z*.8],[s*.78,.14,z],.047,carbon);
      link(gear,[s*.38,1.05,z*.8],[s*.47,.84,z*.86],.069,shell);
      const foot=cyl(gear,.071,.17,s*.78,.115,z,black);foot.rotation.x=Math.PI/2;
    }
  }
  const gimbal=part('Three axis gimbal',[0,-.5,.4]);
  box(gimbal,.47,.065,.32,0,1.005,.63,black);
  for(const x of [-.17,.17])cyl(gimbal,.056,.095,x,.94,.63,rubber);
  cyl(gimbal,.1,.15,0,.88,.63,black);
  box(gimbal,.42,.065,.12,0,.79,.61,black);
  for(const s of [-1,1]){box(gimbal,.055,.24,.11,s*.207,.685,.61,black);const motor=cyl(gimbal,.089,.09,s*.227,.61,.65,black);motor.rotation.z=Math.PI/2;}
  const cameraPivot=new T.Group();cameraPivot.name='Camera pitch';cameraPivot.position.set(0,.61,.65);gimbal.add(cameraPivot);
  box(cameraPivot,.36,.3,.29,0,0,.035,shell,.065);
  box(cameraPivot,.329,.272,.022,0,0,.181,black,.045);
  for(const s of [-1,1]){
    for(const y of [-.094,.094]){const fastener=cyl(cameraPivot,.01,.008,s*.129,y,.2,silver);fastener.rotation.x=Math.PI/2;}
    for(let j=0;j<6;j++)box(cameraPivot,.009,.09,.009,s*.18,.035,-.058+j*.025,black,.002);
    const hub=cyl(cameraPivot,.054,.012,s*.277,0,0,shell);hub.rotation.z=Math.PI/2;
  }
  for(const [r,h,z,m] of [[.133,.035,.188,black],[.108,.02,.213,silver],[.095,.025,.229,black],[.075,.012,.245,mat('#17362e',.8,.12)],[.049,.013,.251,mat('#0c1919',.7,.12)]]){const lens=cyl(cameraPivot,r,h,0,0,z,m);lens.rotation.x=Math.PI/2;}
  const glint=mesh(new T.SphereGeometry(.012,12,8),mat('#91b4b0',.6,.1),cameraPivot,-.024,.027,.26);glint.scale.z=.2;
  for(const r of [.059,.084,.119])mesh(new T.TorusGeometry(r,.003,8,64),black,cameraPivot,0,0,.248,'Lens concentric ring');
  const cablePath=new T.CatmullRomCurve3([[.08,.92,.55],[.14,.83,.5],[.14,.72,.49],[.08,.68,.5]].map(v=>new T.Vector3(...v)));
  mesh(new T.TubeGeometry(cablePath,24,.011,8,false),rubber,gimbal,0,0,0,'Gimbal cable');
  root.userData={description:'Visual reconstruction from figures/1–4.png; arbitrary units; no engineering dimensions.'};
  return {root,rotors,parts,cameraPivot};
}
