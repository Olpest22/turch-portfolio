import { useEffect, useRef } from 'react';

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

// Light ribbons: twisted metallic bands lit in sodium orange, with soft bloom and grain.
const FRAG = `precision highp float;
uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uIntro;
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec2 frag=gl_FragCoord.xy;
  float aspect=uRes.x/uRes.y;
  vec2 uv=frag/uRes.y;
  float xn=uv.x/aspect;
  vec3 col=vec3(0.);
  for(int i=0;i<7;i++){
    float fi=float(i);
    float sp=0.16+0.05*fi;
    float ph=uTime*sp+fi*1.9;
    float portrait=clamp((1.15-aspect)/0.6,0.,1.);
    float land=-0.17+0.8*smoothstep(0.14,1.05,xn)+fi*0.042;
    float port=0.02+0.2*smoothstep(0.,1.,xn)+fi*0.03;
    float base=mix(land,port,portrait);
    float amp=mix(1.,0.7,portrait);
    float y=base+amp*(0.075*sin(uv.x*(1.25+0.17*fi)+ph)+0.035*sin(uv.x*(2.9-0.21*fi)-ph*0.8));
    float mx=uMouse.x*aspect;
    y+=(uMouse.y-0.5)*0.22*exp(-pow(uv.x-mx,2.)*2.2);
    float reveal=smoothstep(uIntro*(aspect+0.6)-0.6,uIntro*(aspect+0.6)-0.15,uv.x);
    reveal=1.-reveal;
    float tw=sin(uv.x*(1.6+0.3*fi)+ph*1.3+fi);
    float th=(0.006+0.022*abs(tw))*(1.0-0.08*fi);
    float d=uv.y-y;
    float s=d/max(th,1e-4);
    float body=smoothstep(1.0,0.55,abs(s));
    float spec=pow(max(0.,1.-abs(s-0.35*tw)),10.);
    float rim=pow(max(0.,1.-abs(abs(s)-0.85)*4.),2.)*0.5;
    bool chrome=(i==1||i==4);
    vec3 orange=mix(vec3(1.,0.33,0.05),vec3(1.,0.55,0.18),0.5+0.5*sin(fi+uv.x*0.7));
    vec3 tint=chrome?mix(vec3(0.42,0.40,0.38),vec3(1.,0.62,0.36),0.55+0.45*tw):orange*(0.55+0.45*abs(tw));
    vec3 hot=chrome?vec3(1.,0.95,0.9):vec3(1.,0.86,0.62);
    vec3 c=tint*body*(0.35+0.65*abs(tw))+hot*spec*body*1.4+tint*rim;
    float glow=exp(-abs(d)*(chrome?70.:26.))*(chrome?0.06:0.22)*(0.5+0.5*abs(tw));
    c+=orange*glow;
    col+=c*reveal;
  }
  vec2 q=frag/uRes;
  float vig=smoothstep(1.25,0.35,length((q-vec2(0.62,0.42))*vec2(1.,1.25)));
  col*=0.35+0.65*vig;
  col=1.-exp(-col*1.35);
  col+=(hash(frag+fract(uTime))-0.5)*0.035;
  vec3 bg=vec3(0.039,0.035,0.031);
  gl_FragColor=vec4(bg+col,1.);
}`;

export function Ribbons({ className }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) {
      cv.dataset.fallback = 'true';
      return;
    }
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      cv.dataset.fallback = 'true';
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uMouse = gl.getUniformLocation(prog, 'uMouse');
    const uIntro = gl.getUniformLocation(prog, 'uIntro');

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = { x: 0.62, y: 0.5 };
    const mouse = { x: 0.62, y: 0.5 };
    let raf = 0;
    let visible = true;
    let start = performance.now();
    let quality = 1;
    let slow = 0;
    let lastNow = 0;

    const resize = () => {
      const small = window.innerWidth < 760;
      const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5) * quality;
      const w = Math.floor(cv.clientWidth * dpr);
      const h = Math.floor(cv.clientHeight * dpr);
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const draw = (now: number) => {
      resize();
      const t = reduced ? 6 : (now - start) / 1000 + 6;
      const intro = reduced ? 1 : Math.min(1, (now - start) / 1600);
      const e = 1 - Math.pow(1 - intro, 3);
      mouse.x += (target.x - mouse.x) * 0.05;
      mouse.y += (target.y - mouse.y) * 0.05;
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uIntro, e);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      // Drop resolution on weak GPUs: 20 slow frames in a row → render fewer pixels.
      if (lastNow && now - lastNow > 28 && quality > 0.45) {
        if (++slow > 20) {
          quality = Math.max(0.45, quality - 0.2);
          slow = 0;
        }
      } else slow = Math.max(0, slow - 1);
      lastNow = now;
      draw(now);
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    };

    const onMove = (ev: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      target.x = (ev.clientX - r.left) / r.width;
      target.y = 1 - (ev.clientY - r.top) / r.height;
    };

    const io = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting && document.visibilityState === 'visible';
      if (visible && !was && !reduced) raf = requestAnimationFrame(loop);
    });
    io.observe(cv);
    const onVis = () => {
      const was = visible;
      visible = document.visibilityState === 'visible';
      if (visible && !was && !reduced) raf = requestAnimationFrame(loop);
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pointermove', onMove, { passive: true });
    const onResize = () => reduced && draw(performance.now());
    window.addEventListener('resize', onResize);

    start = performance.now();
    raf = requestAnimationFrame(loop);
    cv.dataset.ready = 'true';

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvas} className={className} aria-hidden="true" />;
}
