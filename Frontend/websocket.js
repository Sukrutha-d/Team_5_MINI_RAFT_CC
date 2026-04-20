let socket;
function connectSocket(){
  // Automatically connect to the host that served the page
  const host = window.location.hostname || "localhost";
  socket = new WebSocket(`ws://${host}:4000`);

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
