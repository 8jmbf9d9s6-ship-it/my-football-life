
(function(){
  const app=document.getElementById("app");
  let homeRAF=null;
  let homeT=0;

  function modal(title,body){
    const o=document.createElement("div");
    o.className="overlay";
    o.innerHTML='<div class="sheet"><h2>'+title+'</h2><p>'+body+'</p><button class="btn btn-primary" id="modalOk">확인</button></div>';
    document.body.appendChild(o);
    document.getElementById("modalOk").onclick=()=>o.remove();
  }

  function stopHome(){
    if(homeRAF)cancelAnimationFrame(homeRAF);
    homeRAF=null;
  }

  function setupCanvas(c){
    const r=c.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    c.width=Math.round(r.width*dpr);
    c.height=Math.round(r.height*dpr);
  }

  function drawHome(){
    const bg=document.getElementById("homeCanvas");
    const pc=document.getElementById("homePlayerCanvas");
    if(!bg||!pc)return;

    const dpr=Math.min(devicePixelRatio||1,2);
    const ctx=bg.getContext("2d"),pctx=pc.getContext("2d");
    const br=bg.getBoundingClientRect(),pr=pc.getBoundingClientRect();
    ctx.setTransform(dpr,0,0,dpr,0,0);
    pctx.setTransform(dpr,0,0,dpr,0,0);
    homeT+=.012;

    ctx.clearRect(0,0,br.width,br.height);

    // cinematic night sky
    const sky=ctx.createLinearGradient(0,0,0,br.height);
    sky.addColorStop(0,"#030806");
    sky.addColorStop(.26,"#0a1d12");
    sky.addColorStop(.56,"#173b23");
    sky.addColorStop(1,"#071009");
    ctx.fillStyle=sky;ctx.fillRect(0,0,br.width,br.height);

    // moon / stadium haze
    const mx=br.width*.72,my=br.height*.16;
    const moon=ctx.createRadialGradient(mx,my,2,mx,my,72);
    moon.addColorStop(0,"rgba(229,255,220,.24)");
    moon.addColorStop(.18,"rgba(179,255,153,.10)");
    moon.addColorStop(1,"rgba(124,255,73,0)");
    ctx.fillStyle=moon;ctx.fillRect(0,0,br.width,br.height);

    // moving clouds
    ctx.globalAlpha=.07;
    for(let i=0;i<4;i++){
      const x=((homeT*10 + i*120)%(br.width+170))-100;
      const y=90+i*48;
      ctx.fillStyle="#d8e7db";
      ctx.beginPath();
      ctx.ellipse(x,y,70,18,0,0,Math.PI*2);
      ctx.ellipse(x+42,y+4,52,14,0,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha=1;

    // grandstand silhouette
    ctx.fillStyle="#07120c";
    ctx.beginPath();
    ctx.moveTo(-20,br.height*.46);
    ctx.quadraticCurveTo(br.width*.5,br.height*.31,br.width+20,br.height*.46);
    ctx.lineTo(br.width+20,br.height*.64);
    ctx.lineTo(-20,br.height*.64);
    ctx.closePath();ctx.fill();

    // roof band
    ctx.strokeStyle="rgba(151,196,158,.12)";
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(0,br.height*.455);
    ctx.quadraticCurveTo(br.width*.5,br.height*.325,br.width,br.height*.455);
    ctx.stroke();

    // animated spectators
    for(let i=0;i<110;i++){
      const x=(i/109)*br.width;
      const y=br.height*.47+Math.sin(i*.71)*8+(i%4)*6;
      const flash=.035+.055*Math.max(0,Math.sin(homeT*2.6+i*1.7));
      ctx.fillStyle=`rgba(255,243,191,${flash})`;
      ctx.fillRect(x,y,1.6,1.6);
    }

    // floodlight towers
    const towers=[[br.width*.07,br.height*.265],[br.width*.28,br.height*.245],[br.width*.72,br.height*.245],[br.width*.93,br.height*.265]];
    towers.forEach(([x,y],idx)=>{
      ctx.fillStyle="rgba(16,25,19,.85)";
      ctx.fillRect(x-2,y,4,95);
      ctx.fillStyle="rgba(255,248,213,.75)";
      for(let j=0;j<4;j++)ctx.fillRect(x-13+j*8,y-4,5,3);

      const tx=br.width*(idx<2?.44:.56), ty=br.height*.66;
      const beam=ctx.createLinearGradient(x,y,tx,ty);
      beam.addColorStop(0,"rgba(255,247,208,.10)");
      beam.addColorStop(1,"rgba(255,247,208,0)");
      ctx.strokeStyle=beam;ctx.lineWidth=24;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.stroke();
    });

    // pitch
    const pitch=ctx.createLinearGradient(0,br.height*.59,0,br.height);
    pitch.addColorStop(0,"#184223");pitch.addColorStop(1,"#07170d");
    ctx.fillStyle=pitch;ctx.fillRect(0,br.height*.59,br.width,br.height*.41);

    // mowing stripes
    for(let i=0;i<10;i++){
      ctx.fillStyle=i%2===0?"rgba(255,255,255,.018)":"rgba(0,0,0,.022)";
      ctx.fillRect(i*br.width/10,br.height*.59,br.width/10,br.height*.41);
    }

    ctx.strokeStyle="rgba(255,255,255,.13)";ctx.lineWidth=1.4;
    ctx.strokeRect(br.width*.11,br.height*.69,br.width*.78,br.height*.24);
    ctx.beginPath();ctx.moveTo(br.width*.5,br.height*.69);ctx.lineTo(br.width*.5,br.height*.93);ctx.stroke();
    ctx.beginPath();ctx.arc(br.width*.5,br.height*.81,39,0,Math.PI*2);ctx.stroke();

    // animated ground mist
    for(let i=0;i<5;i++){
      const yy=br.height*(.58+i*.065);
      const fog=ctx.createLinearGradient(0,yy,br.width,yy);
      fog.addColorStop(0,"rgba(220,240,228,0)");
      fog.addColorStop(.5,`rgba(220,240,228,${.014+.008*Math.sin(homeT+i)})`);
      fog.addColorStop(1,"rgba(220,240,228,0)");
      ctx.fillStyle=fog;ctx.fillRect(0,yy,br.width,28);
    }

    // particles
    for(let i=0;i<32;i++){
      const x=(i*47 + homeT*15*(1+i%3))%br.width;
      const y=(i*83 + homeT*7*(1+i%4))%br.height;
      ctx.fillStyle=`rgba(210,255,219,${.025+(i%5)*.009})`;
      ctx.beginPath();ctx.arc(x,y,.7+(i%3)*.35,0,Math.PI*2);ctx.fill();
    }

    // Home player
    pctx.clearRect(0,0,pr.width,pr.height);
    const save=MFL_SAVE.load();
    const player=save?.player || {name:"재환",age:15,position:"ST",skin:"#d5a079",hair:"#171717",shirt:"#2878ff"};

    const glow=pctx.createRadialGradient(pr.width*.48,pr.height*.48,10,pr.width*.48,pr.height*.48,95);
    glow.addColorStop(0,"rgba(131,255,79,.11)");
    glow.addColorStop(1,"rgba(131,255,79,0)");
    pctx.fillStyle=glow;pctx.fillRect(0,0,pr.width,pr.height);

    MFL_GAME.drawCharacter(pctx,pr.width*.48,pr.height*.75,1.14,player,homeT,false);

    // ball
    const bx=pr.width*.77+Math.sin(homeT*1.5)*3, by=pr.height*.79;
    pctx.fillStyle="#f2f3f1";pctx.beginPath();pctx.arc(bx,by,15,0,Math.PI*2);pctx.fill();
    pctx.fillStyle="#1c1c1c";pctx.beginPath();pctx.arc(bx,by,5,0,Math.PI*2);pctx.fill();

    homeRAF=requestAnimationFrame(drawHome);
  }

  function showHome(){
    MFL_GAME.stop();
    stopHome();

    const save=MFL_SAVE.load();
    app.innerHTML=
      '<main class="screen home">'+
        '<canvas id="homeCanvas"></canvas><div class="homeShade"></div>'+
        '<div class="homeTop"><div class="brand">A FOOTBALL LIFE SIMULATION</div><div class="logo"><div class="ball"></div></div><div class="mainTitle">MY<br><span>FOOTBALL</span><br>LIFE</div><div class="tagline">경기를 조작하는 게임이 아니라<br>한 명의 축구선수로 살아가는 게임</div></div>'+
        '<div class="homePlayer"><canvas id="homePlayerCanvas"></canvas></div>'+
        '<div class="menu">'+
          '<div class="saveCard"><div><strong>'+(save?save.player.name+" · "+save.player.position:"새로운 커리어")+'</strong><small>'+(save?"DAY "+save.day+" · OVR "+save.football:"15세 학생 선수로 시작")+'</small></div><span class="status">'+(save?"SAVE FOUND":"NEW")+'</span></div>'+
          '<div class="menuGrid">'+
            '<button class="btn btn-primary" id="newCareer">NEW CAREER</button>'+
            '<button class="btn btn-dark" id="continueBtn">CONTINUE</button>'+
            '<div class="menuRow"><button class="btn btn-ghost" id="settingsBtn">SETTINGS</button><button class="btn btn-ghost" id="aboutBtn">ABOUT</button></div>'+
          '</div><div class="version">MY FOOTBALL LIFE · V3.0</div>'+
        '</div>'+
      '</main>';

    const bg=document.getElementById("homeCanvas"),pc=document.getElementById("homePlayerCanvas");
    setupCanvas(bg);setupCanvas(pc);
    drawHome();

    document.getElementById("newCareer").onclick=showCreator;
    const c=document.getElementById("continueBtn");
    if(save)c.onclick=()=>{stopHome();MFL_GAME.start(save)};
    else{c.disabled=true;c.style.opacity=".42"}

    document.getElementById("settingsBtn").onclick=()=>modal("SETTINGS","사운드, 진동, 이동 속도는 다음 버전에서 추가됩니다.");
    document.getElementById("aboutBtn").onclick=()=>modal("MY FOOTBALL LIFE","15세 학생 선수로 시작해 학교생활, 훈련, 계약, 이적, 국가대표와 세계 최고의 선수까지 경험하는 축구선수 인생 시뮬레이션.");
  }

  function showCreator(){
    stopHome();
    app.innerHTML=
      '<main class="screen">'+
        '<div class="brand">PLAYER CREATION</div>'+
        '<div class="creatorTitle">15세의 나를<br>만든다.</div>'+
        '<p class="sub">이 캐릭터는 앞으로 게임 전체에서 계속 사용됩니다.</p>'+
        '<section class="card" style="margin-top:14px"><div class="previewWrap"><canvas id="previewCanvas"></canvas></div></section>'+
        '<section class="card" style="margin-top:12px"><div class="grid">'+
          '<div class="field"><label>이름</label><input id="nameInput" value="재환"></div>'+
          '<div class="grid grid2"><div class="field"><label>포지션</label><select id="positionInput"><option>ST</option><option>LW</option><option>RW</option><option>CAM</option><option>CM</option><option>CDM</option><option>CB</option><option>LB</option><option>RB</option><option>GK</option></select></div><div class="field"><label>주발</label><select id="footInput"><option>오른발</option><option>왼발</option></select></div></div>'+
          '<div class="field"><label>국적</label><input id="nationInput" value="대한민국"></div>'+
          '<div class="grid grid2"><div class="field"><label>피부톤</label><input type="color" id="skinInput" value="#d5a079"></div><div class="field"><label>헤어</label><input type="color" id="hairInput" value="#171717"></div></div>'+
          '<div class="field"><label>상의 색상</label><input type="color" id="shirtInput" value="#2878ff"></div>'+
          '<button class="btn btn-primary" id="startBtn">CAREER START</button>'+
          '<button class="btn btn-ghost" id="backBtn">뒤로</button>'+
        '</div></section>'+
      '</main>';

    const c=document.getElementById("previewCanvas");
    setupCanvas(c);
    const pctx=c.getContext("2d");
    const ids=["nameInput","positionInput","footInput","nationInput","skinInput","hairInput","shirtInput"];

    function player(){
      return {
        name:document.getElementById("nameInput").value.trim()||"재환",
        age:15,
        position:document.getElementById("positionInput").value,
        foot:document.getElementById("footInput").value,
        nation:document.getElementById("nationInput").value.trim()||"대한민국",
        skin:document.getElementById("skinInput").value,
        hair:document.getElementById("hairInput").value,
        shirt:document.getElementById("shirtInput").value
      };
    }
    function redraw(){
      const r=c.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
      pctx.setTransform(dpr,0,0,dpr,0,0);
      pctx.clearRect(0,0,r.width,r.height);
      pctx.fillStyle="rgba(255,255,255,.04)";
      pctx.beginPath();pctx.arc(r.width*.5,r.height*.35,95,0,Math.PI*2);pctx.fill();
      MFL_GAME.drawCharacter(pctx,r.width*.5,r.height*.73,1.45,player(),0,false);
    }
    ids.forEach(id=>document.getElementById(id).addEventListener("input",redraw));
    redraw();

    document.getElementById("startBtn").onclick=()=>{
      const save=MFL_SAVE.create(player());
      MFL_SAVE.save(save);
      MFL_GAME.start(save);
    };
    document.getElementById("backBtn").onclick=showHome;
  }

  window.MFL_APP={showHome,showCreator};
  showHome();
})();
