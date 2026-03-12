function broadcast(wss, message) {

  wss.clients.forEach(client => {

    if (client.readyState === 1) {
      client.send(JSON.stringify(message))
    }

  })

}

module.exports = broadcast