// research-landscape.js — per-theme canvas animations. Always loop; paused when off-screen.
(function(){
  // Pause each animation's rAF loop when its canvas is scrolled out of view.
  var __gatedRAF = function(canvas){
    var visible = true, pending = null;
    var raf = (window.requestAnimationFrame ? window.requestAnimationFrame.bind(window)
              : function(cb){ return setTimeout(function(){ cb(Date.now()); }, 16); });
    try {
      var io = new IntersectionObserver(function(es){
        var v = es[0].isIntersecting;
        if (v && !visible && pending){ var cb = pending; pending = null; raf(cb); }
        visible = v;
      }, { threshold: 0 });
      io.observe(canvas);
    } catch(e){ visible = true; }
    return function(cb){ if (visible) return raf(cb); pending = cb; return 0; };
  };
  var INIT = {};
  INIT[1] = function(canvas){
  var requestAnimationFrame = __gatedRAF(canvas);
  var ctx=canvas.getContext('2d'), w=1,h=1,dpr=1;
  function resize(){ dpr=Math.min(window.devicePixelRatio||1,2); var r=canvas.getBoundingClientRect(); w=Math.max(1,r.width); h=Math.max(1,r.height); canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); }
  resize(); window.addEventListener('resize', resize);

  // ---- palette ----
  var COL_GREEN='#39d353', COL_AMBER='#f0a500', COL_WHITE='#e6edf3', COL_MUTE='#9aa4b2', COL_BG='#0d1117';

  // ---- helpers ----
  function clamp(x,a,b){ return x<a?a:(x>b?b:x); }
  function smooth(e0,e1,x){ var t=clamp((x-e0)/(e1-e0),0,1); return t*t*(3-2*t); }
  function lerp(a,b,t){ return a+(b-a)*t; }
  // hash-based deterministic pseudo-random for stable per-object params
  function hash(n){ var s=Math.sin(n*127.1+311.7)*43758.5453; return s-Math.floor(s); }

  // disk geometry constants (in S units)
  var INCL=0.40;            // vertical squash -> ~36 deg inclination feel
  var R_IN=0.155, R_OUT=0.46; // disk radii
  var BH_R=0.115;           // black-hole shadow radius

  // captured-star population (Phase 1)
  var STARS=[];
  (function(){
    for(var i=0;i<7;i++){
      var seed=i+1;
      STARS.push({
        a0: lerp(0.34,0.46, hash(seed*3.1)),     // initial semi-major
        ecc0: lerp(0.45,0.72, hash(seed*5.7)),   // initial eccentricity
        inc0: lerp(0.7,1.25, hash(seed*7.3))*(hash(seed*2.2)<0.5?1:-1), // initial inclination (radians-ish tilt)
        node: hash(seed*9.9)*Math.PI*2,          // ascending node angle
        phase: hash(seed*11.4)*Math.PI*2,        // orbital phase
        speed: lerp(0.9,1.5, hash(seed*13.2)),   // angular speed
        isBH: hash(seed*4.4)<0.3,                // some are stellar BHs
        settle: lerp(6.0,16.0, hash(seed*6.1))   // time(s) to settle into plane
      });
    }
  })();

  // tiny static starfield (deterministic at setup)
  var FIELD=[];
  (function(){ for(var i=0;i<46;i++){ FIELD.push({x:Math.random(), y:Math.random(), b:0.25+Math.random()*0.6, tw:Math.random()*6.28}); } })();

  var start=null;

  // ---- background ----
  function drawBG(t){
    ctx.fillStyle=COL_BG; ctx.fillRect(0,0,w,h);
    for(var i=0;i<FIELD.length;i++){
      var s=FIELD[i];
      var a=s.b*(0.5+0.5*Math.sin(t*0.8+s.tw));
      ctx.globalAlpha=a*0.5;
      ctx.fillStyle=COL_WHITE;
      ctx.fillRect(s.x*w, s.y*h, 1, 1);
    }
    ctx.globalAlpha=1;
  }

  // ---- the accretion disk : the centerpiece ----
  // bright param scales overall luminosity (Phase 2 brightening), tint shifts hue toward red (Phase 3 flare unaffected)
  function drawDisk(cx,cy,S,t,bright){
    var rin=R_IN*S, rout=R_OUT*S, bhr=BH_R*S;
    var sq=INCL;               // vertical squash -> inclination (~36 deg)
    var rot=t*0.55;            // slow disk rotation (drives turbulence drift)

    // Draw the disk as ONE continuous smooth elliptical surface (radial gradients
    // in a (1, sq) scaled space). The only occluder is the round BH shadow: we
    // paint the full disk, then the shadow on top, then redraw just the near-side
    // crescent that passes in front of the lower shadow. No horizontal seam.

    // --- base radial color gradient: white-hot inner -> amber -> dim-red outer ---
    function baseGrad(){
      // gradient defined in scaled space: radius rin..rout from center
      var g=ctx.createRadialGradient(0,0,bhr*0.96, 0,0,rout);
      var b=clamp(bright,0,3);
      g.addColorStop(0.00,'rgba(255,252,246,'+clamp(0.95*b,0,1).toFixed(3)+')'); // white-hot
      g.addColorStop(0.16,'rgba(255,236,198,'+clamp(0.95*b,0,1).toFixed(3)+')');
      g.addColorStop(0.38,'rgba(248,176,52,'+clamp(0.80*b,0,1).toFixed(3)+')');  // amber/orange
      g.addColorStop(0.66,'rgba(208,96,18,'+clamp(0.46*b,0,1).toFixed(3)+')');
      g.addColorStop(0.86,'rgba(150,40,18,'+clamp(0.20*b,0,1).toFixed(3)+')');   // dim red
      g.addColorStop(1.00,'rgba(110,24,14,0)');
      return g;
    }

    // paint the full continuous annular surface (no half-plane clip).
    // Assumes ctx already translated to (cx,cy) and scaled (1,sq).
    function paintSurface(){
      // main surface
      ctx.fillStyle=baseGrad();
      ctx.beginPath(); ctx.arc(0,0,rout,0,Math.PI*2); ctx.fill();

      // punch out the inner hole so the surface is a clean annulus (smooth edge)
      ctx.globalCompositeOperation='destination-out';
      var hole=ctx.createRadialGradient(0,0,0, 0,0,rin*1.02);
      hole.addColorStop(0,'rgba(0,0,0,1)');
      hole.addColorStop(0.82,'rgba(0,0,0,1)');
      hole.addColorStop(1,'rgba(0,0,0,0)'); // soft feather, no hard ring
      ctx.fillStyle=hole;
      ctx.beginPath(); ctx.arc(0,0,rin*1.02,0,Math.PI*2); ctx.fill();
      ctx.globalCompositeOperation='source-over';

      // --- Doppler asymmetry: brighten right half, dim left half (smooth) ---
      ctx.globalCompositeOperation='lighter';
      var dop=ctx.createLinearGradient(-rout,0, rout,0);
      dop.addColorStop(0,'rgba(255,210,140,0)');
      dop.addColorStop(0.55,'rgba(255,210,150,0)');
      dop.addColorStop(1,'rgba(255,224,170,'+clamp(0.28*bright,0,1).toFixed(3)+')'); // right brighter
      ctx.fillStyle=dop;
      ctx.beginPath(); ctx.arc(0,0,rout,0,Math.PI*2); ctx.fill();

      ctx.globalCompositeOperation='source-over';
      var dim=ctx.createLinearGradient(-rout,0, rout,0);
      dim.addColorStop(0,'rgba(13,17,23,'+clamp(0.32,0,1).toFixed(3)+')'); // left receding, dimmer
      dim.addColorStop(0.45,'rgba(13,17,23,0)');
      dim.addColorStop(1,'rgba(13,17,23,0)');
      ctx.save();
      // restrict the dimming to the annulus so it doesn't darken the background
      ctx.beginPath(); ctx.arc(0,0,rout,0,Math.PI*2);
      ctx.arc(0,0,rin*0.98,0,Math.PI*2,true);
      ctx.clip('evenodd');
      ctx.fillStyle=dim;
      ctx.beginPath(); ctx.arc(0,0,rout,0,Math.PI*2); ctx.fill();
      ctx.restore();

      // --- smooth turbulent flicker: a few large soft drifting blobs (no grid) ---
      ctx.globalCompositeOperation='lighter';
      for(var bI=0;bI<5;bI++){
        var ph=bI*1.7;
        var ang=rot*0.9 + ph + Math.sin(t*0.5+ph)*0.6;
        var rad=lerp(rin*1.25,rout*0.9, 0.2+0.6*(0.5+0.5*Math.sin(t*0.37+ph*1.3)));
        var bxp=Math.cos(ang)*rad, byp=Math.sin(ang)*rad;
        var amp=(0.05+0.05*(0.5+0.5*Math.sin(t*1.9+ph*2.1)))*bright;
        var br=rout*0.34;
        var tg=ctx.createRadialGradient(bxp,byp,0, bxp,byp,br);
        tg.addColorStop(0,'rgba(255,206,120,'+clamp(amp,0,1).toFixed(3)+')');
        tg.addColorStop(1,'rgba(255,160,40,0)');
        ctx.fillStyle=tg;
        ctx.beginPath(); ctx.arc(bxp,byp,br,0,Math.PI*2); ctx.fill();
      }
      ctx.globalCompositeOperation='source-over';
    }

    // 1) FULL continuous disk surface (one piece -> no horizontal seam)
    ctx.save();
    ctx.translate(cx,cy); ctx.scale(1,sq);
    paintSurface();
    ctx.restore();

    // 2) black-hole shadow disc on top (occludes the far side directly behind it)
    ctx.save();
    ctx.beginPath(); ctx.arc(cx,cy,bhr,0,Math.PI*2);
    ctx.fillStyle=COL_BG; ctx.fill();
    // thin bright photon-ring edge
    ctx.lineWidth=2.0;
    ctx.shadowColor=COL_AMBER; ctx.shadowBlur=10*clamp(bright,0,2);
    ctx.strokeStyle='rgba(255,232,184,'+clamp(0.9*bright,0,1).toFixed(3)+')';
    ctx.beginPath(); ctx.arc(cx,cy,bhr,0,Math.PI*2); ctx.stroke();
    ctx.shadowBlur=0;
    ctx.restore();

    // 3) redraw ONLY the near-side crescent of the disk that passes in FRONT of
    //    the lower part of the shadow. Clip to the shadow disc, redraw the disk,
    //    then mask the upper (far) portion with a SOFT vertical alpha falloff so
    //    there is no straight horizontal edge anywhere.
    ctx.save();
    // clip region = inside the BH shadow circle (a curved boundary, no straight edge)
    ctx.beginPath(); ctx.arc(cx,cy,bhr*1.02,0,Math.PI*2); ctx.clip();
    // redraw the continuous disk surface within the shadow region
    ctx.save();
    ctx.translate(cx,cy); ctx.scale(1,sq);
    paintSurface();
    ctx.restore();
    // soft vertical alpha falloff: erase the upper (far) portion smoothly, keep the
    // lower near rim. Feathered over a band -> no hard horizontal line.
    ctx.globalCompositeOperation='destination-out';
    var occ=ctx.createLinearGradient(0, cy-bhr*1.1, 0, cy+bhr*0.35);
    occ.addColorStop(0.00,'rgba(0,0,0,1)');   // top: fully removed (far side behind hole)
    occ.addColorStop(0.62,'rgba(0,0,0,1)');
    occ.addColorStop(1.00,'rgba(0,0,0,0)');   // toward bottom: keep the near rim
    ctx.fillStyle=occ;
    ctx.fillRect(cx-bhr*1.2, cy-bhr*1.2, bhr*2.4, bhr*2.4);
    ctx.globalCompositeOperation='source-over';
    ctx.restore();

    // 4) hot inner-edge glow hugging the shadow (smooth elliptical radial)
    ctx.save();
    ctx.translate(cx,cy); ctx.scale(1,sq);
    ctx.globalCompositeOperation='lighter';
    var ig=ctx.createRadialGradient(0,0,bhr*0.9, 0,0,rin*1.7);
    ig.addColorStop(0,'rgba(255,250,240,'+clamp(0.55*bright,0,1).toFixed(3)+')');
    ig.addColorStop(0.5,'rgba(255,200,120,'+clamp(0.30*bright,0,1).toFixed(3)+')');
    ig.addColorStop(1,'rgba(240,165,0,0)');
    ctx.fillStyle=ig;
    ctx.beginPath(); ctx.arc(0,0,rin*1.7,0,Math.PI*2); ctx.fill();
    ctx.restore();

    // 5) subtle outer overall glow halo
    ctx.save();
    ctx.translate(cx,cy); ctx.scale(1,sq);
    ctx.globalCompositeOperation='lighter';
    var og=ctx.createRadialGradient(0,0,rin, 0,0,rout*1.28);
    og.addColorStop(0,'rgba(240,165,0,0)');
    og.addColorStop(0.7,'rgba(240,140,30,'+clamp(0.06*bright,0,1).toFixed(3)+')');
    og.addColorStop(1,'rgba(120,30,10,0)');
    ctx.fillStyle=og;
    ctx.beginPath(); ctx.arc(0,0,rout*1.28,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // map a point at angle th, radius r (S-units) on the disk plane to screen
  function diskPt(cx,cy,S,th,r){ return [cx+Math.cos(th)*r*S, cy+Math.sin(th)*r*S*INCL]; }

  // ---- Phase 1: disk capture ----
  function drawCapture(cx,cy,S,lt){
    // progress of capture across the phase (0..1)
    for(var i=0;i<STARS.length;i++){
      var st=STARS[i];
      var p=clamp(lt/st.settle,0,1);            // settle progress
      var ease=smooth(0,1,p);
      var a=lerp(st.a0, R_IN*1.0+0.06, ease);   // semi-major shrinks toward inner disk
      var ecc=lerp(st.ecc0, 0.04, ease);        // circularizes
      var inc=lerp(st.inc0, 0.0, ease);         // inclination damps to plane
      var th=st.phase + lt*st.speed*(1.0+ (1-ease)*0.3);
      // eccentric orbit radius
      var rr=a*(1-ecc*ecc)/(1+ecc*Math.cos(th));
      // position in orbital plane then tilt by inc around node line
      var ox=Math.cos(th)*rr, oy=Math.sin(th)*rr;
      // rotate by node
      var cn=Math.cos(st.node), sn=Math.sin(st.node);
      var px=ox*cn - oy*sn;
      var py=ox*sn + oy*cn;
      // inclination: tilt the y of the orbit (out-of-plane) -> add vertical offset that crosses zero each orbit
      var outZ=Math.sin(th)*Math.sin(inc)*rr; // out-of-plane component
      // screen: disk plane gets INCL squash; out-of-plane adds vertical
      var sx=cx + px*S;
      var sy=cy + py*S*INCL - outZ*S*0.85;

      // crossing flash: when |outZ| small and moving through plane -> dissipation spark
      var crossing = 1.0 - clamp(Math.abs(outZ)/(0.05),0,1);
      var flash = crossing*(1-ease)*0.9;

      // object color: green for stars, amber for BHs
      var col = st.isBH? COL_AMBER : COL_GREEN;
      var sz = st.isBH? 2.6 : 2.2;

      // trailing tail along orbit
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      for(var k=1;k<=6;k++){
        var thb=th - k*0.10*st.speed;
        var rrb=a*(1-ecc*ecc)/(1+ecc*Math.cos(thb));
        var oxb=Math.cos(thb)*rrb, oyb=Math.sin(thb)*rrb;
        var pxb=oxb*cn-oyb*sn, pyb=oxb*sn+oyb*cn;
        var outZb=Math.sin(thb)*Math.sin(inc)*rrb;
        var bx=cx+pxb*S, by=cy+pyb*S*INCL - outZb*S*0.85;
        ctx.globalAlpha=0.18*(1-k/7);
        ctx.fillStyle=col;
        ctx.beginPath(); ctx.arc(bx,by, sz*(1-k/9), 0,Math.PI*2); ctx.fill();
      }
      ctx.restore();

      // crossing dissipation spark
      if(flash>0.02){
        ctx.save();
        ctx.globalCompositeOperation='lighter';
        ctx.shadowColor=COL_WHITE; ctx.shadowBlur=8*flash;
        ctx.globalAlpha=flash;
        ctx.fillStyle=COL_WHITE;
        ctx.beginPath(); ctx.arc(sx,sy, sz+2.4*flash, 0,Math.PI*2); ctx.fill();
        ctx.restore();
      }

      // the object
      ctx.save();
      ctx.shadowColor=col; ctx.shadowBlur=6;
      ctx.fillStyle = st.isBH? '#1b1f27' : col;
      ctx.beginPath(); ctx.arc(sx,sy, sz, 0,Math.PI*2); ctx.fill();
      if(st.isBH){ ctx.strokeStyle=col; ctx.lineWidth=1.1; ctx.stroke(); }
      ctx.restore();
    }
  }

  // ---- Phase 2: changing-look TDE ----
  // returns extra disk brightness contributed this phase
  function drawTDE(cx,cy,S,lt){
    // timeline within phase (0..20)
    var streamGrow=smooth(0.0,7.0,lt);       // stream wraps in
    var feed=smooth(5.0,9.0,lt);             // begins feeding disk
    // brightening rise then fade
    var rise=smooth(6.0,11.0,lt);
    var fade=1.0-smooth(13.0,19.5,lt);
    var flareAmp=rise*fade;

    // a captured star that gets disrupted: comes from upper-left, stream spirals into inner disk
    var srcTh=2.6, srcR=R_OUT*1.15;
    // thin curved tidal stream: parametric inspiral
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    var turns=2.4;
    var N=70;
    ctx.lineWidth=2.0;
    for(var pass=0;pass<2;pass++){
      ctx.beginPath();
      var startedPt=false;
      for(var i=0;i<=N;i++){
        var u=i/N;                       // 0 outer .. 1 inner
        var vis = clamp((streamGrow- u)*2.0,0,1); // grows inward over time
        if(vis<=0) continue;
        var th = srcTh + u*turns*Math.PI*2 + lt*0.25;
        var r = lerp(srcR, R_IN*1.02, u);
        // gentle out-of-plane sag early, flattening to plane
        var sag = (1-u)*0.05*Math.sin(u*6.0)*(1-streamGrow*0.6);
        var pt=diskPt(cx,cy,S,th,r);
        var x=pt[0], y=pt[1]-sag*S;
        if(!startedPt){ ctx.moveTo(x,y); startedPt=true; } else ctx.lineTo(x,y);
      }
      var w0= pass===0? 3.2 : 1.4;
      ctx.lineWidth=w0;
      ctx.strokeStyle= pass===0? 'rgba(255,200,120,'+(0.35*streamGrow).toFixed(3)+')' : 'rgba(255,255,240,'+(0.5*streamGrow).toFixed(3)+')';
      ctx.shadowColor=COL_AMBER; ctx.shadowBlur= pass===0? 8:0;
      ctx.stroke();
      ctx.shadowBlur=0;
    }
    ctx.restore();

    // the doomed star head travelling along the stream (until disrupted)
    var headU=clamp(streamGrow,0,1);
    if(headU<0.96){
      var th=srcTh + headU*turns*Math.PI*2 + lt*0.25;
      var r=lerp(srcR,R_IN*1.02,headU);
      var hp=diskPt(cx,cy,S,th,r);
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      ctx.shadowColor=COL_WHITE; ctx.shadowBlur=7;
      ctx.fillStyle=COL_WHITE; ctx.globalAlpha=1-headU*0.4;
      ctx.beginPath(); ctx.arc(hp[0],hp[1], lerp(3.0,1.2,headU),0,Math.PI*2); ctx.fill();
      ctx.restore();
    }

    // bright feeding hot-spot where stream meets inner disk
    if(feed>0.01){
      var fp=diskPt(cx,cy,S, srcTh + turns*Math.PI*2 + lt*0.25, R_IN*1.05);
      var g=ctx.createRadialGradient(fp[0],fp[1],0, fp[0],fp[1], 0.14*S);
      g.addColorStop(0,'rgba(255,255,245,'+(0.8*flareAmp).toFixed(3)+')');
      g.addColorStop(0.4,'rgba(255,190,90,'+(0.5*flareAmp).toFixed(3)+')');
      g.addColorStop(1,'rgba(240,140,0,0)');
      ctx.save(); ctx.globalCompositeOperation='lighter';
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(fp[0],fp[1],0.14*S,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }

    return flareAmp; // feeds into disk brightness
  }

  // ---- Phase 3: micro-TDE around embedded stellar-mass BH ----
  function drawMicroTDE(cx,cy,S,lt){
    // off-center embedded BH location on the disk plane
    var bhTh=5.1 + lt*0.10;          // slowly orbits
    var bhR=R_OUT*0.72;
    var bp=diskPt(cx,cy,S,bhTh,bhR);
    var bx=bp[0], by=bp[1];

    // an incoming star is partially peeled
    var approach=smooth(0.0,6.0,lt);
    var flare=smooth(4.0,8.0,lt)*(1.0-smooth(12.0,19.0,lt)); // modest redder flare
    // star approaches the small BH then a fraction is stripped
    var starTh=bhTh+0.9 - approach*0.9;
    var starR=bhR + (1-approach)*0.10;
    var spt=diskPt(cx,cy,S,starTh,starR);

    ctx.save();
    // small redder flare around the off-center BH
    if(flare>0.01){
      var g=ctx.createRadialGradient(bx,by,0, bx,by, 0.10*S);
      g.addColorStop(0,'rgba(255,210,150,'+(0.7*flare).toFixed(3)+')');
      g.addColorStop(0.45,'rgba(240,120,40,'+(0.5*flare).toFixed(3)+')');
      g.addColorStop(1,'rgba(180,40,20,0)');
      ctx.globalCompositeOperation='lighter';
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(bx,by,0.10*S,0,Math.PI*2); ctx.fill();
    }

    // small partial-disruption stream from star toward BH ('peeled')
    if(approach>0.2){
      ctx.globalCompositeOperation='lighter';
      ctx.beginPath();
      var M=24;
      for(var i=0;i<=M;i++){
        var u=i/M;
        var th=lerp(starTh,bhTh,u) + Math.sin(u*4+lt)*0.04;
        var r=lerp(starR,bhR,u);
        var p=diskPt(cx,cy,S,th,r);
        if(i===0) ctx.moveTo(p[0],p[1]); else ctx.lineTo(p[0],p[1]);
      }
      ctx.lineWidth=1.6;
      ctx.strokeStyle='rgba(255,170,80,'+(0.55*flare+0.15).toFixed(3)+')';
      ctx.shadowColor=COL_AMBER; ctx.shadowBlur=5;
      ctx.stroke();
      ctx.shadowBlur=0;
    }
    ctx.restore();

    // the embedded stellar-mass BH (small dark dot with thin ring)
    ctx.save();
    ctx.fillStyle='#12161d';
    ctx.beginPath(); ctx.arc(bx,by, 3.0,0,Math.PI*2); ctx.fill();
    ctx.lineWidth=1.0; ctx.strokeStyle='rgba(255,200,140,0.9)'; ctx.stroke();
    ctx.restore();

    // the surviving (partially peeled) star
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    ctx.shadowColor=COL_GREEN; ctx.shadowBlur=5;
    ctx.fillStyle=COL_GREEN; ctx.globalAlpha=1-approach*0.3;
    ctx.beginPath(); ctx.arc(spt[0],spt[1], lerp(2.6,1.8,approach),0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // ---- phase label ----
  function label(txt, fade){
    ctx.save();
    ctx.globalAlpha=clamp(fade,0,1);
    ctx.fillStyle=COL_MUTE;
    ctx.font='10px -apple-system,Segoe UI,Helvetica,Arial,sans-serif';
    ctx.textBaseline='bottom';
    ctx.fillText(txt, 8, h-7);
    ctx.restore();
  }

  function frame(ts){
    if(start==null)start=ts;
    var t=(ts-start)/1000;
    if(w<2||h<2){ requestAnimationFrame(frame); return; }

    var T=60, lt=t%T;
    var cx=w/2, cy=h/2, S=Math.min(w,h);

    drawBG(t);

    // phase windows with cross-fade
    var XF=2.0; // crossfade seconds
    // base disk brightness; Phase 2 boosts it
    var bright=1.0;

    // compute phase fades
    var p1 = 1.0 - smooth(20-XF,20,lt);                 // 0..20 fading out near 20
    var p2 = smooth(20-XF,20,lt) - smooth(40-XF,40,lt); // 20..40
    var p3 = smooth(40-XF,40,lt) - smooth(60-XF,60,lt) + smooth(0, XF, lt)*0.0; // 40..60
    // ensure p3 fades out at the very end and p1 fades in at very start
    p1 = clamp(p1,0,1); p2=clamp(p2,0,1); p3=clamp(p3,0,1);
    // wrap fade-out of phase3 near 60 handled; fade-in of phase1 near 0
    var startFade=smooth(0,XF,lt);
    if(lt>60-XF){ var endf=1-smooth(60-XF,60,lt); p3*=1; }

    // Phase 2 brightening of the disk
    var tdeFlare=0;
    if(p2>0.001){ /* compute later, need lt local */ }

    // ---- draw disk (always present) ----
    // determine brightness boost from TDE phase
    if(p2>0.001){
      // peek tde flare amplitude for brightness (recompute lightweight)
      var lt2=lt-20;
      var riseB=smooth(6.0,11.0,lt2);
      var fadeB=1.0-smooth(13.0,19.5,lt2);
      tdeFlare=riseB*fadeB;
    }
    bright = 1.0 + tdeFlare*1.4*p2;        // dramatic brightening during phase 2
    // slight overall flicker
    bright *= 0.94+0.06*Math.sin(t*5.0)*Math.cos(t*2.3);

    drawDisk(cx,cy,S,t,bright);

    // ---- phase content ----
    if(p1>0.003){
      ctx.save(); ctx.globalAlpha=p1*startFade;
      drawCapture(cx,cy,S,lt);
      ctx.restore();
    }
    if(p2>0.003){
      ctx.save(); ctx.globalAlpha=p2;
      drawTDE(cx,cy,S,lt-20);
      ctx.restore();
    }
    if(p3>0.003){
      ctx.save(); ctx.globalAlpha=p3;
      drawMicroTDE(cx,cy,S,lt-40);
      ctx.restore();
    }

    // ---- label (pick dominant phase) ----
    if(p2>=p1 && p2>=p3) label('CHANGING-LOOK TDE', p2);
    else if(p3>=p1 && p3>=p2) label('MICRO-TDE', p3);
    else label('DISK CAPTURE', p1);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};
  INIT[2] = function(canvas){
  var requestAnimationFrame = __gatedRAF(canvas);
  var ctx=canvas.getContext('2d'), w=1,h=1,dpr=1;
  function resize(){ dpr=Math.min(window.devicePixelRatio||1,2); var r=canvas.getBoundingClientRect(); w=Math.max(1,r.width); h=Math.max(1,r.height); canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); }
  resize(); window.addEventListener('resize', resize);
  var TAU=Math.PI*2;
  var stars=[];
  for(var i=0;i<60;i++){ stars.push({x:Math.random(),y:Math.random(),r:Math.random()*0.9+0.2,tw:Math.random()*TAU}); }
  var COL={green:'#39d353',gold:'#f0a500',white:'#e6edf3',muted:'#9aa4b2'};
  function lerp(a,b,u){ return a+(b-a)*u; }
  function clamp(x,a,b){ return x<a?a:(x>b?b:x); }
  function smooth(u){ u=clamp(u,0,1); return u*u*(3-2*u); }
  function envelope(p,fin,fout){ var a=smooth(p/fin); var b=smooth((1-p)/fout); return Math.min(a,b); }
  function dot(x,y,r,col,glow){ if(glow){ ctx.shadowColor=col; ctx.shadowBlur=glow; } ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); if(glow) ctx.shadowBlur=0; }
  function orbitPath(fx,fy,a,e,rot,alpha,col){ var b=a*Math.sqrt(1-e*e); var cx=fx - a*e*Math.cos(rot); var cy=fy - a*e*Math.sin(rot); ctx.save(); ctx.globalAlpha=alpha; ctx.strokeStyle=col; ctx.lineWidth=1; ctx.translate(cx,cy); ctx.rotate(rot); ctx.beginPath(); ctx.ellipse(0,0,a,b,0,0,TAU); ctx.stroke(); ctx.restore(); }
  function label(txt,a){ ctx.save(); ctx.globalAlpha=a*0.9; ctx.fillStyle=COL.muted; ctx.font='600 10px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillText(txt,10,10); ctx.restore(); }
  function drawStars(t){ ctx.save(); for(var i=0;i<stars.length;i++){ var s=stars[i]; var a=0.25+0.25*Math.sin(t*1.3+s.tw); ctx.globalAlpha=a*0.6; ctx.fillStyle=COL.white; ctx.beginPath(); ctx.arc(s.x*w,s.y*h,s.r,0,TAU); ctx.fill(); } ctx.restore(); }
  var start=null;
  function frame(ts){ if(start==null)start=ts; var t=(ts-start)/1000;
    if(w<2||h<2){ requestAnimationFrame(frame); return; }
    var T=60, lt=t%T;
    ctx.fillStyle='#0d1117'; ctx.fillRect(0,0,w,h);
    drawStars(t);
    var cx=w/2, cy=h/2, S=Math.min(w,h);
    if(lt<23){
      var p=lt/22;
      var env=envelope(clamp(lt/22,0,1),0.08,0.06);
      ctx.save(); ctx.globalAlpha=env;
      var mergeP=0.86; var merged = p>mergeP;
      var koOsc = 0.5-0.5*Math.cos(p*TAU*3.0);
      var growth = lerp(0.55,0.97,smooth(p));
      var ecc = lerp(0.2, growth, koOsc); ecc=clamp(ecc,0.05,0.97);
      var outA=S*0.40; var oth= p*TAU*1.2;
      ctx.save(); ctx.globalAlpha=env*0.5; ctx.strokeStyle=COL.muted; ctx.lineWidth=1; ctx.translate(cx,cy); ctx.rotate(-0.5); ctx.beginPath(); ctx.ellipse(0,0,outA,outA*0.42,0,0,TAU); ctx.stroke(); ctx.restore();
      var tx=cx+Math.cos(-0.5)*(outA*Math.cos(oth)) - Math.sin(-0.5)*(outA*0.42*Math.sin(oth));
      var ty=cy+Math.sin(-0.5)*(outA*Math.cos(oth)) + Math.cos(-0.5)*(outA*0.42*Math.sin(oth));
      dot(tx,ty,S*0.034,'#1b2230',0);
      ctx.save(); ctx.globalAlpha=env*0.55; dot(tx,ty,S*0.045,COL.gold,8); ctx.restore();
      dot(tx,ty,S*0.030,'#0d1117',0);
      ctx.save(); ctx.globalAlpha=env; ctx.strokeStyle=COL.gold; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(tx,ty,S*0.030,0,TAU); ctx.stroke(); ctx.restore();
      var prec = p*TAU*0.8; var ibx=cx - S*0.02, iby=cy + S*0.02; var innA=S*0.16;
      if(!merged){
        orbitPath(ibx,iby,innA,ecc,prec,env*0.7,COL.green);
        var spd = 6.0/Math.max(0.15,(1-ecc)); var th = p*TAU*spd; var b=innA*Math.sqrt(1-ecc*ecc);
        var ce_x=ibx - innA*ecc*Math.cos(prec); var ce_y=iby - innA*ecc*Math.sin(prec);
        var ex=Math.cos(th)*innA, ey=Math.sin(th)*b;
        var rx1=ce_x+Math.cos(prec)*ex-Math.sin(prec)*ey; var ry1=ce_y+Math.sin(prec)*ex+Math.cos(prec)*ey;
        var rx2b=2*ce_x-rx1, ry2b=2*ce_y-ry1;
        dot(rx1,ry1,S*0.018,COL.white,7); dot(rx2b,ry2b,S*0.018,COL.white,7);
        if(ecc>0.9){ ctx.save(); ctx.globalAlpha=env*(ecc-0.9)*8; dot(ibx,iby,S*0.01,COL.gold,12); ctx.restore(); }
        ctx.save(); ctx.globalAlpha=env*0.6; ctx.fillStyle=COL.muted; ctx.font='9px ui-monospace,monospace'; ctx.textAlign='right'; ctx.textBaseline='bottom'; ctx.fillText('e='+ecc.toFixed(2),w-10,h-10); ctx.restore();
      } else {
        var mp=(p-mergeP)/(1-mergeP); var flash=Math.exp(-mp*6);
        ctx.save(); ctx.globalAlpha=env*flash; dot(ibx,iby,S*0.05*(0.5+flash),COL.white,30); dot(ibx,iby,S*0.10*flash,COL.gold,40); ctx.restore();
        for(var ri=0;ri<3;ri++){ var rr=S*0.04+mp*S*0.18 + ri*S*0.03; ctx.save(); ctx.globalAlpha=env*flash*0.6/(ri+1); ctx.strokeStyle=COL.gold; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(ibx,iby,rr,0,TAU); ctx.stroke(); ctx.restore(); }
        dot(ibx,iby,S*0.02,'#0d1117',0);
        ctx.save(); ctx.globalAlpha=env; ctx.strokeStyle=COL.white; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(ibx,iby,S*0.02,0,TAU); ctx.stroke(); ctx.restore();
      }
      ctx.restore();
      label('LIDOV–KOZAI ECCENTRIC MERGER',env);
    }
    if(lt>=21 && lt<43){
      var p2=clamp((lt-22)/20,0,1); var env2=envelope(p2,0.08,0.08);
      var xin=clamp((lt-21)/2,0,1); var xout=clamp((43-lt)/2,0,1); env2*=Math.min(xin,xout);
      ctx.save(); ctx.globalAlpha=env2;
      var mergeP2=0.70; var prog=clamp(p2/mergeP2,0,1); var sep=lerp(S*0.30, S*0.0, smooth(prog));
      var ang=p2*TAU*(2.0+prog*5.0); var m1=4, m2=1, mt=m1+m2; var r1=sep*(m2/mt), r2=sep*(m1/mt);
      var x1=cx+Math.cos(ang)*r1, y1=cy+Math.sin(ang)*r1; var x2=cx-Math.cos(ang)*r2, y2=cy-Math.sin(ang)*r2;
      var merged2 = p2>mergeP2;
      ctx.save(); ctx.globalAlpha=env2*0.25; ctx.strokeStyle=COL.muted; ctx.lineWidth=1; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(cx-S*0.34,cy); ctx.lineTo(cx+S*0.34,cy); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      function smbh(x,y,R,glowA){ var g=ctx.createRadialGradient(x,y,R*0.6,x,y,R*2.4); g.addColorStop(0,'rgba(240,165,0,'+(0.5*glowA)+')'); g.addColorStop(0.5,'rgba(240,165,0,'+(0.15*glowA)+')'); g.addColorStop(1,'rgba(240,165,0,0)'); ctx.save(); ctx.globalAlpha=env2; ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,R*2.4,0,TAU); ctx.fill(); ctx.restore(); dot(x,y,R,'#05070b',0); ctx.save(); ctx.globalAlpha=env2*0.8; ctx.strokeStyle=COL.gold; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(x,y,R,0,TAU); ctx.stroke(); ctx.restore(); }
      if(!merged2){
        smbh(x1,y1,S*0.05,0.9); smbh(x2,y2,S*0.028,0.7);
        function spinAxis(x,y,len,axang,col,a){ ctx.save(); ctx.globalAlpha=env2*a; ctx.strokeStyle=col; ctx.lineWidth=1.6; ctx.shadowColor=col; ctx.shadowBlur=6; ctx.beginPath(); ctx.moveTo(x-Math.cos(axang)*len,y-Math.sin(axang)*len); ctx.lineTo(x+Math.cos(axang)*len,y+Math.sin(axang)*len); ctx.stroke(); ctx.shadowBlur=0; ctx.restore(); }
        spinAxis(x1,y1,S*0.06,-Math.PI/2+0.15,COL.green,0.8); spinAxis(x2,y2,S*0.04,-Math.PI/2-0.2,COL.green,0.8);
      } else {
        var mp2=(p2-mergeP2)/(1-mergeP2); var flash2=Math.exp(-mp2*5);
        ctx.save(); ctx.globalAlpha=env2*flash2; dot(cx,cy,S*0.12*flash2,COL.white,40); dot(cx,cy,S*0.18*flash2,COL.gold,50); ctx.restore();
        for(var rj=0;rj<3;rj++){ var rr2=S*0.06+mp2*S*0.25+rj*S*0.04; ctx.save(); ctx.globalAlpha=env2*flash2*0.5/(rj+1); ctx.strokeStyle=COL.gold; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(cx,cy,rr2,0,TAU); ctx.stroke(); ctx.restore(); }
        smbh(cx,cy,S*0.06,0.9);
        var fromAng=-Math.PI/2; var toAng=-Math.PI/2 + lerp(0,2.2,smooth(mp2)); var curAng=lerp(fromAng,toAng,smooth(mp2)); var len=S*0.13;
        ctx.save(); ctx.globalAlpha=env2; ctx.strokeStyle=COL.white; ctx.lineWidth=2.2; ctx.shadowColor=COL.green; ctx.shadowBlur=12; ctx.beginPath(); ctx.moveTo(cx-Math.cos(curAng)*len,cy-Math.sin(curAng)*len); ctx.lineTo(cx+Math.cos(curAng)*len,cy+Math.sin(curAng)*len); ctx.stroke(); ctx.shadowBlur=0;
        dot(cx+Math.cos(curAng)*len,cy+Math.sin(curAng)*len,S*0.012,COL.green,10); dot(cx-Math.cos(curAng)*len,cy-Math.sin(curAng)*len,S*0.012,COL.green,10); ctx.restore();
        ctx.save(); ctx.globalAlpha=env2*0.3*(1-mp2*0.5); ctx.strokeStyle=COL.muted; ctx.setLineDash([3,3]); ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(cx-Math.cos(fromAng)*len,cy-Math.sin(fromAng)*len); ctx.lineTo(cx+Math.cos(fromAng)*len,cy+Math.sin(fromAng)*len); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        ctx.save(); ctx.globalAlpha=env2*0.6; ctx.fillStyle=COL.muted; ctx.font='9px ui-monospace,monospace'; ctx.textAlign='right'; ctx.textBaseline='bottom'; ctx.fillText('spin flip',w-10,h-10); ctx.restore();
      }
      ctx.restore();
      label('Sgr A* PAST MAJOR MERGER',env2);
    }
    if(lt>=41){
      var p3=clamp((lt-42)/18,0,1); var env3=envelope(p3,0.10,0.10); var x3in=clamp((lt-41)/2,0,1); env3*=x3in;
      ctx.save(); ctx.globalAlpha=env3;
      var cbAng=p3*TAU*1.5; var cbSep=S*0.07;
      var cbx1=cx+Math.cos(cbAng)*cbSep*0.5, cby1=cy+Math.sin(cbAng)*cbSep*0.5; var cbx2=cx-Math.cos(cbAng)*cbSep*0.5, cby2=cy-Math.sin(cbAng)*cbSep*0.5;
      var cg=ctx.createRadialGradient(cx,cy,S*0.02,cx,cy,S*0.16); cg.addColorStop(0,'rgba(240,165,0,0.35)'); cg.addColorStop(1,'rgba(240,165,0,0)'); ctx.save(); ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(cx,cy,S*0.16,0,TAU); ctx.fill(); ctx.restore();
      dot(cbx1,cby1,S*0.03,'#05070b',0); dot(cbx2,cby2,S*0.022,'#05070b',0);
      ctx.save(); ctx.strokeStyle=COL.gold; ctx.lineWidth=1; ctx.globalAlpha=env3*0.8; ctx.beginPath(); ctx.arc(cbx1,cby1,S*0.03,0,TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(cbx2,cby2,S*0.022,0,TAU); ctx.stroke(); ctx.restore();
      var ap=p3; var bx,by; var enterX=-0.55, enterY=0.18;
      if(ap<0.5){ var u=ap/0.5; bx=cx + S*lerp(enterX, -0.04, smooth(u)); by=cy + S*lerp(enterY, 0.0, smooth(u)); }
      else { var v=(ap-0.5)/0.5; var ej=v*v; bx=cx + S*lerp(-0.04, 0.95, ej); by=cy + S*lerp(0.0, -0.62, ej); }
      var ejecting = ap>0.5; var bSep=S*0.022; var bAng=p3*TAU*9.0;
      var d1x=bx+Math.cos(bAng)*bSep, d1y=by+Math.sin(bAng)*bSep; var d2x=bx-Math.cos(bAng)*bSep, d2y=by-Math.sin(bAng)*bSep;
      if(ejecting){ var v2=(ap-0.5)/0.5; ctx.save(); ctx.globalAlpha=env3*0.5; ctx.strokeStyle=COL.green; ctx.lineWidth=1.4; ctx.shadowColor=COL.green; ctx.shadowBlur=8; var steps=8; ctx.beginPath(); for(var k=0;k<=steps;k++){ var vv=Math.max(0,v2-(k/steps)*0.35); var ejk=vv*vv; var tx2=cx + S*lerp(-0.04,0.95,ejk); var ty2=cy + S*lerp(0.0,-0.62,ejk); if(k===0) ctx.moveTo(tx2,ty2); else ctx.lineTo(tx2,ty2); } ctx.stroke(); ctx.shadowBlur=0; ctx.restore(); }
      dot(d1x,d1y,S*0.013,COL.white,8); dot(d2x,d2y,S*0.013,COL.green,8);
      ctx.save(); ctx.globalAlpha=env3*0.5; ctx.strokeStyle=COL.muted; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(d1x,d1y); ctx.lineTo(d2x,d2y); ctx.stroke(); ctx.restore();
      if(ejecting){ ctx.save(); ctx.globalAlpha=env3*0.6; ctx.fillStyle=COL.muted; ctx.font='9px ui-monospace,monospace'; ctx.textAlign='right'; ctx.textBaseline='bottom'; ctx.fillText('v ≫ v_esc (bound pair)',w-10,h-10); ctx.restore(); }
      ctx.restore();
      label('HYPERVELOCITY BINARY EJECTION',env3);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};
  INIT[3] = function(canvas){
  var requestAnimationFrame = __gatedRAF(canvas);
  var ctx=canvas.getContext('2d'), w=1,h=1,dpr=1;
  function resize(){ dpr=Math.min(window.devicePixelRatio||1,2); var r=canvas.getBoundingClientRect(); w=Math.max(1,r.width); h=Math.max(1,r.height); canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); }
  resize(); window.addEventListener('resize', resize);

  var seed=20260626>>>0;
  function rnd(){ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; }
  var bg=[];
  for(var i=0;i<64;i++){ bg.push({x:rnd(),y:rnd(),r:0.3+rnd()*1.1,p:rnd()*6.283,tw:0.4+rnd()*0.9}); }

  var T=60, PI2=6.283185307;
  var C={green:'#39d353',gold:'#f0a500',white:'#e6edf3',muted:'#9aa4b2',bg:'#0d1117'};

  function ss(a,b,x){ if(b===a)return x<a?0:1; var t=(x-a)/(b-a); if(t<0)t=0; if(t>1)t=1; return t*t*(3-2*t); }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function dot(x,y,r,col,blur,alpha){
    ctx.save(); ctx.globalAlpha=alpha==null?1:alpha;
    if(blur){ ctx.shadowBlur=blur; ctx.shadowColor=col; }
    ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,y,r,0,PI2); ctx.fill(); ctx.restore();
  }
  function orbit(cx,cy,a,e,arg,alpha,col){
    if(a<=0||e>=1||e<0||alpha<=0) return;
    var b=a*Math.sqrt(1-e*e), c=a*e;
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(arg); ctx.translate(-c,0);
    ctx.globalAlpha=alpha; ctx.strokeStyle=col; ctx.lineWidth=0.7;
    ctx.beginPath(); ctx.ellipse(0,0,a,b,0,0,PI2); ctx.stroke(); ctx.restore();
  }
  function epos(cx,cy,a,e,arg,E){
    var b=a*Math.sqrt(1-e*e), c=a*e;
    var px=a*Math.cos(E)-c, py=b*Math.sin(E);
    var ca=Math.cos(arg), sa=Math.sin(arg);
    return {x:cx+px*ca-py*sa, y:cy+px*sa+py*ca};
  }
  function flyby(cx,cy,u,len,imp,dir,bend){
    var x=u*len, y=imp - (imp>=0?bend:-bend)*Math.exp(-(u*u)*6);
    var c=Math.cos(dir), s=Math.sin(dir);
    return {x:cx+x*c-y*s, y:cy+x*s+y*c};
  }
  function label(txt,alpha){
    ctx.save(); ctx.globalAlpha=alpha; ctx.fillStyle=C.muted;
    ctx.font='10px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif';
    ctx.textBaseline='top'; ctx.fillText(txt,10,9); ctx.restore();
  }

  var start=null;
  function frame(ts){ if(start==null)start=ts; var t=(ts-start)/1000;
    if(w<2||h<2){ requestAnimationFrame(frame); return; }
    var lt=t%T;

    ctx.fillStyle=C.bg; ctx.fillRect(0,0,w,h);
    for(i=0;i<bg.length;i++){ var sbg=bg[i];
      ctx.globalAlpha=0.22+0.4*(0.5+0.5*Math.sin(t*sbg.tw+sbg.p));
      ctx.fillStyle=C.muted; ctx.beginPath(); ctx.arc(sbg.x*w,sbg.y*h,sbg.r,0,PI2); ctx.fill();
    }
    ctx.globalAlpha=1;

    var cx=w/2, cy=h/2, S=Math.min(w,h);
    var ph=Math.floor(lt/15), lp=lt-ph*15, prog=lp/15;
    var fade=ss(0,1.3,lp)*ss(15,13.7,lp);
    var lbA=ss(0.5,1.7,lp)*ss(15,13.2,lp);
    function host(){ dot(cx,cy,3.4,C.white, fade>0.25?10:0, fade); }

    if(ph===0){
      var t0=0.16,t1=0.42,t2=0.80;
      var aIn0=0.20*S, aHot=0.072*S, aIn, eIn;
      if(prog<t0){ eIn=0.05; aIn=aIn0; }
      else if(prog<t1){ var k=ss(t0,t1,prog); eIn=lerp(0.05,0.9,k); aIn=lerp(aIn0,aIn0*0.95,k); }
      else if(prog<t2){ var k2=ss(t1,t2,prog); eIn=lerp(0.9,0.02,k2); aIn=lerp(aIn0*0.95,aHot,k2); }
      else { eIn=0.02; aIn=aHot; }
      var argIn=0.6;
      var aOut=lerp(0.34*S,0.46*S,ss(t0,t2,prog));
      var eOut=lerp(0.04,0.16,ss(t0,t2,prog));
      var argOut=2.4;
      orbit(cx,cy,aIn,eIn,argIn,fade*0.85,C.gold);
      orbit(cx,cy,aOut,eOut,argOut,fade*0.7,C.green);
      host();
      var pin=epos(cx,cy,aIn,eIn,argIn,(t*2.2)%PI2);
      var pout=epos(cx,cy,aOut,eOut,argOut,(t*0.85)%PI2);
      dot(pin.x,pin.y,2.6,C.gold,8,fade);
      dot(pout.x,pout.y,2.2,C.green,0,fade);
      var u=lerp(-1.0,1.0,ss(0.02,0.62,prog));
      var f=flyby(cx,cy,u,0.85*S,-0.30*S,-0.5,0.10*S);
      var fbA=fade*ss(0.03,0.12,prog)*ss(0.7,0.55,prog);
      if(fbA>0.01) dot(f.x,f.y,2.4,C.white,8,fbA);
      label('HOT JUPITER MIGRATION',lbA);
    }
    else if(ph===1){
      var argA=0.3,argB=2.0, aA=0.16*S,aB=0.30*S, eA=0.04,eB=0.07;
      var tE=0.45;
      orbit(cx,cy,aA,eA,argA,fade*0.85,C.gold);
      if(prog<tE) orbit(cx,cy,aB,eB,argB,fade*0.7*ss(tE+0.04,tE-0.12,prog),C.green);
      host();
      var pA=epos(cx,cy,aA,eA,argA,(t*1.6)%PI2);
      dot(pA.x,pA.y,2.4,C.gold,8,fade);
      var wB=0.95, pB;
      if(prog<tE){ pB=epos(cx,cy,aB,eB,argB,(lt*wB)%PI2); }
      else {
        var p0=epos(cx,cy,aB,eB,argB,((tE*15)*wB)%PI2);
        var dx=p0.x-cx, dy=p0.y-cy, dl=Math.hypot(dx,dy)||1; dx/=dl; dy/=dl;
        var tx=-dy, ty=dx;
        var ex=dx*0.85+tx*0.55, ey=dy*0.85+ty*0.55, el=Math.hypot(ex,ey); ex/=el; ey/=el;
        var d=ss(tE,1.0,prog)*0.95*S;
        pB={x:p0.x+ex*d, y:p0.y+ey*d};
      }
      dot(pB.x,pB.y,2.2,C.green, prog>tE?9:0, fade);
      var u1=lerp(-1.0,1.1,ss(0.05,0.7,prog));
      var f1=flyby(cx,cy,u1,0.9*S,0.22*S,2.6,0.09*S);
      var fbA1=fade*ss(0.05,0.15,prog)*ss(0.65,0.5,prog);
      if(fbA1>0.01) dot(f1.x,f1.y,2.4,C.white,8,fbA1);
      label('FREE-FLOATING PLANET',lbA);
    }
    else if(ph===2){
      var argA2=0.9,argB2=2.6, aA2=0.20*S,aB2=0.31*S, eA2=0.05,eB2=0.06;
      var tE2=0.42, wA2=1.3, wB2=0.95;
      if(prog<tE2){
        orbit(cx,cy,aA2,eA2,argA2,fade*0.75*ss(tE2+0.04,tE2-0.12,prog),C.gold);
        orbit(cx,cy,aB2,eB2,argB2,fade*0.7*ss(tE2+0.04,tE2-0.12,prog),C.green);
      }
      host();
      var g1,g2;
      if(prog<tE2){
        g1=epos(cx,cy,aA2,eA2,argA2,(lt*wA2)%PI2);
        g2=epos(cx,cy,aB2,eB2,argB2,(lt*wB2)%PI2);
      } else {
        var p1=epos(cx,cy,aA2,eA2,argA2,((tE2*15)*wA2)%PI2);
        var p2=epos(cx,cy,aB2,eB2,argB2,((tE2*15)*wB2)%PI2);
        var comx=(p1.x+p2.x)/2, comy=(p1.y+p2.y)/2;
        var k=ss(tE2,1.0,prog);
        var dx2=comx-cx, dy2=comy-cy, dl2=Math.hypot(dx2,dy2)||1; dx2/=dl2; dy2/=dl2;
        var d2=k*0.82*S, ccx=comx+dx2*d2, ccy=comy+dy2*d2;
        var sep=lerp(0.034*S,0.046*S,k), pa=lt*2.4;
        g1={x:ccx+Math.cos(pa)*sep, y:ccy+Math.sin(pa)*sep};
        g2={x:ccx-Math.cos(pa)*sep, y:ccy-Math.sin(pa)*sep};
        ctx.save(); ctx.globalAlpha=fade*0.55; ctx.strokeStyle=C.muted; ctx.lineWidth=0.6;
        ctx.beginPath(); ctx.arc(ccx,ccy,sep,0,PI2); ctx.stroke();
        ctx.globalAlpha=fade*0.35; ctx.beginPath(); ctx.moveTo(g1.x,g1.y); ctx.lineTo(g2.x,g2.y); ctx.stroke();
        ctx.restore();
      }
      dot(g1.x,g1.y,2.6,C.gold,8,fade);
      dot(g2.x,g2.y,2.4,C.green,6,fade);
      var u2=lerp(-1.0,1.1,ss(0.05,0.7,prog));
      var f2=flyby(cx,cy,u2,0.9*S,-0.20*S,0.4,0.09*S);
      var fbA2=fade*ss(0.05,0.15,prog)*ss(0.6,0.45,prog);
      if(fbA2>0.01) dot(f2.x,f2.y,2.4,C.white,8,fbA2);
      label('JuMBO',lbA);
    }
    else {
      var argA3=1.2,argB3=2.8, aA3=0.15*S,aB3=0.28*S, eA3=0.04,eB3=0.06;
      var tC=0.5, wB3=1.0;
      var u3=lerp(-1.0,1.1,ss(0.05,0.85,prog));
      var f3=flyby(cx,cy,u3,0.95*S,0.14*S,-2.3,0.06*S);
      orbit(cx,cy,aA3,eA3,argA3,fade*0.85,C.gold);
      if(prog<tC) orbit(cx,cy,aB3,eB3,argB3,fade*0.7*ss(tC+0.04,tC-0.14,prog),C.green);
      host();
      var pA3=epos(cx,cy,aA3,eA3,argA3,(t*1.7)%PI2);
      dot(pA3.x,pA3.y,2.4,C.gold,8,fade);
      var pB3;
      if(prog<tC){ pB3=epos(cx,cy,aB3,eB3,argB3,(lt*wB3)%PI2); }
      else {
        var sep3=0.05*S, pa3=lt*2.6;
        pB3={x:f3.x+Math.cos(pa3)*sep3, y:f3.y+Math.sin(pa3)*sep3};
        ctx.save(); ctx.globalAlpha=fade*0.5; ctx.strokeStyle=C.green; ctx.lineWidth=0.6;
        ctx.beginPath(); ctx.arc(f3.x,f3.y,sep3,0,PI2); ctx.stroke(); ctx.restore();
      }
      dot(pB3.x,pB3.y,2.3,C.green, prog>tC?7:0, fade);
      var fbA3=fade*ss(0.05,0.15,prog);
      dot(f3.x,f3.y,2.6,C.white,8,fbA3);
      label('GIANT-PLANET SWAP',lbA);
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};
  INIT[4] = function(canvas){
  var requestAnimationFrame = __gatedRAF(canvas);
  var ctx=canvas.getContext('2d'), w=1,h=1,dpr=1;
  function resize(){ dpr=Math.min(window.devicePixelRatio||1,2); var r=canvas.getBoundingClientRect(); w=Math.max(1,r.width); h=Math.max(1,r.height); canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); }
  resize(); window.addEventListener('resize', resize);

  var GREEN='#39d353', GOLD='#f0a500', WHITE='#e6edf3', MUTED='#9aa4b2';
  var R=function(){ return Math.random(); };
  var ejecta=[]; for(var i=0;i<40;i++){ var a=R()*Math.PI*2; ejecta.push({a:a, rr:0.55+R()*0.45, sz:0.6+R()*1.2, ph:R()*6.283}); }
  var stars=[]; for(i=0;i<46;i++){ stars.push({x:R(), y:R(), s:0.4+R()*1.0, tw:R()*6.283}); }
  var photons=[]; for(i=0;i<34;i++){ photons.push({a0:(R()-0.5)*0.5, spd:0.5+R()*0.7, jit:R()*6.283, delay:R()*0.5, side:R()<0.5?1:-1, off:(R()-0.5)*0.4}); }

  var start=null;
  function lerp(a,b,t){ return a+(b-a)*t; }
  function clamp01(x){ return x<0?0:(x>1?1:x); }
  function env(x,s0,s1,e){ var a=clamp01((x-s0)/e), b=clamp01((s1-x)/e); return Math.min(a,b); }

  function label(txt,alpha){
    ctx.globalAlpha=alpha*0.9; ctx.fillStyle=MUTED;
    ctx.font='10px ui-monospace,Menlo,monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText(txt, 10, h-12); ctx.globalAlpha=1;
  }

  function drawStars(t,alpha){
    ctx.fillStyle=WHITE;
    for(var i=0;i<stars.length;i++){ var s=stars[i]; var tw=0.4+0.6*(0.5+0.5*Math.sin(t*1.3+s.tw));
      ctx.globalAlpha=alpha*tw*0.5; ctx.beginPath(); ctx.arc(s.x*w, s.y*h, s.s, 0, 6.283); ctx.fill(); }
    ctx.globalAlpha=1;
  }

  function phase1(t,lt,alpha){
    var cx=w/2, cy=h/2, S=Math.min(w,h);
    var prog=clamp01(lt/30);
    drawStars(t,alpha*0.7);

    var shellR=S*(0.10+0.34*prog);
    ctx.save();
    var sg=ctx.createRadialGradient(cx,cy,shellR*0.55,cx,cy,shellR);
    sg.addColorStop(0,'rgba(240,165,0,0)');
    sg.addColorStop(0.85,'rgba(240,165,0,'+(0.05*alpha)+')');
    sg.addColorStop(1,'rgba(240,165,0,0)');
    ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(cx,cy,shellR,0,6.283); ctx.fill();
    for(var i=0;i<ejecta.length;i++){ var e=ejecta[i];
      var rr=shellR*e.rr; var ex=cx+Math.cos(e.a)*rr, ey=cy+Math.sin(e.a)*rr;
      var fl=0.5+0.5*Math.sin(t*0.8+e.ph);
      ctx.globalAlpha=alpha*0.28*fl; ctx.fillStyle=MUTED;
      ctx.beginPath(); ctx.arc(ex,ey,e.sz,0,6.283); ctx.fill();
    }
    ctx.globalAlpha=1; ctx.restore();

    var bubL=S*(0.05+0.40*prog);
    var bubW=S*(0.03+0.10*prog);
    ctx.save();
    for(var pole=-1;pole<=1;pole+=2){
      var lg=ctx.createRadialGradient(cx,cy+pole*bubL*0.45,0, cx,cy+pole*bubL*0.45, bubL*0.7);
      lg.addColorStop(0,'rgba(57,211,83,'+(0.30*alpha)+')');
      lg.addColorStop(0.5,'rgba(57,211,83,'+(0.12*alpha)+')');
      lg.addColorStop(1,'rgba(57,211,83,0)');
      ctx.fillStyle=lg;
      ctx.beginPath();
      ctx.ellipse(cx, cy+pole*bubL*0.42, bubW, bubL*0.62, 0, 0, 6.283);
      ctx.fill();
    }
    ctx.restore();

    var jetLen=bubL*0.95;
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    for(pole=-1;pole<=1;pole+=2){
      var jg=ctx.createLinearGradient(cx,cy, cx, cy+pole*jetLen);
      jg.addColorStop(0,'rgba(230,237,243,'+(0.55*alpha)+')');
      jg.addColorStop(0.4,'rgba(240,165,0,'+(0.30*alpha)+')');
      jg.addColorStop(1,'rgba(240,165,0,0)');
      ctx.strokeStyle=jg; ctx.lineWidth=Math.max(1.5,S*0.012); ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx, cy+pole*jetLen); ctx.stroke();
      for(var k=0;k<5;k++){
        var fp=((t*0.5 + k*0.2 + (pole>0?0:0.1))%1);
        var py=cy+pole*jetLen*fp;
        ctx.globalAlpha=alpha*(1-fp)*0.8; ctx.fillStyle=GOLD;
        ctx.beginPath(); ctx.arc(cx, py, Math.max(1,S*0.008*(1-fp*0.5)), 0, 6.283); ctx.fill();
      }
    }
    ctx.globalAlpha=1; ctx.restore();

    var spin=t*2.2;
    var nsR=Math.max(2.2,S*0.018);
    ctx.save();
    ctx.strokeStyle='rgba(57,211,83,'+(0.5*alpha)+')'; ctx.lineWidth=1;
    for(var f=0;f<3;f++){
      var ang=spin + f*Math.PI/3;
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(ang);
      var aw=nsR*3.2;
      ctx.beginPath(); ctx.moveTo(0,-nsR*0.5);
      ctx.bezierCurveTo(aw,-nsR*2.2, aw,nsR*2.2, 0,nsR*0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,-nsR*0.5);
      ctx.bezierCurveTo(-aw,-nsR*2.2, -aw,nsR*2.2, 0,nsR*0.5); ctx.stroke();
      ctx.restore();
    }
    var pulse=0.7+0.3*Math.sin(t*8);
    ctx.shadowBlur=14; ctx.shadowColor=WHITE;
    var cg=ctx.createRadialGradient(cx,cy,0,cx,cy,nsR*2);
    cg.addColorStop(0,'rgba(230,237,243,'+(alpha)+')');
    cg.addColorStop(0.5,'rgba(230,237,243,'+(0.6*alpha*pulse)+')');
    cg.addColorStop(1,'rgba(57,211,83,0)');
    ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(cx,cy,nsR*2,0,6.283); ctx.fill();
    ctx.shadowBlur=0; ctx.restore();

    label('MAGNETAR ENGINE', alpha);
  }

  function phase2(t,lt,alpha){
    var cx=w/2, cy=h/2, S=Math.min(w,h);
    var local=lt-30;
    drawStars(t,alpha*0.4);

    var diskH=S*0.30, diskHalf=diskH/2;
    ctx.save();
    var dg=ctx.createLinearGradient(0, cy-diskHalf, 0, cy+diskHalf);
    dg.addColorStop(0,'rgba(240,165,0,0)');
    dg.addColorStop(0.5,'rgba(240,165,0,'+(0.34*alpha)+')');
    dg.addColorStop(1,'rgba(240,165,0,0)');
    ctx.fillStyle=dg; ctx.fillRect(0, cy-diskHalf, w, diskH);
    ctx.globalAlpha=alpha*0.18; ctx.strokeStyle=GOLD; ctx.lineWidth=1;
    for(var i=0;i<6;i++){
      var yy=cy-diskHalf + diskH*(i+0.5)/6;
      ctx.beginPath();
      for(var x=0;x<=w;x+=8){ var yo=Math.sin(x*0.04 + t*0.6 + i)*2.0; if(x===0)ctx.moveTo(x,yy+yo); else ctx.lineTo(x,yy+yo); }
      ctx.stroke();
    }
    ctx.globalAlpha=1; ctx.restore();

    var burst=(local%8)/8;
    var srcx=cx, srcy=cy;
    var jetReach=clamp01(burst*3);

    ctx.save();
    ctx.globalCompositeOperation='lighter';
    if(burst<0.35){
      var sharpA=alpha*(0.35-burst)/0.35;
      var topY=srcy - diskHalf*0.8*jetReach;
      var bg=ctx.createLinearGradient(srcx,srcy,srcx,topY);
      bg.addColorStop(0,'rgba(230,237,243,'+(0.8*sharpA)+')');
      bg.addColorStop(1,'rgba(120,170,255,0)');
      ctx.strokeStyle=bg; ctx.lineWidth=Math.max(1.5,S*0.012); ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(srcx,srcy); ctx.lineTo(srcx,topY); ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation='lighter';
    for(i=0;i<photons.length;i++){
      var p=photons[i];
      var ph=((local*0.10*p.spd + p.delay)%1);
      var dist=Math.sqrt(ph)*(diskHalf + S*0.32);
      var spread=ph;
      var baseAng=-Math.PI/2 + p.a0;
      var ang=lerp(baseAng, baseAng + p.off*Math.PI*1.6, spread);
      ang += Math.sin(local*1.2 + p.jit)*0.15*spread;
      var px=srcx + Math.cos(ang)*dist;
      var py=srcy + Math.sin(ang)*dist;
      var redT=clamp01(ph*1.3);
      var col;
      if(redT<0.5){ var u=redT/0.5; col='rgb('+Math.round(lerp(230,240,u))+','+Math.round(lerp(237,165,u))+','+Math.round(lerp(243,0,u))+')'; }
      else { var u2=(redT-0.5)/0.5; col='rgb('+Math.round(lerp(240,200,u2))+','+Math.round(lerp(165,40,u2))+',0)'; }
      var aa=alpha*(1-ph)*0.7;
      var sz=Math.max(1, S*0.012*(0.5+ph*0.9));
      ctx.globalAlpha=aa; ctx.fillStyle=col;
      ctx.beginPath(); ctx.arc(px,py,sz,0,6.283); ctx.fill();
    }
    ctx.globalAlpha=1; ctx.restore();

    var emA=alpha*0.5*(0.6+0.4*Math.sin(local*0.5));
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    for(var side=-1;side<=1;side+=2){
      var gy=cy + side*diskHalf*1.1;
      var eg=ctx.createRadialGradient(cx,gy,0,cx,gy,S*0.30);
      eg.addColorStop(0,'rgba(220,90,30,'+(0.30*emA)+')');
      eg.addColorStop(0.5,'rgba(200,60,20,'+(0.10*emA)+')');
      eg.addColorStop(1,'rgba(200,40,10,0)');
      ctx.fillStyle=eg; ctx.beginPath(); ctx.ellipse(cx,gy,S*0.30,S*0.20,0,0,6.283); ctx.fill();
    }
    ctx.restore();

    var fl=0.6+0.4*Math.sin(local*7);
    ctx.shadowBlur=10; ctx.shadowColor=GOLD;
    ctx.fillStyle='rgba(240,165,0,'+(alpha*fl)+')';
    ctx.beginPath(); ctx.arc(srcx,srcy,Math.max(1.6,S*0.012),0,6.283); ctx.fill();
    ctx.shadowBlur=0;

    label('GRB IN AN AGN DISK', alpha);
  }

  function frame(ts){ if(start==null)start=ts; var t=(ts-start)/1000;
    if(w<2||h<2){ requestAnimationFrame(frame); return; }
    var T=60, lt=t%T;
    ctx.fillStyle='#0d1117'; ctx.fillRect(0,0,w,h);
    var a1=env(lt,0,30,2.5);
    var a2=env(lt,30,60,2.5);
    if(a1>0.01) phase1(t,lt,a1);
    if(a2>0.01) phase2(t,lt,a2);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};
  INIT[5] = function(canvas){
  var requestAnimationFrame = __gatedRAF(canvas);
  var ctx=canvas.getContext('2d'), w=1,h=1,dpr=1;
  function resize(){ dpr=Math.min(window.devicePixelRatio||1,2); var r=canvas.getBoundingClientRect(); w=Math.max(1,r.width); h=Math.max(1,r.height); canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); }
  resize(); window.addEventListener('resize', resize);

  var GREEN='#39d353', AMBER='#f0a500', WHITE='#e6edf3', MUTED='#9aa4b2', BG='#0d1117';

  var nbSteps=4200, dt=0.0016;
  var bodies=[
    {m:6.0, x:0.00, y:0.00, vx:0.00, vy:0.00},
    {m:0.9, x:0.62, y:0.00, vx:0.00, vy:1.05},
    {m:0.45,x:-0.30,y:0.14, vx:-0.62,vy:-1.25}
  ];
  var G=0.45, soft=0.0006;
  var SAMP=520;
  var traj=[[],[],[]];
  var enc={t:1, sep:1e9};
  (function integrate(){
    function accel(){
      var ax=[0,0,0], ay=[0,0,0];
      for(var i=0;i<3;i++){ for(var j=0;j<3;j++){ if(i===j)continue;
        var dx=bodies[j].x-bodies[i].x, dy=bodies[j].y-bodies[i].y;
        var d2=dx*dx+dy*dy+soft, d=Math.sqrt(d2), f=G*bodies[j].m/(d2*d);
        ax[i]+=f*dx; ay[i]+=f*dy;
      }}
      return [ax,ay];
    }
    var sampleEvery=nbSteps/SAMP;
    var a=accel();
    for(var s=0;s<nbSteps;s++){
      for(var i=0;i<3;i++){ bodies[i].vx+=0.5*dt*a[0][i]; bodies[i].vy+=0.5*dt*a[1][i]; }
      for(var i=0;i<3;i++){ bodies[i].x+=dt*bodies[i].vx; bodies[i].y+=dt*bodies[i].vy; }
      a=accel();
      for(var i=0;i<3;i++){ bodies[i].vx+=0.5*dt*a[0][i]; bodies[i].vy+=0.5*dt*a[1][i]; }
      if(s % sampleEvery < 1){
        for(var i=0;i<3;i++) traj[i].push({x:bodies[i].x,y:bodies[i].y});
        var dx=bodies[1].x-bodies[2].x, dy=bodies[1].y-bodies[2].y, sep=Math.sqrt(dx*dx+dy*dy);
        if(sep<enc.sep){ enc.sep=sep; enc.t=traj[0].length-1; }
      }
    }
  })();
  var NS=traj[0].length;
  var P1DUR=28;

  var minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9;
  for(var i=0;i<3;i++)for(var k=0;k<NS;k++){var p=traj[i][k];if(p.x<minx)minx=p.x;if(p.x>maxx)maxx=p.x;if(p.y<miny)miny=p.y;if(p.y>maxy)maxy=p.y;}
  var cx0=(minx+maxx)/2, cy0=(miny+maxy)/2, span=Math.max(maxx-minx,maxy-miny)*1.18;

  var bands=[
    {name:'X-ray',  c:WHITE, logtp:-0.55, rise:1.6, decay:-1.25, amp:1.00},
    {name:'optical',c:AMBER, logtp: 0.15, rise:1.0, decay:-1.05, amp:0.90},
    {name:'radio',  c:GREEN, logtp: 1.15, rise:0.9, decay:-0.55, amp:0.78}
  ];
  var LT0=-1.5, LT1=2.5, LF0=-2.6, LF1=0.25;
  function fluxLog(b, lt){
    var x = Math.pow(10, lt - b.logtp), sh=1.4;
    var val = b.amp / Math.pow( Math.pow(x, -b.rise*sh) + Math.pow(x, -b.decay*sh), 1/sh );
    return Math.log10(val + 1e-6);
  }

  var T=60, start=null;
  function lerp(a,b,u){return a+(b-a)*u;}
  function clamp(v,a,b){return v<a?a:v>b?b:v;}
  function smooth(u){u=clamp(u,0,1);return u*u*(3-2*u);}

  function drawLabel(txt, alpha){
    if(alpha<=0.01)return;
    ctx.save(); ctx.globalAlpha=alpha; ctx.fillStyle=MUTED;
    ctx.font='10px ui-monospace, Menlo, monospace'; ctx.textBaseline='top';
    ctx.fillText(txt, 10, 9); ctx.restore();
  }
  function drawGrid(cx,cy,S,alpha){
    if(alpha<=0.01)return;
    ctx.save(); ctx.globalAlpha=alpha*0.5; ctx.strokeStyle='#1b2230'; ctx.lineWidth=1;
    var step=S*0.11;
    for(var gx=cx-Math.ceil(w/step)*step; gx<w; gx+=step){ if(gx<0)continue; ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,h);ctx.stroke(); }
    for(var gy=cy-Math.ceil(h/step)*step; gy<h; gy+=step){ if(gy<0)continue; ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(w,gy);ctx.stroke(); }
    ctx.restore();
  }

  function phase1(lp, fade){
    var cx=w/2, cy=h/2, S=Math.min(w,h), sc=S/span;
    function X(wx){return cx+(wx-cx0)*sc;}
    function Y(wy){return cy+(wy-cy0)*sc;}
    drawGrid(cx,cy,S,fade);
    var u=clamp(lp/P1DUR,0,1);
    var head=clamp(Math.floor(u*(NS-1)),1,NS-1);
    var trailLen=Math.floor(NS*0.55);
    for(var i=0;i<3;i++){
      var col=[WHITE,AMBER,GREEN][i];
      ctx.save(); ctx.lineCap='round';
      var startk=Math.max(0, head-trailLen);
      for(var k=startk+1;k<=head;k++){
        var p0=traj[i][k-1], p1=traj[i][k];
        var age=(head-k)/trailLen;
        ctx.globalAlpha=fade*(1-age)*0.85; ctx.strokeStyle=col;
        ctx.lineWidth=lerp(0.4,1.7,1-age);
        ctx.beginPath(); ctx.moveTo(X(p0.x),Y(p0.y)); ctx.lineTo(X(p1.x),Y(p1.y)); ctx.stroke();
      }
      ctx.restore();
    }
    for(var i=0;i<3;i++){
      var col=[WHITE,AMBER,GREEN][i], rad=[3.6,2.3,1.9][i], p=traj[i][head];
      ctx.save(); ctx.globalAlpha=fade; ctx.shadowColor=col; ctx.shadowBlur=10;
      ctx.fillStyle=col; ctx.beginPath(); ctx.arc(X(p.x),Y(p.y),rad,0,Math.PI*2); ctx.fill(); ctx.restore();
    }
    var encWindow=Math.abs(head-enc.t)/(NS*0.06);
    if(encWindow<1){
      var pa=traj[1][enc.t], pb=traj[2][enc.t];
      var mx=(X(pa.x)+X(pb.x))/2, my=(Y(pa.y)+Y(pb.y))/2, fl=(1-encWindow);
      ctx.save(); ctx.globalAlpha=fade*fl*0.9;
      var rg=ctx.createRadialGradient(mx,my,0,mx,my,S*0.14);
      rg.addColorStop(0,'rgba(230,237,243,0.9)');
      rg.addColorStop(0.4,'rgba(240,165,0,0.35)');
      rg.addColorStop(1,'rgba(13,16,22,0)');
      ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(mx,my,S*0.14,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=fade*fl; ctx.fillStyle=MUTED; ctx.font='9px ui-monospace, Menlo, monospace';
      ctx.fillText('chain-regularized close approach', 10, h-18); ctx.restore();
    }
    drawLabel('SPACEHUB - CLOSE ENCOUNTER', fade);
  }

  function phase2(lp, fade){
    var P2DUR=28;
    var u=smooth(clamp(lp/P2DUR,0,1));
    var pad=Math.min(w,h)*0.16;
    var x0=pad*0.95, y0=pad*0.55, x1=w-pad*0.7, y1=h-pad*0.95;
    function PX(lt){return lerp(x0,x1,(lt-LT0)/(LT1-LT0));}
    function PY(lf){return lerp(y1,y0,(lf-LF0)/(LF1-LF0));}
    ctx.save(); ctx.globalAlpha=fade*0.5; ctx.strokeStyle='#1b2230'; ctx.lineWidth=1;
    for(var d=Math.ceil(LT0); d<=Math.floor(LT1); d++){ var xx=PX(d); ctx.beginPath();ctx.moveTo(xx,y0);ctx.lineTo(xx,y1);ctx.stroke(); }
    for(var d=Math.ceil(LF0); d<=Math.floor(LF1); d++){ var yy=PY(d); ctx.beginPath();ctx.moveTo(x0,yy);ctx.lineTo(x1,yy);ctx.stroke(); }
    ctx.globalAlpha=fade*0.8; ctx.strokeStyle=MUTED; ctx.lineWidth=1.1;
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x0,y1); ctx.lineTo(x1,y1); ctx.stroke();
    ctx.globalAlpha=fade*0.85; ctx.fillStyle=MUTED; ctx.font='8px ui-monospace, Menlo, monospace';
    ctx.fillText('log Fv', x0-2, y0-11); ctx.fillText('log t', x1-26, y1+5); ctx.restore();
    var ltHead=lerp(LT0,LT1,u), STEPS=80;
    for(var bi=0;bi<bands.length;bi++){
      var b=bands[bi];
      ctx.save(); ctx.strokeStyle=b.c; ctx.lineWidth=1.6; ctx.lineCap='round'; ctx.lineJoin='round';
      ctx.shadowColor=b.c; ctx.shadowBlur=5; ctx.globalAlpha=fade; ctx.beginPath();
      var started=false, lastx=0,lasty=0;
      for(var s=0;s<=STEPS;s++){
        var lt=lerp(LT0,LT1,s/STEPS);
        if(lt>ltHead) break;
        var lf=fluxLog(b,lt), px=PX(lt), py=PY(clamp(lf,LF0,LF1));
        if(!started){ctx.moveTo(px,py);started=true;}else ctx.lineTo(px,py);
        lastx=px; lasty=py;
      }
      ctx.stroke();
      if(started){ ctx.shadowBlur=8; ctx.fillStyle=b.c; ctx.beginPath(); ctx.arc(lastx,lasty,2.2,0,Math.PI*2); ctx.fill(); }
      ctx.restore();
    }
    ctx.save(); ctx.globalAlpha=fade*0.9; ctx.font='8px ui-monospace, Menlo, monospace';
    var ly=y0+2;
    for(var bi=0;bi<bands.length;bi++){
      var b=bands[bi];
      ctx.fillStyle=b.c; ctx.fillRect(x1-52, ly, 8,2.5);
      ctx.fillStyle=MUTED; ctx.fillText(b.name, x1-40, ly-3); ly+=11;
    }
    ctx.restore();
    drawLabel('VEGASAFTERGLOW - LIGHT CURVES', fade);
  }

  function frame(ts){ if(start==null)start=ts; var t=(ts-start)/1000;
    if(w<2||h<2){ requestAnimationFrame(frame); return; }
    var lt=t%T;
    ctx.fillStyle=BG; ctx.fillRect(0,0,w,h);
    var cross=1.5;
    if(lt<30){
      var f1=1;
      if(lt<cross) f1=smooth(lt/cross); else if(lt>30-cross) f1=smooth((30-lt)/cross);
      phase1(lt, f1);
      if(lt>30-cross){ var f2=smooth((lt-(30-cross))/cross); phase2(0, f2); }
    } else {
      var lp=lt-30, f2=1;
      if(lp<cross) f2=smooth(lp/cross); else if(lp>30-cross) f2=smooth((30-lp)/cross);
      phase2(lp, f2);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

  function boot(){
    var cards=document.querySelectorAll('canvas[data-theme]');
    for(var i=0;i<cards.length;i++){(function(cv){var n=parseInt(cv.getAttribute('data-theme'),10);
      try{ if(INIT[n]) INIT[n](cv); }catch(e){ if(window.console&&console.error) console.error('landscape anim '+n,e); }})(cards[i]);}
  }
  if(document.readyState!=='loading') boot(); else document.addEventListener('DOMContentLoaded',boot);
})();
