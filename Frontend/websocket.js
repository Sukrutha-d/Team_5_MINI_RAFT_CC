let socket;

function connectSocket(){

 socket = new WebSocket("ws://localhost:4000");

 socket.onopen = () => {
    console.log("Connected to gateway");
 };

 socket.onmessage = (event) => {

    const data = JSON.parse(event.data);

    if(data.type === "stroke"){
        drawRemoteStroke(data);
    }

 };

 socket.onclose = () => {
    console.log("Disconnected. Reconnecting...");
    setTimeout(connectSocket,1000);
 };

}

connectSocket();


function sendStroke(x0,y0,x1,y1){

 socket.send(JSON.stringify({
    type:"stroke",
    x0:x0,
    y0:y0,
    x1:x1,
    y1:y1
 }));

}
