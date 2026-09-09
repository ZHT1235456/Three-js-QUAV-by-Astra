import * as T from 'three';

/** Closed loft with outward winding, smooth spanwise taper and mirrored pitch. */
export function propellerGeometry(handedness = 1) {
  const profile = new T.CatmullRomCurve3([
    [.055,.032,0],[.14,.047,.008],[.23,.087,.025],[.34,.128,.036],
    [.48,.119,.025],[.7,.086,.004],[.94,.051,-.017],[1.015,.042,-.023],[1.035,.025,-.02],
  ].map(p => new T.Vector3(...p)), false, 'centripetal');
  const span = 64, chord = 16, stride = (chord + 1) * 2;
  const vertices = [], indices = [];
  const geometry = new T.BufferGeometry();
  const triangle = (a,b,c) => indices.push(a,b,c);
  for (let n=0;n<=span;n++) {
    const {x,y:width,z:sweep} = profile.getPoint(n/span);
    const twist = .28-x*.19;
    for (let side=0;side<2;side++) for (let k=0;k<=chord;k++) {
      const u = k/chord*2-1;
      const thickness = .002 + .007 * Math.sqrt(Math.max(0,1-u*u));
      vertices.push(x, Math.sin(twist)*u*width + (side===0?thickness:-thickness), handedness*(sweep+u*width));
    }
  }
  for(let n=0;n<span;n++) {
    const start = indices.length;
    for(let k=0;k<chord;k++) {
      const a=n*stride+k,b=a+stride,c=a+chord+1,d=b+chord+1;
      triangle(a,a+1,b);triangle(b,a+1,b+1);
      triangle(c,d,c+1);triangle(d,d+1,c+1);
    }
    for(const k of [0,chord]) {
      const a=n*stride+k,b=a+stride,c=a+chord+1,d=b+chord+1;
      if(k===0){triangle(a,b,c);triangle(b,d,c);}
      else{triangle(a,c,b);triangle(b,c,d);}
    }
    geometry.addGroup(start,indices.length-start,profile.getPoint(n/span).x>=.96?1:0);
  }
  const start=indices.length;
  for(const n of [0,span])for(let k=0;k<chord;k++) {
    const a=n*stride+k,c=a+chord+1;
    if(n===0){triangle(a,c,a+1);triangle(a+1,c,c+1);}
    else{triangle(a,a+1,c);triangle(a+1,c+1,c);}
  }
  geometry.addGroup(start,indices.length-start,0);
  if(handedness<0)for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return geometry;
}
