//audio

const audioctx = new (window.AudioContext || window.webkitAudioContext) ();
function playsound(type) {
    if(audioctx.state==='suspended') {
        audioctx.resume();
    }

    const osc=audioctx.createOscillator();
    const gainNode=audioctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioctx.destination);

    const now=audioctx.currentTime;

    if(type==='pellet'){
        osc.type='square';
        osc.frequency.setValueAtTime(400,now);
        osc.frequency.exponentialRampToValueAtTime(600,now+0.1);
        gainNode.gain.setValueAtTime(0.1,now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now+0.1);
        osc.start(now);
        osc.stop(now+0.1);
    } else if (type==='phase'){
        osc.type='sawtooth';
        osc.frequency.setValueAtTime(300,now);
        osc.frequency.exponentialRampToValueAtTime(800,now+0.5);
        gainNode.gain.setValueAtTime(0.2,now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now+0.5);
        osc.start(now);
        osc.stop(now+0.5);
    } else if(type==='death'){
        osc.type='triangle';
        osc.frequency.setValueAtTime(300,now);
        osc.frequency.exponentialRampToValueAtTime(50,now+0.8);
        gainNode.gain.setValueAtTime(0.3,now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now+0.8);
        osc.start(now);
        osc.stop(now+0.8);
    } else if (type==='win'){
        osc.type='sine';
        osc.frequency.setValueAtTime(400,now);
        osc.frequency.linearRampToValueAtTime(800,now+0.2);
        osc.frequency.linearRampToValueAtTime(1200,now+0.4);
        gainNode.gain.setValueAtTime(0.2,now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now+0.6);
        osc.start(now);
        osc.stop(now+0.6);
    }
}




const canvas=document.getElementById('canvas');
const ctx=canvas.getContext('2d');

const tilesize=20;
const rows=20;
const cols=20;


let score=0;
let starttime=Date.now();
let elapsedtime=0;
let currentphase=1;
let gameover=false;
let gamestart=false;
let animationID;
let mazerotation=0;
let lasttime=Date.now();
let highscore=localStorage.getItem('pacman_highscore')||0;
let besttime=localStorage.getItem('pacman_besttime') || null;


const keys= {
    ArrowUp:false,
    ArrowDown:false,
    ArrowLeft:false,
    ArrowRight:false
}

window.addEventListener('keydown',(e)=>{
    if(e.code==="Space" && !gamestart && !gameover){
        if(audioctx.state==='suspended'){
            audioctx.resume();
        }
        gamestart=true;
        starttime=Date.now();
        lasttime=Date.now();
        e.preventDefault();
        return;
        
    }

    if(e.code==='Space'&&gameover){
        e.preventDefault();
        window.resetGame();
        return;
    }


if (keys.hasOwnProperty(e.key)) {
    keys[e.key]=true;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();

}
});


window.addEventListener('keyup',(e)=>{
    if (keys.hasOwnProperty(e.key)){
        keys[e.key]=false;
        if(['ArrowUp','ArrowDown','ArrowRight','ArrowLeft'].includes(e.key))e.preventDefault();
    }
});

// The Maze Layout: 1 is Wall, 0 is Pellet, 2 is Empty Path
const mazelayout = [ // Define the initial maze structure
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 0
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Row 1
    [1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1], // Row 2
    [1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1], // Row 3
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Row 4
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1], // Row 5
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1], // Row 6
    [1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1], // Row 7
    [2, 2, 2, 2, 1, 0, 1, 2, 2, 2, 2, 2, 2, 1, 0, 1, 2, 2, 2, 2], // Row 8
    [1, 1, 1, 1, 1, 0, 1, 2, 1, 2, 2, 1, 2, 1, 0, 1, 1, 1, 1, 1], // Row 9
    [2, 2, 2, 2, 2, 0, 2, 2, 1, 2, 2, 1, 2, 2, 0, 2, 2, 2, 2, 2], // Row 10
    [1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1], // Row 11
    [2, 2, 2, 2, 1, 0, 1, 2, 2, 2, 2, 2, 2, 1, 0, 1, 2, 2, 2, 2], // Row 12
    [1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1], // Row 13
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Row 14
    [1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1], // Row 15
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 1, 0, 0, 0, 1], // Row 16
    [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1], // Row 17
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1], // Row 18
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  // Row 19
];

let maze=[];

const player={
    x:9.5*tilesize,
    y:16.5*tilesize,
    radius:tilesize/2-2,
    speed:100,
    vx:0,
    vy:0
};

let ghosts=[];

