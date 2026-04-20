const axios = require("axios")

class Replication {

  constructor(state, logManager) {
    this.state = state
    this.logManager = logManager
  }

  async replicate(command) {

    if (this.state.state !== "leader") {
      throw new Error("Not leader")
    }

    const entry = {
      term: this.state.currentTerm,
      index: this.logManager.getLastIndex() + 1,
      command: command
    }

    this.logManager.append(entry)

    let successCount = 1

    const promises = this.state.peers.map(peer => {
      return axios.post(`${peer}/appendEntries`, {
        term: this.state.currentTerm,
        leaderId: this.state.id,
        entries: [entry],
        commitIndex: this.logManager.commitIndex
      }).then(res => {
        if (res.data.success) return true
        return false
      }).catch(() => false)
    })

    const results = await Promise.all(promises)
    successCount += results.filter(r => r).length

    if (successCount > (this.state.peers.length + 1) / 2) {

      this.logManager.commitIndex = entry.index
      console.log("Entry committed:", entry)

      /* =========================
         Broadcast to Gateway
      ========================= */
      const gatewayUrl = process.env.GATEWAY_URL || "http://gateway:4000"
      
      axios.post(`${gatewayUrl}/broadcast`, {
        type: "stroke",
        ...command
      }).catch(err => {
        console.error("Failed to broadcast to gateway:", err.message)
      })

      return true
    }

    return false
  }

}

module.exports = Replication
