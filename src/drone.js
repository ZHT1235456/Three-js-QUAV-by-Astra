import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Image-derived proportions. Y is up; +Z is the nose. No physical scale is asserted.
export function createDrone() {
  const root = new T.Group(); root.name = 'Reference quadrotor';
  const parts = [], rotors = [];
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d'); ctx.fillStyle='#45494c';ctx.fillRect(0,0,128,128);
  for(let y=0;y<128;y+=8)for(let x=0;x<128;x+=8){const flip=((x+y)/8)%2;ctx.fillStyle=flip?'#33383b':'#515659';ctx.fillRect(x,y,7,7);ctx.strokeStyle=flip?'#555a5c':'#3c4144';for(let n=1;n<7;n+=2){ctx.beginPath();ctx.moveTo(x+(flip?n:0),y+(flip?0:n));ctx.lineTo(x+(flip?n:7),y+(flip?7:n));ctx.stroke();}}
  const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(3,3);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;
  const mat=(color,metalness=.3,roughness=.5)=>new T.MeshStandardMaterial({color,metalness,roughness});
  const shell=mat('#42474b'), carbon=new T.MeshStandardMaterial({color:'#93999e',map:texture,metalness:.48,roughness:.48}), black=mat('#141a1e',.55,.34), rubber=mat('#252b2e',.05,.8), silver=mat('#a0a7ab',.8,.26), bladeMat=mat('#34393d',.3,.48), copper=mat('#9e6233',.75,.3);
  function mesh(g,m,p,x=0,y=0,z=0,name=''){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.name=name;o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
  function box(p,w,h,d,x,y,z,m=shell,r=.04){return mesh(new RoundedBoxGeometry(w,h,d,2,r),m,p,x,y,z);}
  function cyl(p,r,h,x,y,z,m=black,r2=r){return mesh(new T.CylinderGeometry(r,r2,h,32),m,p,x,y,z);}
  function link(p,a,b,r,m=carbon){const v=new T.Vector3(...a),w=new T.Vector3(...b),o=cyl(p,r,v.distanceTo(w),...(v.clone().add(w).multiplyScalar(.5).toArray()),m);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),w.sub(v).normalize());return o;}
  function part(name,offset){const p=new T.Group();p.name=name;root.add(p);parts.push({group:p,offset:new T.Vector3(...offset)});return p;}
  // A lofted octagonal shell gives the nose and roof their characteristic chamfers.
  function hull(p,rings,m){const v=[],indices=[];for(const [z,w,lo,hi]of rings){const c=.13;v.push(-w+c,lo,z,w-c,lo,z,w,lo+c,z,w,hi-c,z,w-c,hi,z,-w+c,hi,z,-w,hi-c,z,-w,lo+c,z);}for(let k=0;k<rings.length-1;k++)for(let j=0;j<8;j++){let a=k*8+j,b=k*8+(j+1)%8,c=b+8,d=a+8;indices.push(a,b,d,b,c,d);}for(let j=1;j<7;j++){indices.push(0,j+1,j);const a=(rings.length-1)*8;indices.push(a,a+j,a+j+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(indices);g.computeVertexNormals();return mesh(g,m,p);}
  const body=part('Fuselage',[0,.3,0]);
  hull(body,[[-1.12,.38,1.04,1.63],[-.8,.49,.98,1.77],[.22,.56,.97,1.76],[.85,.49,1.05,1.57],[1.04,.39,1.13,1.48]],shell);
  const roof=part('Carbon top panels',[0,1.05,0]);
  box(roof,.73,.035,.9,0,1.775,-.3,carbon,.045);
  const hood=box(roof,.77,.035,.71,0,1.667,.5,carbon,.06);hood.rotation.x=.24;
  box(roof,.39,.13,.32,0,1.75,-.97,black);
  const power=mesh(new T.TorusGeometry(.063,.008,8,32,Math.PI*1.65),silver,roof,0,1.823,-.97);power.rotation.x=-Math.PI/2;
  box(roof,.012,.008,.07,0,1.826,-1.002,silver,.002);
  for(let i=0;i<9;i++)box(roof,.3,.01,.014,0,1.8,-.35+i*.029,black,.003);
  for(const s of [-1,1]){
    const panel=box(body,.022,.34,.79,s*.509,1.37,-.23,carbon,.008);panel.rotation.z=s*.07;
    box(body,.052,.18,.16,s*.515,1.56,-.73,black,.018);
    for(let i=0;i<8;i++){const vent=box(body,.021,.105,.016,s*.517,1.58,.3+i*.038,black,.003);vent.rotation.z=s*-.55;}
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
    cyl(arm,.205,.23,b.x,1.39,b.z,shell);cyl(arm,.157,.08,b.x,1.24,b.z,black,.115);
    cyl(arm,.18,.028,b.x,1.505,b.z,silver);cyl(arm,.17,.19,b.x,1.605,b.z,black);
    cyl(arm,.137,.018,b.x,1.709,b.z,silver);cyl(arm,.102,.027,b.x,1.719,b.z,black);
    for(let j=0;j<12;j++){const t=j*Math.PI/6;cyl(arm,.017,.03,b.x+Math.cos(t)*.126,1.715,b.z+Math.sin(t)*.126,copper);}
    const ledMat=new T.MeshStandardMaterial({color:s<0?'#8aff9e':'#ff7166',emissive:s<0?'#22ff54':'#ff2319',emissiveIntensity:3});
    box(arm,.21,.041,.027,b.x,1.38,b.z+zSign*.194,ledMat,.013);
    const rotor=new T.Group();rotor.name=`Rotor ${i+1}`;rotor.position.set(b.x,1.77,b.z);rotor.rotation.y=i%2?-.55:.55;arm.add(rotor);rotors.push(rotor);
    cyl(rotor,.095,.065,0,0,0,black);
    for(let j=0;j<4;j++){const t=j*Math.PI/2;cyl(rotor,.013,.012,Math.cos(t)*.067,.039,Math.sin(t)*.067,silver);}
    for(const sign of [-1,1]){
      const shape=new T.Shape();shape.moveTo(.055,-.035);shape.bezierCurveTo(.22,-.065,.25,-.15,.4,-.135);shape.lineTo(.99,-.062);shape.quadraticCurveTo(1.06,-.05,1.035,-.012);shape.lineTo(.39,.08);shape.quadraticCurveTo(.23,.087,.055,.035);
      const g=new T.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.004,bevelThickness:.003});g.rotateX(-Math.PI/2);
      const blade=mesh(g,bladeMat,rotor,0,.005,0);blade.rotation.y=sign===1?0:Math.PI;
      const tip=box(rotor,.064,.016,.068,sign*.987,.012,sign*.032,silver,.009);tip.rotation.y=sign===1?.08:Math.PI+.08;
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
  for(const [r,h,z,m] of [[.133,.035,.188,black],[.108,.02,.213,silver],[.095,.025,.229,black],[.075,.012,.245,mat('#17362e',.8,.12)],[.049,.013,.251,mat('#0c1919',.7,.12)]]){const lens=cyl(cameraPivot,r,h,0,0,z,m);lens.rotation.x=Math.PI/2;}
  const glint=mesh(new T.SphereGeometry(.012,12,8),mat('#91b4b0',.6,.1),cameraPivot,-.024,.027,.26);glint.scale.z=.2;
  root.userData={description:'Visual reconstruction from figures/1–4.png; arbitrary units; no engineering dimensions.'};
  return {root,rotors,parts,cameraPivot};
}
