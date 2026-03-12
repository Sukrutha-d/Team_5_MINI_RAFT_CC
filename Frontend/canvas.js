const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 500;

let drawing = false;
let prevX = 0;
let prevY = 0;

canvas.addEventListener("mousedown",(e)=>{
 drawing = true;
 prevX = e.offsetX;
 prevY = e.offsetY;
});

canvas.addEventListener("mouseup",()=>{
 drawing = false;
});

canvas.addEventListener("mousemove",(e)=>{

 if(!drawing) return;

 const x = e.offsetX;
 const y = e.offsetY;

 drawLine(prevX,prevY,x,y);

 sendStroke(prevX,prevY,x,y);

 prevX = x;
 prevY = y;

});


function drawLine(x0,y0,x1,y1){

 ctx.beginPath();
 ctx.moveTo(x0,y0);
 ctx.lineTo(x1,y1);
 ctx.stroke();

}


function drawRemoteStroke(data){

 drawLine(data.x0,data.y0,data.x1,data.y1);

}
