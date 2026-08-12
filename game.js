
(function(){
  const WORLD = {w:1400,h:1000};
  const buildings = {
    home:{name:"집",x:120,y:280,w:220,h:170,doorX:230,doorY:450,actions:["휴식","공부","식사","샤워","취침"]},
    school:{name:"학교",x:875,y:220,w:320,h:230,doorX:1035,doorY:450,actions:["수업","공부","친구와 대화"]},
    field:{name:"운동장",x:840,y:690,w:390,h:190,doorX:1035,doorY:675,actions:["기술훈련","러닝","스트레칭"]},
    gym:{name:"헬스장",x:135,y:700,w:245,h:180,doorX:258,doorY:685,actions:["웨이트","스트레칭"]},
    shop:{name:"편의점",x:480,y:80,w:220,h:150,doorX:590,doorY:230,actions:["간식 구매","음료 구매"]}
  };

  let state=null,ctx=null,raf=null,last=0,near=null;
  let keys={up:false,down:false,left:false,right:false};
  let roomRAF=null;

  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function timeText(m){
    const h=Math.floor(m/60)%24,mm=Math.floor(m%60);
    return String(h).padStart(2,"0")+":"+String(mm).padStart(2,"0");
  }
  function setupCanvas(c){
    const r=c.getBoundingClientRect();
    const dpr=Math.min(devicePixelRatio||1,2);
    c.width=Math.round(r.width*dpr);
    c.height=Math.round(r.height*dpr);
  }
  function round(ctx,x,y,w,h,r,fill,stroke){
    ctx.beginPath();ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    if(fill){ctx.fillStyle=fill;ctx.fill()}
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}
  }
  function shade(hex,amt){
    hex=hex.replace("#","");
    if(hex.length===3)hex=hex.split("").map(c=>c+c).join("");
    let n=parseInt(hex,16),r=(n>>16)+amt,g=((n>>8)&255)+amt,b=(n&255)+amt;
    r=clamp(r,0,255);g=clamp(g,0,255);b=clamp(b,0,255);
    return "#"+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  }
  function drawCharacter(ctx,x,y,scale,p,t,moving){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    const bob=moving?Math.sin(t*10)*2.5:Math.sin(t*2)*1.1;
    ctx.translate(0,bob);

    ctx.fillStyle="rgba(0,0,0,.18)";
    ctx.beginPath();ctx.ellipse(0,87,34,10,0,0,Math.PI*2);ctx.fill();

    const step=moving?Math.sin(t*10)*5:0;
    round(ctx,-22,55+step,14,30,7,p.skin);
    round(ctx,8,55-step,14,30,7,p.skin);
    round(ctx,-26,77+step,23,9,6,"#f2f4f2");
    round(ctx,3,77-step,23,9,6,"#f2f4f2");

    round(ctx,-32,35,64,31,9,"#111a20");
    round(ctx,-43,0,16,55,8,p.skin);
    round(ctx,27,0,16,55,8,p.skin);

    const g=ctx.createLinearGradient(-35,-10,35,50);
    g.addColorStop(0,p.shirt);g.addColorStop(1,shade(p.shirt,-28));
    round(ctx,-38,-6,76,60,21,g);
    round(ctx,-27,3,54,3,2,"rgba(255,255,255,.18)");

    ctx.fillStyle=shade(p.skin,-8);
    ctx.beginPath();ctx.ellipse(-30,-38,7,10,0,0,Math.PI*2);ctx.ellipse(30,-38,7,10,0,0,Math.PI*2);ctx.fill();

    ctx.fillStyle=p.skin;
    ctx.beginPath();ctx.ellipse(0,-42,31,36,0,0,Math.PI*2);ctx.fill();

    ctx.fillStyle=p.hair;
    ctx.beginPath();
    ctx.arc(0,-57,33,Math.PI,Math.PI*2);
    ctx.lineTo(32,-43);
    ctx.quadraticCurveTo(29,-24,20,-20);
    ctx.lineTo(-24,-23);
    ctx.quadraticCurveTo(-31,-39,-31,-52);
    ctx.closePath();ctx.fill();

    ctx.strokeStyle="#3b2f29";ctx.lineWidth=2.2;
    ctx.beginPath();ctx.moveTo(-18,-45);ctx.lineTo(-8,-46);ctx.moveTo(8,-46);ctx.lineTo(18,-45);ctx.stroke();

    ctx.fillStyle="#151515";
    ctx.beginPath();ctx.arc(-12,-38,2.6,0,Math.PI*2);ctx.arc(12,-38,2.6,0,Math.PI*2);ctx.fill();

    ctx.strokeStyle="#9a6258";ctx.lineWidth=1.7;
    ctx.beginPath();ctx.moveTo(-4,-25);ctx.quadraticCurveTo(0,-22,4,-25);ctx.stroke();

    ctx.restore();
  }
  function drawTree(ctx,x,y){
    ctx.fillStyle="#6c4b35";ctx.fillRect(x-4,y+20,8,38);
    ctx.fillStyle="#4f8e51";ctx.beginPath();ctx.arc(x,y,27,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#39753f";ctx.beginPath();ctx.arc(x-10,y-5,18,0,Math.PI*2);ctx.arc(x+12,y-3,17,0,Math.PI*2);ctx.fill();
  }
  function drawBuilding(ctx,b,type,t){
    let c1="#d9b98f",c2="#c69970";
    if(type==="school"){c1="#c8d4dd";c2="#aebbc6"}
    if(type==="gym"){c1="#9d8876";c2="#796858"}
    if(type==="shop"){c1="#eca07d";c2="#ca7e63"}

    ctx.shadowColor="rgba(0,0,0,.18)";ctx.shadowBlur=18;ctx.shadowOffsetY=8;
    const g=ctx.createLinearGradient(b.x,b.y,b.x+b.w,b.y+b.h);
    g.addColorStop(0,c1);g.addColorStop(1,c2);
    round(ctx,b.x,b.y,b.w,b.h,16,g,"rgba(0,0,0,.10)");
    ctx.shadowColor="transparent";ctx.shadowBlur=0;ctx.shadowOffsetY=0;

    round(ctx,b.x-6,b.y-17,b.w+12,28,9,"#3c463f");
    round(ctx,b.x+b.w/2-42,b.y+26,84,26,13,"rgba(0,0,0,.66)");
    ctx.fillStyle="#fff";ctx.font="700 13px -apple-system";ctx.textAlign="center";
    ctx.fillText(b.name,b.x+b.w/2,b.y+44);

    for(const ox of [28,b.w-58]){
      const wg=ctx.createLinearGradient(0,b.y+70,0,b.y+108);
      wg.addColorStop(0,"#b8e7f5");wg.addColorStop(1,"#79bad1");
      round(ctx,b.x+ox,b.y+72,30,32,6,wg,"rgba(255,255,255,.55)");
    }

    round(ctx,b.x+b.w/2-18,b.y+b.h-58,36,58,7,"#4d3c31");

    const pulse=7+Math.sin(t*4)*2;
    ctx.strokeStyle="rgba(124,255,73,.75)";ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(b.doorX,b.doorY,pulse+8,0,Math.PI*2);ctx.stroke();
  }
  function drawField(ctx,b){
    const g=ctx.createLinearGradient(0,b.y,0,b.y+b.h);
    g.addColorStop(0,"#5ca35a");g.addColorStop(1,"#438441");
    round(ctx,b.x,b.y,b.w,b.h,18,g,"rgba(255,255,255,.65)");
    ctx.strokeStyle="rgba(255,255,255,.62)";ctx.lineWidth=3;
    ctx.strokeRect(b.x+18,b.y+18,b.w-36,b.h-36);
    ctx.beginPath();ctx.moveTo(b.x+b.w/2,b.y+18);ctx.lineTo(b.x+b.w/2,b.y+b.h-18);ctx.stroke();
    ctx.beginPath();ctx.arc(b.x+b.w/2,b.y+b.h/2,36,0,Math.PI*2);ctx.stroke();
    round(ctx,b.x+b.w/2-46,b.y+12,92,25,12,"rgba(0,0,0,.58)");
    ctx.fillStyle="#fff";ctx.font="700 13px -apple-system";ctx.textAlign="center";
    ctx.fillText("운동장",b.x+b.w/2,b.y+30);
  }

  function drawLamp(ctx,x,y,t){
    ctx.fillStyle="#39473f";ctx.fillRect(x-2,y,4,48);
    ctx.fillStyle="#27332c";ctx.fillRect(x-9,y-3,18,5);
    const glow=ctx.createRadialGradient(x,y,2,x,y,34);
    glow.addColorStop(0,"rgba(255,244,189,.23)");
    glow.addColorStop(1,"rgba(255,244,189,0)");
    ctx.fillStyle=glow;ctx.fillRect(x-34,y-34,68,68);
    ctx.fillStyle="rgba(255,244,189,.8)";ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();
  }
  function drawBench(ctx,x,y){
    ctx.fillStyle="#72533c";ctx.fillRect(x,y,54,8);ctx.fillRect(x,y+13,54,7);
    ctx.fillStyle="#3d473f";ctx.fillRect(x+6,y+20,4,18);ctx.fillRect(x+44,y+20,4,18);
  }
  function drawBush(ctx,x,y,s=1){
    ctx.fillStyle="#478148";
    ctx.beginPath();ctx.arc(x,y,15*s,0,Math.PI*2);ctx.arc(x+18*s,y+2*s,13*s,0,Math.PI*2);ctx.arc(x+8*s,y-8*s,12*s,0,Math.PI*2);ctx.fill();
  }

  function renderWorld(t,moving){
    const c=ctx.canvas,r=c.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const w=r.width,h=r.height;ctx.clearRect(0,0,w,h);

    const camX=clamp(state.x-w/2,0,WORLD.w-w);
    const camY=clamp(state.y-h/2,0,WORLD.h-h);
    ctx.save();ctx.translate(-camX,-camY);

    ctx.fillStyle="#89bdd6";ctx.fillRect(0,0,WORLD.w,240);
    const gg=ctx.createLinearGradient(0,240,0,WORLD.h);
    gg.addColorStop(0,"#86b774");gg.addColorStop(1,"#6fa061");
    ctx.fillStyle=gg;ctx.fillRect(0,240,WORLD.w,WORLD.h-240);

    ctx.globalAlpha=.07;ctx.strokeStyle="#2f6c3a";
    for(let y=260;y<WORLD.h;y+=26){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WORLD.w,y);ctx.stroke()}
    ctx.globalAlpha=1;

    let rg=ctx.createLinearGradient(0,460,0,620);rg.addColorStop(0,"#5e6460");rg.addColorStop(1,"#4c514e");
    ctx.fillStyle=rg;ctx.fillRect(0,460,WORLD.w,160);
    ctx.fillStyle="#b8b8ae";ctx.fillRect(0,440,WORLD.w,20);ctx.fillRect(0,620,WORLD.w,20);

    const vg=ctx.createLinearGradient(540,0,710,0);vg.addColorStop(0,"#515753");vg.addColorStop(.5,"#626763");vg.addColorStop(1,"#515753");
    ctx.fillStyle=vg;ctx.fillRect(540,200,170,WORLD.h-200);

    ctx.strokeStyle="#efe2a4";ctx.lineWidth=4;ctx.setLineDash([28,28]);
    ctx.beginPath();ctx.moveTo(0,540);ctx.lineTo(WORLD.w,540);ctx.moveTo(625,200);ctx.lineTo(625,WORLD.h);ctx.stroke();
    ctx.setLineDash([]);

    round(ctx,420,700,280,190,34,"#5b9953","rgba(255,255,255,.16)");
    drawTree(ctx,420,650);drawTree(ctx,675,775);drawTree(ctx,1250,340);drawTree(ctx,760,330);
    drawBush(ctx,455,805,.9);drawBush(ctx,620,820,.8);drawBush(ctx,1080,610,.85);
    drawBench(ctx,520,790);
    drawLamp(ctx,390,430,t);drawLamp(ctx,760,430,t);drawLamp(ctx,390,650,t);drawLamp(ctx,760,650,t);

    drawBuilding(ctx,buildings.home,"home",t);
    drawBuilding(ctx,buildings.school,"school",t);
    drawBuilding(ctx,buildings.gym,"gym",t);
    drawBuilding(ctx,buildings.shop,"shop",t);
    drawField(ctx,buildings.field);

    drawCharacter(ctx,state.x,state.y,.60,state.player,t,moving);
    ctx.restore();
  }
  function findNear(){
    let px=state.x,py=state.y+80,best=null,bd=999;
    Object.keys(buildings).forEach(id=>{
      const b=buildings[id];
      const d=Math.hypot(px-b.doorX,py-b.doorY);
      if(d<82&&d<bd){best={id,b};bd=d}
    });
    return best;
  }
  function bindControls(){
    document.querySelectorAll("[data-dir]").forEach(btn=>{
      const dir=btn.dataset.dir;
      const on=e=>{e.preventDefault();keys[dir]=true};
      const off=e=>{e.preventDefault();keys[dir]=false};
      btn.addEventListener("touchstart",on,{passive:false});
      btn.addEventListener("touchend",off,{passive:false});
      btn.addEventListener("touchcancel",off,{passive:false});
      btn.addEventListener("mousedown",on);
      btn.addEventListener("mouseup",off);
      btn.addEventListener("mouseleave",off);
    });
  }
  function statHTML(label,value){
    return '<div class="stat"><b>'+Math.round(value)+'</b><span>'+label+'</span></div>';
  }
  function loop(now){
    const dt=Math.min((now-last)/16.67,2);last=now;
    let dx=0,dy=0,s=3.5*dt;
    if(keys.left)dx-=s;if(keys.right)dx+=s;if(keys.up)dy-=s;if(keys.down)dy+=s;
    const moving=!!(dx||dy);

    if(moving){
      state.x=clamp(state.x+dx,0,WORLD.w-70);
      state.y=clamp(state.y+dy,0,WORLD.h-100);
      state.time+=.018*dt;
      state.energy=clamp(state.energy-.002*dt,0,100);
      if(state.time>=1440){state.time-=1440;state.day++}
      MFL_SAVE.save(state);
    }

    renderWorld(now/1000,moving);
    const clock=document.getElementById("clock");
    if(clock)clock.textContent=timeText(state.time);

    near=findNear();
    const hint=document.getElementById("hint");
    if(near){hint.textContent=near.b.name+" · A 입장";hint.classList.remove("hidden")}
    else hint.classList.add("hidden");

    raf=requestAnimationFrame(loop);
  }
  function drawRoomBase(ctx,w,h,id,t){
    let wall="#e6dfd0",floor="#8f7763";
    if(id==="school"){wall="#d9e2e6";floor="#787c7e"}
    if(id==="field"){wall="#83bad8";floor="#4f954c"}
    if(id==="gym"){wall="#596065";floor="#252a2d"}
    if(id==="shop"){wall="#ecd7bd";floor="#a78667"}

    ctx.fillStyle=wall;ctx.fillRect(0,0,w,h*.70);
    ctx.fillStyle=floor;ctx.fillRect(0,h*.70,w,h*.30);

    if(id==="home"){
      // ambient wall
      const wall=ctx.createLinearGradient(0,0,0,h*.70);
      wall.addColorStop(0,"#eee7d8");
      wall.addColorStop(1,"#ddd1bd");
      ctx.fillStyle=wall;ctx.fillRect(0,0,w,h*.70);

      // subtle wall panels
      ctx.strokeStyle="rgba(103,84,68,.055)";ctx.lineWidth=1;
      for(let x=0;x<w;x+=42){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h*.70);ctx.stroke()}

      // floor boards
      const floor=ctx.createLinearGradient(0,h*.70,0,h);
      floor.addColorStop(0,"#9a7e67");floor.addColorStop(1,"#735c4c");
      ctx.fillStyle=floor;ctx.fillRect(0,h*.70,w,h*.30);
      ctx.strokeStyle="rgba(60,44,35,.12)";
      for(let y=h*.72;y<h;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}

      // sunlight from window
      const sun=ctx.createLinearGradient(20,90,w*.55,h*.78);
      sun.addColorStop(0,"rgba(255,244,199,.18)");
      sun.addColorStop(1,"rgba(255,244,199,0)");
      ctx.fillStyle=sun;
      ctx.beginPath();ctx.moveTo(36,120);ctx.lineTo(130,120);ctx.lineTo(w*.65,h*.84);ctx.lineTo(w*.31,h*.84);ctx.closePath();ctx.fill();

      // window and curtains
      round(ctx,18,42,120,92,8,"#f3ede3");
      const sky=ctx.createLinearGradient(0,50,0,125);sky.addColorStop(0,"#6eb1dc");sky.addColorStop(1,"#c8ebf7");
      ctx.fillStyle=sky;ctx.fillRect(28,52,100,72);
      ctx.fillStyle="#f3ede3";ctx.fillRect(76,52,4,72);ctx.fillRect(28,86,100,4);
      round(ctx,7,34,26,110,5,"#627f69");round(ctx,133,34,26,110,5,"#718d77");

      // bed
      ctx.shadowColor="rgba(0,0,0,.16)";ctx.shadowBlur=14;ctx.shadowOffsetY=8;
      round(ctx,18,h-165,170,94,16,"#6f5644");
      ctx.shadowColor="transparent";ctx.shadowBlur=0;ctx.shadowOffsetY=0;
      round(ctx,28,h-155,150,74,12,"#dde5f4");
      round(ctx,38,h-144,60,30,10,"#fbfbfc");
      const blanket=ctx.createLinearGradient(90,h-136,178,h-81);
      blanket.addColorStop(0,"#6484a6");blanket.addColorStop(1,"#496b8d");
      round(ctx,90,h-136,88,55,10,blanket);

      // desk
      ctx.shadowColor="rgba(0,0,0,.14)";ctx.shadowBlur=12;ctx.shadowOffsetY=7;
      round(ctx,w-160,130,135,58,8,"#846043");
      ctx.shadowColor="transparent";ctx.shadowBlur=0;ctx.shadowOffsetY=0;
      ctx.fillStyle="#694b35";ctx.fillRect(w-145,188,11,58);ctx.fillRect(w-48,188,11,58);

      // monitor with glow
      round(ctx,w-132,72,82,52,7,"#394347");
      const screen=ctx.createLinearGradient(w-126,78,w-56,118);
      screen.addColorStop(0,"#1f3d48");screen.addColorStop(1,"#0c171a");
      round(ctx,w-126,78,70,40,4,screen);
      const monitorGlow=ctx.createRadialGradient(w-90,98,5,w-90,98,62);
      monitorGlow.addColorStop(0,"rgba(87,180,214,.08)");monitorGlow.addColorStop(1,"rgba(87,180,214,0)");
      ctx.fillStyle=monitorGlow;ctx.fillRect(w-150,50,120,110);
      round(ctx,w-112,194,54,46,13,"#35433c");

      // TV
      round(ctx,w/2-70,106,140,80,9,"#394246");
      const tvg=ctx.createRadialGradient(w/2,145,8,w/2,145,70);
      tvg.addColorStop(0,"rgba(131,255,79,.11)");tvg.addColorStop(1,"rgba(0,0,0,0)");
      round(ctx,w/2-63,113,126,66,5,"#101816");
      ctx.fillStyle=tvg;ctx.fillRect(w/2-63,113,126,66);
      round(ctx,w/2-78,186,156,44,7,"#6a503e");

      // rug
      const rug=ctx.createLinearGradient(w/2-100,h-125,w/2+100,h-30);
      rug.addColorStop(0,"#6c8276");rug.addColorStop(1,"#465a50");
      round(ctx,w/2-110,h-130,220,108,26,rug);

      // kitchen
      round(ctx,w-170,h-160,155,95,11,"#856d55");
      round(ctx,w-160,h-150,135,75,8,"#d0c2aa");
      round(ctx,w-145,h-137,50,9,4,"#626a6c");
      ctx.strokeStyle="#737b7d";ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(w-62,h-132,16,0,Math.PI*2);ctx.stroke();

      // shower
      round(ctx,w-118,25,100,115,10,"rgba(145,210,235,.18)","rgba(255,255,255,.82)");
      ctx.strokeStyle="#a8b1b4";ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(w-56,52,20,Math.PI,Math.PI*1.5);ctx.stroke();

      drawCharacter(ctx,w/2,h-95,.82,state.player,t,false);
    }else{
      if(id==="school"){
        round(ctx,w/2-120,55,240,90,8,"#385f45","#9a744d");
        for(let i=0;i<3;i++)round(ctx,35+i*110,h*.45,90,48,7,"#a48664");
      }
      if(id==="gym"){
        round(ctx,30,115,145,48,8,"#252a2d","#aab1b5");
        round(ctx,w-180,180,145,48,8,"#252a2d","#aab1b5");
      }
      if(id==="shop"){
        round(ctx,25,70,w-50,110,10,"#d7b78c","#8a664b");
        for(let i=0;i<5;i++){
          ctx.fillStyle=["#e76f51","#f4a261","#2a9d8f","#e9c46a","#8ab17d"][i];
          ctx.fillRect(45+i*55,95,32,45);
        }
      }
      if(id==="field"){
        ctx.strokeStyle="rgba(255,255,255,.7)";ctx.lineWidth=3;
        ctx.strokeRect(22,h*.72, w-44, h*.22);
      }
      drawCharacter(ctx,w/2,h-90,.80,state.player,t,false);
    }
  }
  function renderRoom(id,t){
    if(!document.getElementById("roomCanvas")) return;
    const c=document.getElementById("roomCanvas");
    const r=c.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    const rctx=c.getContext("2d");
    rctx.setTransform(dpr,0,0,dpr,0,0);
    rctx.clearRect(0,0,r.width,r.height);
    drawRoomBase(rctx,r.width,r.height,id,t);
    roomRAF=requestAnimationFrame(ts=>renderRoom(id,ts/1000));
  }
  function enterBuilding(id){
    if(raf){cancelAnimationFrame(raf);raf=null}
    const b=buildings[id];
    const holder=document.createElement("div");
    holder.className="interior";
    holder.id="interior";
    holder.innerHTML=
      '<div class="intHead"><div><div class="brand">LOCATION</div><div class="intTitle">'+b.name+'</div></div><button class="btn btn-ghost" style="width:auto;height:42px;padding:0 12px" id="leaveBtn">나가기</button></div>'+
      '<div class="roomWrap"><canvas id="roomCanvas"></canvas></div>'+
      '<div class="intActions">'+b.actions.map(a=>'<button class="intAction" data-action="'+a+'">'+a+'</button>').join("")+'</div>';
    document.getElementById("app").appendChild(holder);

    const rc=document.getElementById("roomCanvas");
    setupCanvas(rc);
    renderRoom(id,0);

    document.getElementById("leaveBtn").onclick=()=>{
      if(roomRAF)cancelAnimationFrame(roomRAF);
      holder.remove();
      last=performance.now();
      raf=requestAnimationFrame(loop);
    };

    document.querySelectorAll("[data-action]").forEach(btn=>{
      btn.onclick=()=>{
        document.querySelectorAll("[data-action]").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        const a=btn.dataset.action;
        if(a==="휴식"){state.energy=clamp(state.energy+15,0,100);state.stress=clamp(state.stress-8,0,100);state.time+=45}
        if(a==="공부"){state.energy=clamp(state.energy-5,0,100);state.stress=clamp(state.stress+2,0,100);state.time+=60}
        if(a==="식사"){state.energy=clamp(state.energy+12,0,100);state.time+=30}
        if(a==="샤워"){state.condition=clamp(state.condition+5,0,100);state.time+=20}
        if(a==="취침"){state.day++;state.time=420;state.energy=100;state.condition=clamp(state.condition+12,0,100);state.stress=clamp(state.stress-12,0,100)}
        if(a==="기술훈련"){state.football=clamp(state.football+2,0,99);state.energy=clamp(state.energy-15,0,100);state.time+=90}
        MFL_SAVE.save(state);
      };
    });
  }
  function openMenu(){
    if(raf){cancelAnimationFrame(raf);raf=null}
    const o=document.createElement("div");
    o.className="overlay";
    o.innerHTML='<div class="sheet"><h2>게임 메뉴</h2><p>진행 상황은 자동 저장됩니다.</p><div class="sheetGrid"><button class="btn btn-primary" id="resumeBtn">계속하기</button><button class="btn btn-dark" id="titleBtn">타이틀로</button></div></div>';
    document.body.appendChild(o);
    document.getElementById("resumeBtn").onclick=()=>{o.remove();last=performance.now();raf=requestAnimationFrame(loop)};
    document.getElementById("titleBtn").onclick=()=>{o.remove();stop();window.MFL_APP.showHome()};
  }
  function stop(){
    if(raf)cancelAnimationFrame(raf);
    if(roomRAF)cancelAnimationFrame(roomRAF);
    raf=null;roomRAF=null;keys={up:false,down:false,left:false,right:false};
  }
  function start(save){
    stop();
    state=save;
    const app=document.getElementById("app");
    app.innerHTML=
      '<div class="game">'+
        '<div class="hud">'+
          '<div class="hudTop">'+
            '<div><div class="brand">MY FOOTBALL LIFE</div><div class="info">DAY '+state.day+' · <span id="clock">'+timeText(state.time)+'</span></div></div>'+
            '<div style="text-align:right"><div class="money">₩'+state.money.toLocaleString()+'</div><div class="info">'+state.player.age+'세 · '+state.player.name+' · '+state.player.position+'</div></div>'+
          '</div>'+
          '<div class="stats">'+
            statHTML("에너지",state.energy)+statHTML("컨디션",state.condition)+statHTML("스트레스",state.stress)+statHTML("축구",state.football)+
          '</div>'+
        '</div>'+
        '<div class="viewport"><canvas id="gameCanvas"></canvas><div class="hint hidden" id="hint"></div>'+
          '<div class="controls">'+
            '<div class="dpad">'+
              '<button class="dbtn up" data-dir="up">▲</button>'+
              '<button class="dbtn left" data-dir="left">◀</button>'+
              '<button class="dbtn right" data-dir="right">▶</button>'+
              '<button class="dbtn down" data-dir="down">▼</button>'+
            '</div>'+
            '<div class="actionWrap"><button class="menuBtn" id="menuBtn">☰</button><button class="actionBtn" id="actionBtn">A</button></div>'+
          '</div>'+
        '</div>'+
      '</div>';

    const canvas=document.getElementById("gameCanvas");
    setupCanvas(canvas);ctx=canvas.getContext("2d");
    bindControls();

    document.getElementById("actionBtn").onclick=()=>{if(near)enterBuilding(near.id)};
    document.getElementById("menuBtn").onclick=openMenu;

    last=performance.now();
    raf=requestAnimationFrame(loop);
  }

  window.MFL_GAME={start,stop,drawCharacter,setupCanvas};
})();
