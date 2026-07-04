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


const keys= {
    ArrowUp:false,
    ArrowDown:false,
    ArrowLeft:false,
    ArrowRight:false
}

window.addEventListener('keydown',(e)=>{
    if(e.code==="Space" && !gamestart && !gameover){
        gamestart=true;
        starttime=Date.now();
        lasttime=Date.now();
        e.preventDefault();
        return
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
    document.getElementById('phase').classList.remove("phase2");
    maze=mazelayout.map(row=> [...row]);
    player.x=9.5*tilesize;
    player.y=16.5*tilesize;
    player.vx= -player.speed;
    player.vy=0;

    ghosts=[
        {x:9.5*tilesize,y:9.5*tilesize,color:'#FF0000',speed:60,radius:tilesize/2-2},
        {x:8.5*tilesize,y:10.5*tilesize,color:"#ff69b4",speed:50,radius:tilesize/2-2},
        {x:10.5*tilesize,y:10.5*tilesize,color:"#00ffff",speed:55,radius:tilesize/2-2}
    ]

    document.getElementById('gameover').style.visibiity='hidden';
    document.getElementById('gameover').querySelector('h2').innerText='GAME OVER';
    document.getElementById('gameover').querySelector('h2').style.color='red';

    if(animationID) cancelAnimationFrame(animationID);
    lasttime=Date.now();
    gameloop();
}

function wallcollision(x,y,radius){
    const leftcol=Math.floor((x-radius)/tilesize);
    const rightcol=Math.floor((x+radius)/tilesize);
    const toprow=Math.floor((y-radius)/tilesize);
    const bottomrow=Math.floor((y+radius)/tilesize);

    for(let r=toprow;r<=bottomrow;r++){
        for (let c=leftcol;c<=rightcol;c++){
            if(maze[r][c]===1){
                return true;
            } 
            
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
                document.getElementById('gameover').style.visibility='visible';
                document.getElementById('gameover').querySelector('h2').innerText='YOU WIN!';
                document.getElementById('gameover').querySelector('h2').style.color='green';
                document.getElementById('score').innerText=score;
                document.getElementById('final_score').innerText = score;
            }
        }
    }
}

function distance(x1,y1,x2,y2){
    return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
}

let lasttime=Date.now();

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
        document.getElementById('phase').innerText=currentphase;

        if(currentphase===2){
            document.getElementById('phase').classList.add('phase2');
        }else{
            document.getElementById('phase').classList.remove('phase2');
            mazerotation=0;

            let curcol=Math.floor(player.x/tilesize);
            let currow=Math.floor(player.y/tilesize);
            player.x=curcol*tilesize+tilesize/2;
            player.vx=0;
            player.vy=0;

        }
    }

    if (currentphase==1){
        let invx=player.vx;
        let invy=player.vy;

        if (keys.ArrowLeft){invx=-player.speed;invy=0;}
        else if (keys.ArrowRight){invx=player.speed;invy=0;}
        else if (keys.ArrowUp){invx=0;invy=-player.speed;}
        else if (keys.ArrowDown){invx=0;invy=player.speed;}

        if(invx!==player.vx ||invy!==player.vy){
            if((invx!==0 && invx===-player.vx)||(invy!==0 && invy===-player.vy) || (player.vx==0 && player.vy===0)){
                player.vx=invx;
                player.vy=invy;
            }else{
                let curcol=Math.floor(player.x/tilesize);
                let currow=Math.floor(player.y/tilesize);

                let nextcol=curcol+Math.sign(invx);
                let nextrow=currow+Math.sign(invy);

                let iswall=false;
                if (nextrow>=0 && nextrow < rows && nextcol>=0 && nextcol<cols){
                    iswall=(maze[nextrow][nextcol]===1);
                } else{
                    if (nextrow!==8 && nextrow!==10 && nextrow!==12) iswall=true;
                }

                let dxcenter=Math.abs(player.x-(curcol*tilesize+tilesize/2));
                let dycenter=Math.abs(player.y-(currow*tilesize+tilesize/2));

                if (!iswall && dxcenter<=4 && dycenter<=4){
                    player.vx=invx;
                    player.vy=invy;
                    if(invx!==0) player.x=curcol*tilesize+tilesize/2;
                    if(invy!==0) player.y=currow*tilesize+tilesize/2;
                }
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

    const gx=Math.sin(-mazerotation)*gravity;
    const  gy=Math.cos(-mazerotation)*gravity;

    player.vx+=gx*dt;
    player.vy+=gy*dt;

    let nextx=player.x+player.vx*dt;
    if(!wallcollision(nextx,player.y,player.radius)){
        player.x=nextx;
    }

    let nexty=player.y+player.vy*dt;
    if(!wallcollision(player.x,nexty,player.radius)){
        player.y=nexty;
    }
}

if(player.x< -tilesize) player.x=canvas.width+tilesize;
if(player.x> canvas.width +tilesize)player.x= -tilesize;

pellet();

ghosts.forEach(ghost=>{
    let dx=player.x-ghost.x;
    let dy=player.y-ghost.y;
    let dist=Math.sqrt(dx*dx+dy*dy);

    if(dist>0){
        let gvx=(dy/dist)*ghost.speed;
        let gvy=(dx/dist)*ghost.speed;
        
        if (ghost.wandertime>0){
            ghost.wandertime -=dt;
            gvx=ghost.wandervx;
            gvy=ghost.wandervy;
        }

        let nextgx=ghost.x+gvx*dt;
        let hwx=wallcollision(nextgx,ghost.y,ghost.radius);
        if(!hwx){
            ghost.x=nextgx;
        }

        let nextgy=ghost.y+gvy*dt;
        let hwy=wallcollision(ghost.x,nextgy,ghost.radius);
        if(!hwy){
            ghost.y=nextgy;
        }

        if ((hwx||hwy) && (!ghost.wandertime || ghost.wandertime<=0)){
            let anglerandom=Math.random()*Math.PI*2;
            ghost.wandervx=Math.cos(anglerandom)*ghost.speed;
            ghost.wandervy=Math.sin(anglerandom)*ghost.speed;
            ghost.wandertime= 0.5+Math.random()*1.5;
        }


    }

    if(distance(player.x,player.y,ghost.x,ghost.y)<player.radius+ghost.radius){
        gameover=true;
        document.getElementById("gameover").style.visibility='visible';
        document.getElementById('score').innerText=score;
        document.getElementById('final_score').innerText = score;
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
    else if (player.vx > 0.1) offsetangle=Math.PI/2 * 3;
    else if (player.vy < -0.1) offsetangle=Math.PI/2;

    ctx.arc(player.x,player.y,player.radius,offsetangle+0.2*Math.PI, offsetangle+1.8*Math.PI);
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