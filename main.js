
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

    const sky=ctx.createLinearGradient(0,0,0,br.height);
    sky.addColorStop(0,"#06110b");
    sky.addColorStop(.45,"#123521");
    sky.addColorStop(1,"#071009");
    ctx.fillStyle=sky;ctx.fillRect(0,0,br.width,br.height);

    const haze=ctx.createRadialGradient(br.width*.5,br.height*.23,10,br.width*.5,br.height*.23,br.width*.62);
    haze.addColorStop(0,"rgba(124,255,73,.15)");
    haze.addColorStop(.5,"rgba(124,255,73,.035)");
    haze.addColorStop(1,"rgba(124,255,73,0)");
    ctx.fillStyle=haze;ctx.fillRect(0,0,br.width,br.height);

    ctx.fillStyle="#0a160e";
    ctx.beginPath();
    ctx.moveTo(0,br.height*.43);
    ctx.quadraticCurveTo(br.width*.5,br.height*.32,br.width,br.height*.43);
    ctx.lineTo(br.width,br.height*.63);
    ctx.lineTo(0,br.height*.63);
    ctx.closePath();ctx.fill();

    for(let i=0;i<65;i++){
      const x=(i/64)*br.width;
      const y=br.height*.45+Math.sin(i*.8)*5;
      ctx.fillStyle="rgba(255,238,176,"+(.05+.04*Math.sin(homeT*3+i))+")";
      ctx.fillRect(x,y,2,2);
    }

    const beams=[
      [br.width*.08,br.height*.25,br.width*.38,br.height*.62],
      [br.width*.28,br.height*.23,br.width*.46,br.height*.64],
      [br.width*.92,br.height*.25,br.width*.62,br.height*.62],
      [br.width*.72,br.height*.23,br.width*.54,br.height*.64]
    ];
    beams.forEach(v=>{
      const g=ctx.createLinearGradient(v[0],v[1],v[2],v[3]);
      g.addColorStop(0,"rgba(255,248,210,.13)");
      g.addColorStop(1,"rgba(255,248,210,0)");
      ctx.strokeStyle=g;ctx.lineWidth=18;
      ctx.beginPath();ctx.moveTo(v[0],v[1]);ctx.lineTo(v[2],v[3]);ctx.stroke();
    });

    const pitch=ctx.createLinearGradient(0,br.height*.58,0,br.height);
    pitch.addColorStop(0,"#173c20");pitch.addColorStop(1,"#0b1d11");
    ctx.fillStyle=pitch;ctx.fillRect(0,br.height*.58,br.width,br.height*.42);

    ctx.strokeStyle="rgba(255,255,255,.11)";ctx.lineWidth=1.5;
    ctx.strokeRect(br.width*.12,br.height*.69,br.width*.76,br.height*.23);
    ctx.beginPath();ctx.arc(br.width*.5,br.height*.805,37,0,Math.PI*2);ctx.stroke();

    // Home player
    pctx.clearRect(0,0,pr.width,pr.height);
    const save=MFL_SAVE.load();
    const player=save?.player || {name:"재환",age:15,position:"ST",skin:"#d5a079",hair:"#171717",shirt:"#2878ff"};
    MFL_GAME.drawCharacter(pctx,pr.width*.48,pr.height*.74,1.05,player,homeT,false);

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