window.resetGame=function(){
    score=0;
    starttime=Date.now();
    currentphase=1;
    gameover=false;
    gamestart=false;
    mazerotation=0;
    elapsedtime=0;
    document.getElementById("score").innerText=score;
    document.getElementById("phase").innerText=currentphase;
    document.getElementById('phase').classList.remove("phase-2");
    maze=mazelayout.map(row=> [...row]);
    player.x=9.5*tilesize;
    player.y=16.5*tilesize;
    player.vx= -player.speed;
    player.vy=0;

    ghosts=[
        {x:7.5*tilesize,y:10.5*tilesize,color:'#FF0000',speed:60,radius:tilesize/2-2, wandertime:0, wandervx:0,wandervy:0},
        {x:9.5*tilesize,y:10.5*tilesize,color:"#ff69b4",speed:50,radius:tilesize/2-2,wandertime:0, wandervx:0,wandervy:0},
        {x:10.5*tilesize,y:10.5*tilesize,color:"#00ffff",speed:55,radius:tilesize/2-2,wandertime:0, wandervx:0,wandervy:0}
    ]

    document.getElementById('gameover').style.visibility='hidden';
    document.getElementById('gameover').querySelector('h2').innerText='GAME OVER';
    document.getElementById('gameover').querySelector('h2').style.color='red';

    if(animationID) cancelAnimationFrame(animationID);
    lasttime=Date.now();
    gameloop();
}

function wallcollision(x,y,radius){
    const buffer =0.01
    const leftcol=Math.floor((x-radius+buffer)/tilesize);
    const rightcol=Math.floor((x+radius-buffer)/tilesize);
    const toprow=Math.floor((y-radius+buffer)/tilesize);
    const bottomrow=Math.floor((y+radius-buffer)/tilesize);

    for(let r=toprow;r<=bottomrow;r++){
        for (let c=leftcol;c<=rightcol;c++){
            
                if(r<0 || r>=rows) return true;
                if(c<0){
                    if(maze[r][0]===1) return true;
                    continue;
                }
                if(c>=cols){
                    if(maze[r][cols-1]===1) return true;
                    continue;
                } 
                if(maze[r][c]===1) return true;
            }
        }
    return false;
}


function pellet(){
    const col=Math.floor(player.x/tilesize);
    const row=Math.floor(player.y/tilesize);

    if(row>=0 && row<rows && col>=0 && col<cols){
        if(maze[row][col]===0){
            maze[row][col]=2;
            playsound('pellet');
            score+=10;
            document.getElementById('score').innerText=score;

            let haspellets=false;
            for(let i=0; i<rows;i++){
                for(let j=0;j<cols;j++){
                    if (maze[i][j]===0) haspellets=true;    
                }
            }

            if(!haspellets){
                gameover=true;
                playsound('win');
                document.getElementById('gameover').style.visibility='visible';
                document.getElementById('gameover').querySelector('h2').innerText='YOU WIN!';
                document.getElementById('gameover').querySelector('h2').style.color='green';
                
                if(score>highscore){
                    highscore=score;
                    localStorage.setItem('pacman_highscore', highscore);

                }

                if(besttime===null||elapsedtime<besttime){
                    besttime=elapsedtime;
                    localStorage.setItem('pacman_besttime',besttime);
                }
                
                document.getElementById('score').innerText=score;
                document.getElementById('final_score').innerText = score;
                document.getElementById('final_time').innerText=elapsedtime + 's';
                document.getElementById('highscoredisp').innerText=highscore;
                document.getElementById('besttimedisp').innerText=besttime+'s';
            }
        }
    }
}

function distance(x1,y1,x2,y2){
    return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
}



function gameloop(){
    if(gameover) return;

    const now=Date.now();
    const dt=(now-lasttime)/1000;
    lasttime=now;

    update(dt);
    draw();

    animationID=requestAnimationFrame(gameloop);
}

