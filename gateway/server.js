const express = require("express")
const cors = require("cors")
const WebSocket = require("ws")
const axios = require("axios")

const { detectLeader, getLeader } = require("./leader")
const broadcast = require("./broadcast")

const app = express()

app.use(cors())
app.use(express.json())

const PORT = 4000

const server = app.listen(PORT, () => {
  console.log("Gateway running on port", PORT)
})

const wss = new WebSocket.Server({ server })

/* Detect leader every 3 seconds */

setInterval(detectLeader, 3000)

/* WebSocket connection */

wss.on("connection", ws => {

  console.log("Client connected")

  ws.on("message", async message => {

    try {

      const data = JSON.parse(message)

      if (data.type === "draw") {

        const leader = getLeader()

        if (!leader) {
          console.log("No leader available")
          return
        }

        /* Send drawing event to leader */

        await axios.post(`${leader}/draw`, data)

        /* Broadcast to all users */

        broadcast(wss, data)

      }

    } catch (err) {

      console.log("Error handling message", err.message)

    }

  })

  ws.on("close", () => {
    console.log("Client disconnected")
  })

})