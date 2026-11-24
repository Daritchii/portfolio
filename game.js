(() => {
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=960,H=540,cols=11,rows=11,cell=48,ox=216,oy=28;
const $=id=>document.getElementById(id);
let score=0,best=+(localStorage.getItem('hopscotchBest')||0),lives=3,level=1,running=false,paused=false,over=false,last=0,elapsed=0,hopAnim=0;
$('best').textContent=String(best).padStart(4,'0');
const frog={x:5,y:10,px:5,py:10,drawX:5,drawY:10,ride:null};
const lanes=[
 {y:8,type:'road',speed:1.05,items:[{x:-1.2,w:1.35,c:'#e66b4c'},{x:2.2,w:1.8,c:'#f4c95d'},{x:6,w:1.25,c:'#4d7890'},{x:9,w:1.7,c:'#d65b54'}]},
 {y:7,type:'road',speed:-1.35,items:[{x:.2,w:2,c:'#668d73'},{x:4,w:1.3,c:'#e5a34b'},{x:7,w:1.8,c:'#826caa'},{x:10,w:1.2,c:'#4e8190'}]},
 {y:6,type:'road',speed:.8,items:[{x:-.7,w:1.2,c:'#e6ad4e'},{x:2,w:1.5,c:'#527d91'},{x:5.4,w:2,c:'#dc6a54'},{x:9,w:1.25,c:'#6c9477'}]},
 {y:4,type:'water',speed:-.72,items:[{x:-1,w:2.3},{x:2.1,w:1.8},{x:5,w:2.5},{x:8.5,w:2}]},
 {y:3,type:'water',speed:1.0,items:[{x:-.5,w:1.8},{x:2.5,w:2.3},{x:6,w:1.8},{x:9,w:2.4}]},
 {y:2,type:'water',speed:-.82,items:[{x:-1,w:2.2},{x:2,w:2},{x:5,w:2.5},{x:8.5,w:2}]}
];
function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
function poly(points,fill){ctx.beginPath();ctx.moveTo(...points[0]);points.slice(1).forEach(p=>ctx.lineTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill()}
function iso(x,y,z=0){return [ox+x*cell,oy+y*cell-z]}
function drawTile(x,y,color,top=true){
 const [px,py]=iso(x,y);const d=8;
 poly([[px,py+cell*.5],[px+cell*.5,py+cell*.5+d],[px+cell,py+cell*.5],[px+cell*.5,py+cell*.5-d]],color);
 if(top){poly([[px,py+cell*.5],[px+cell*.5,py+cell*.5-d],[px+cell*.5,py+cell*.5-d-8],[px,py+cell*.5-8]],'#ffffff10')}
}
function drawWorld(){
 ctx.clearRect(0,0,W,H);
 const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#b9d8b7');bg.addColorStop(1,'#8db69b');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 // soft scenery
 for(let i=0;i<34;i++){let x=(i*83)%W,y=(i*137)%H;ctx.fillStyle=i%2?'#ffffff12':'#305c3b12';ctx.beginPath();ctx.arc(x,y,10+(i%4)*4,0,Math.PI*2);ctx.fill()}
 // board shadow and lanes
 roundRect(ox-14,oy+12,cols*cell+28,rows*cell+20,20,'#274d3b30');
 for(let y=0;y<rows;y++){
  let color=y===0?'#b6d77b':y===1?'#9acb8e':([2,3,4,6,7,8].includes(y)?(y===3||y===4?'#5a9c9c':'#465e59'):'#80ad7f');
  for(let x=0;x<cols;x++)drawTile(x,y,color);
 }
 // safe garden and goal pads
 for(let x=0;x<cols;x++){let [px,py]=iso(x,0);if(x%2===0){ctx.fillStyle='#e9f7b0';ctx.beginPath();ctx.ellipse(px+24,py+26,12,7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#76a75f';ctx.beginPath();ctx.arc(px+24,py+21,5,0,Math.PI*2);ctx.fill()}}
 // lane stripes
 [6,7,8].forEach(y=>{for(let x=0;x<cols;x+=2){let [px,py]=iso(x,y);ctx.fillStyle='#f5e8c044';ctx.fillRect(px+4,py+cell*.5+20,cell*.55,2)}});
 lanes.forEach(l=>l.items.forEach(it=>drawObject(l,it)));
 // bottom start pad
 for(let x=0;x<cols;x++){let [px,py]=iso(x,10);ctx.fillStyle='#e3edce';ctx.beginPath();ctx.ellipse(px+24,py+30,13,7,0,0,Math.PI*2);ctx.fill()}
 drawFrog();
 // edge labels
 ctx.fillStyle='#315b48';ctx.font='10px DM Mono';ctx.fillText('HOME GARDEN',ox+8,oy-8);ctx.fillText('START HERE',ox+8,oy+rows*cell+17);
}
function drawObject(l,it){
 const [px,py]=iso(it.x,l.y);let w=it.w*cell;
 if(l.type==='road'){
  // vehicle shadow
  roundRect(px+4,py+35,w,15,7,'#14251f55');
  roundRect(px+3,py+15,w,27,8,it.c,'#263c36');
  roundRect(px+w*.18,py+7,w*.55,17,6,lighten(it.c),'#263c36');
  roundRect(px+w*.26,py+10,w*.2,10,3,'#c8e2d9');roundRect(px+w*.51,py+10,w*.16,10,3,'#c8e2d9');
  ctx.fillStyle='#f8e9a5';ctx.fillRect(px+w-6,py+25,4,6);ctx.fillStyle='#d7f0d9';ctx.fillRect(px+2,py+25,4,6);
  [px+w*.22,px+w*.76].forEach(wx=>{ctx.fillStyle='#25352e';ctx.beginPath();ctx.ellipse(wx,py+42,6,4,0,0,Math.PI*2);ctx.fill()});
 }else{
  roundRect(px+2,py+24,w,17,8,'#285c51','#214c45');
  roundRect(px+3,py+17,w-5,17,8,'#9b7148','#61472f');
  for(let k=0;k<Math.floor(it.w*2);k++){ctx.strokeStyle='#c89a65';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px+12+k*23,py+19);ctx.lineTo(px+12+k*23,py+31);ctx.stroke()}
  ctx.fillStyle='#b8d9a1';ctx.beginPath();ctx.ellipse(px+w*.8,py+15,9,4,0,0,Math.PI*2);ctx.fill();
 }
}
function lighten(hex){let n=parseInt(hex.slice(1),16);let r=Math.min(255,((n>>16)&255)+35),g=Math.min(255,((n>>8)&255)+35),b=Math.min(255,(n&255)+35);return `rgb(${r},${g},${b})`}
function drawFrog(){
 let [px,py]=iso(frog.drawX,frog.drawY);let bounce=Math.sin(hopAnim*10)*3;
 ctx.fillStyle='#183b2c55';ctx.beginPath();ctx.ellipse(px+24,py+43,14,6,0,0,Math.PI*2);ctx.fill();
 // body
 roundRect(px+10,py+19-bounce,28,24,11,'#4d9d55','#245c39');
 ctx.fillStyle='#70c86a';ctx.beginPath();ctx.ellipse(px+24,py+28-bounce,12,11,0,0,Math.PI*2);ctx.fill();
 // eyes
 [[16,18],[32,18]].forEach(([x,y])=>{ctx.fillStyle='#6fca67';ctx.beginPath();ctx.arc(px+x,py+y-bounce,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px+x+1,py+y-1-bounce,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#183a2a';ctx.beginPath();ctx.arc(px+x+2,py+y-1-bounce,2,0,Math.PI*2);ctx.fill()});
 ctx.strokeStyle='#245c39';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px+24,py+33-bounce,5,.2,Math.PI-.2);ctx.stroke();
}
function move(dx,dy){
 if(!running||paused||over)return;
 const nx=frog.x+dx,ny=frog.y+dy;if(nx<0||nx>=cols||ny<0||ny>=rows)return;
 frog.x=nx;frog.y=ny;frog.ride=null;hopAnim=0;
 if(dy<0){score+=10;if(ny===0){score+=100;level++;frog.x=5;frog.y=10;frog.ride=null;lanes.forEach(l=>l.speed*=1.08);}}
 syncHud();
}
function syncHud(){$('score').textContent=String(score).padStart(4,'0');$('lives').textContent=Array.from({length:3},(_,i)=>i<lives?'●':'○').join(' ');$('best').textContent=String(best).padStart(4,'0')}
function resetFrog(){frog.x=5;frog.y=10;frog.drawX=5;frog.drawY=10;frog.ride=null}
function loseLife(){if(!running)return;lives--;syncHud();if(lives<=0){running=false;over=true;showOverlay('GAME OVER','That was a close one.','You scored '+score+' points. Ready for another run?','PLAY AGAIN')}else resetFrog()}
function showOverlay(ey,h,m,b){$('eyebrow').textContent=ey;$('headline').textContent=h;$('message').textContent=m;$('start').textContent=b+'  ↗';$('overlay').classList.remove('hidden')}
function startGame(){score=0;lives=3;level=1;lanes[0].speed=1.05;lanes[1].speed=-1.35;lanes[2].speed=.8;lanes[3].speed=-.72;lanes[4].speed=1;lanes[5].speed=-.82;lanes.forEach(l=>l.items.forEach((it,i)=>it.x=[-.7,2.2,5.4,8.7][i]??i*3));resetFrog();running=true;paused=false;over=false;elapsed=0;syncHud();$('overlay').classList.add('hidden')}
function update(dt){
 if(!running||paused)return;elapsed+=dt;hopAnim+=dt;
 lanes.forEach(l=>l.items.forEach(it=>{it.x+=l.speed*dt;if(l.speed>0&&it.x>cols+1)it.x=-it.w-1;if(l.speed<0&&it.x< -it.w-1)it.x=cols+1}));
 frog.drawX+=(frog.x-frog.drawX)*Math.min(1,dt*14);frog.drawY+=(frog.y-frog.drawY)*Math.min(1,dt*14);
 if(frog.y>=2&&frog.y<=4){
  const l=lanes.find(v=>v.y===frog.y),center=frog.x+.5;
  const platform=l.items.find(it=>center>it.x-.1&&center<it.x+it.w+.1);
  if(!platform){loseLife();return}
  frog.ride=platform;frog.x+=l.speed*dt;
  if(frog.x<-.15||frog.x>cols-.85){loseLife();return}
 }else if(frog.y>=6&&frog.y<=8){
  const l=lanes.find(v=>v.y===frog.y),center=frog.x+.5;
  if(l.items.some(it=>center>it.x-.42&&center<it.x+it.w+.42)){loseLife();return}
 }
}
function loop(t){let dt=Math.min((t-last)/1000||0,.04);last=t;update(dt);drawWorld();if(running&&score>best){best=score;localStorage.setItem('hopscotchBest',best);$('best').textContent=String(best).padStart(4,'0')}requestAnimationFrame(loop)}
function key(e){let k=e.key.toLowerCase(),map={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};if(map[k]){e.preventDefault();move(...map[k])}if(k==='p'&&running){paused=!paused;if(paused)showOverlay('TAKE A BREATHER','Paused','The road will wait. Take your time.','RESUME');else $('overlay').classList.add('hidden')}}
window.addEventListener('keydown',key);$('start').addEventListener('click',()=>{if(paused){paused=false;$('overlay').classList.add('hidden')}else startGame()});
document.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('click',()=>{let d=b.dataset.dir;move(...({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]})[d])}));
let pointer=null;canvas.addEventListener('pointerdown',e=>{pointer=[e.clientX,e.clientY]});canvas.addEventListener('pointerup',e=>{if(!pointer)return;let dx=e.clientX-pointer[0],dy=e.clientY-pointer[1];if(Math.max(Math.abs(dx),Math.abs(dy))>18){if(Math.abs(dx)>Math.abs(dy))move(Math.sign(dx),0);else move(0,Math.sign(dy))}pointer=null});
syncHud();drawWorld();requestAnimationFrame(loop);
})();