function update(dt){
    if(!gamestart) return;

    elapsedtime=Math.floor((Date.now()-starttime)/1000);
    document.getElementById('time').innerText=elapsedtime;
    

    let expectedphase=Math.floor(elapsedtime/30)%2===0 ?1:2;

    if (currentphase!==expectedphase){
        currentphase=expectedphase;
        playsound('phase');
        document.getElementById('phase').innerText=currentphase;

        if(currentphase===2){
            document.getElementById('phase').classList.add('phase-2');
        }else{
            document.getElementById('phase').classList.remove('phase-2');
            mazerotation=0;

            let curcol=Math.floor(player.x/tilesize);
            let currow=Math.floor(player.y/tilesize);
            if(currow>=0 && currow<rows && curcol >=0 && curcol<cols && maze[currow][curcol]===1){
                player.x=9.5*tilesize;
                player.y=16.5*tilesize;
            } else{
                player.x=curcol*tilesize+tilesize/2;
                player.y=currow*tilesize+tilesize/2
            }
        }
            player.vx=0;
            player.vy=0;
    }

    if (currentphase==1){
        let invx=player.vx;
        let invy=player.vy;

        if (keys.ArrowLeft){invx=-player.speed;invy=0;}
        else if (keys.ArrowRight){invx=player.speed;invy=0;}
        else if (keys.ArrowUp){invx=0;invy=-player.speed;}
        else if (keys.ArrowDown){invx=0;invy=player.speed;}

        if(invx!==player.vx || invy !== player.vy) {

            let testx=player.x+(invx !==0 ? (invx>0 ? 5 : -5) : 0);
            let testy=player.y+(invy !==0 ? (invy>0 ? 5 : -5) : 0);

            if(!wallcollision(testx,testy,player.radius)){
                if(invx!==0 && player.vy!==0){
                player.y = Math.floor(player.y/tilesize)*tilesize+tilesize/2;
            } else if (invy!==0 && player.vx!==0){
                player.x = Math.floor(player.x/tilesize)*tilesize+tilesize/2;
            }
                player.vx=invx;
                player.vy=invy;
            }
    }
        
    
        

        let nextx=player.x+player.vx*dt;
        if(!wallcollision(nextx,player.y,player.radius)){
            player.x=nextx;
        }
            
        

        let nexty=player.y+player.vy*dt;
        if(!wallcollision(player.x,nexty,player.radius)){
            player.y=nexty;
        } 
        

    } else {
    const rotationspeed=2;
    if(keys.ArrowLeft) mazerotation-=rotationspeed*dt;
    if(keys.ArrowRight) mazerotation+=rotationspeed*dt;
    if(keys.ArrowUp) mazerotation-=(rotationspeed/2)*dt;
    if(keys.ArrowDown) mazerotation+=(rotationspeed/2)*dt;

    const gravity=200;

    const gx = Math.sin(mazerotation) * gravity;
    const gy = Math.cos(mazerotation) * gravity;

    player.vx += gx * dt;
    player.vy += gy * dt;

    player.vx*=Math.pow(0.98, dt*60);
    player.vy*=Math.pow(0.98, dt*60);

    const maxspeed=250;
    player.vx=Math.max(-maxspeed,Math.min(maxspeed,player.vx));
    player.vy=Math.max(-maxspeed,Math.min(maxspeed,player.vy));

    let nextx=player.x+player.vx*dt;
    if(!wallcollision(nextx,player.y,player.radius)){
        player.x=nextx;
    } else {
        if(player.vx>0){
            player.x=Math.floor((nextx+player.radius)/tilesize)*tilesize-player.radius-0.01;
        } else if( player.vx<0){
            player.x=Math.ceil((nextx-player.radius)/tilesize)*tilesize+player.radius+0.01;
        }    
        player.vx=0;
    }

    let nexty=player.y+player.vy*dt;
    if(!wallcollision(player.x,nexty,player.radius)){
        player.y=nexty;
    } else {
        if(player.vy>0){
            player.y=Math.floor((nexty+player.radius)/tilesize)*tilesize-player.radius-0.01;
        } else if( player.vy<0){
            player.y=Math.ceil((nexty-player.radius)/tilesize)*tilesize+player.radius+0.01;
        }    
        player.vy=0;
    }
}

if(player.x< -tilesize) player.x=canvas.width+tilesize;
if(player.x> canvas.width +tilesize)player.x= -tilesize;

if(player.y< 0) {
    player.y=1;player.vy=0;
}
if(player.y> canvas.height){
    player.y=canvas.height-1;player.vy=0;
}



pellet();

ghosts.forEach(ghost=>{
    let dx=player.x-ghost.x;
    let dy=player.y-ghost.y;
    let dist=Math.sqrt(dx*dx+dy*dy);

    if(dist>0){
        let gvx=(dx/dist)*ghost.speed;
        let gvy=(dy/dist)*ghost.speed;
        
        if (ghost.wandertime>0){
            ghost.wandertime -=dt;
            gvx=ghost.wandervx;
            gvy=ghost.wandervy;
        }

        let nextgx=ghost.x+gvx*dt;
        let hwx=wallcollision(nextgx,ghost.y,ghost.radius);
        if(!hwx){
            ghost.x=nextgx;
        } else{
            if(gvx>0) ghost.x=Math.floor((nextgx+ghost.radius)/tilesize)*tilesize-ghost.radius-0.01;
            else if (gvx<0) ghost.x=Math.ceil((nextgx-ghost.radius)/tilesize)*tilesize+ghost.radius+0.01;
        }

        let nextgy=ghost.y+gvy*dt;
        let hwy=wallcollision(ghost.x,nextgy,ghost.radius);
        if(!hwy){
            ghost.y=nextgy;
        } else{
            if(gvy>0) ghost.y=Math.floor((nextgy+ghost.radius)/tilesize)*tilesize-ghost.radius-0.01;
            else if (gvy<0) ghost.y=Math.ceil((nextgy-ghost.radius)/tilesize)*tilesize+ghost.radius+0.01;
        }

        if ((hwx||hwy) && (!ghost.wandertime || ghost.wandertime<=0)){
            let anglerandom=Math.random()*Math.PI*2;
            ghost.wandervx=Math.cos(anglerandom)*ghost.speed;
            ghost.wandervy=Math.sin(anglerandom)*ghost.speed;
            ghost.wandertime= 0.5+Math.random()*1.5;
        }

        if(ghost.x < -tilesize) ghost.x =canvas.width+tilesize;
        if(ghost.x>canvas.width+tilesize) ghost.x = -tilesize;

        

    }

    if(distance(player.x,player.y,ghost.x,ghost.y)<player.radius+ghost.radius){
        if(!gameover) {playsound('death');}
        gameover=true;

        if(score>highscore){
            highscore=score;
            localStorage.setItem('pacman_highscore',highscore);
        }
        document.getElementById("gameover").style.visibility='visible';
        document.getElementById('score').innerText=score;
        document.getElementById('final_score').innerText = score;
        document.getElementById('final_time').innerText= elapsedtime + 's';
        document.getElementById('highscoredisp').innerText=highscore;
        document.getElementById('besttimedisplay').innerText=besttime!==null ? besttime + 's':"--s";
    }
    
});
}

