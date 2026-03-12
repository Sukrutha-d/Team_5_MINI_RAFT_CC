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

    for (let peer of this.state.peers) {

      try {

        const res = await axios.post(`${peer}/appendEntries`, {
          term: this.state.currentTerm,
          leaderId: this.state.id,
          entries: [entry]
        })

        if (res.data.success) successCount++

      } catch {
        console.log("Replication failed to peer")
      }

    }

    if (successCount > this.state.peers.length / 2) {

      this.logManager.commitIndex = entry.index

      console.log("Entry committed:", entry)

      return true

    }

    return false
  }

}

module.exports = Replication