function draw(){
    ctx.fillStyle='black';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.save();

    if (currentphase===2){
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(mazerotation);
        ctx.translate(-canvas.width/2, -canvas.height/2);
    }


    for (let r=0; r<rows;r++) {
        for (let c=0;c<cols;c++){
            if(maze[r][c]===1){
                ctx.fillStyle = "#1919A6";
                ctx.fillRect(c*tilesize, r*tilesize,tilesize,tilesize);
            } else if (maze[r][c]===0){
                ctx.fillStyle='pink';
                ctx.beginPath();
                ctx.arc(c*tilesize+tilesize/2, r*tilesize+tilesize/2, 3, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }

    ctx.fillStyle= 'yellow';
    ctx.beginPath();

    let offsetangle=0;

    if (player.vx>0.1) offsetangle=0;
    else if (player.vx < -0.1) offsetangle=Math.PI;
    else if (player.vy > 0.1) offsetangle=Math.PI/2;
    else if (player.vy < -0.1) offsetangle=-Math.PI/2;

    const mouthspeed=150;
    const maxopen=0.25;
    const moving=Math.abs(player.vx)>1 || Math.abs(player.vy)>1;
    const bite=moving? Math.abs(Math.sin(Date.now()/mouthspeed)) * maxopen:0.2;

    ctx.arc(player.x,player.y,player.radius,offsetangle+bite*Math.PI,offsetangle+(2-bite)*Math.PI);
    ctx.lineTo(player.x,player.y);
    ctx.fill();


    ghosts.forEach(ghost=> {
        ctx.fillStyle = ghost.color;
        ctx.beginPath();
        ctx.arc(ghost.x,ghost.y,ghost.radius,Math.PI,0);
        ctx.lineTo(ghost.x+ghost.radius, ghost.y + ghost.radius);
        ctx.lineTo(ghost.x+ghost.radius/2,ghost.y+ghost.radius-3);
        ctx.lineTo(ghost.x,ghost.y+ghost.radius);
        ctx.lineTo(ghost.x-ghost.radius/2,ghost.y+ghost.radius-3);
        ctx.lineTo(ghost.x-ghost.radius,ghost.y+ghost.radius);
        ctx.fill();

        ctx.fillStyle='black';
        ctx.beginPath();
        ctx.arc(ghost.x-3, ghost.y-2,1.5,0,Math.PI*2);
        ctx.arc(ghost.x+3,ghost.y-2,1.5,0,Math.PI*2);
        ctx.fill();
    });

    ctx.restore();

    if (!gamestart && !gameover) {
        ctx.fillStyle= 'rgba(0,0,0,0.7)';
        ctx.fillRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle= 'yellow';
        ctx.font= "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Press SPACE to start", canvas.width/2,canvas.height/2);
    }

}

window.resetGame();