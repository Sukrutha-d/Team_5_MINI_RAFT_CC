const axios = require("axios")

class Election {

  constructor(state) {
    this.state = state
  }

  startElectionTimer() {

    // 🔥 Increased timeout for stability
    const timeout = Math.floor(Math.random() * 1000) + 1500

    clearTimeout(this.state.electionTimer)

    this.state.electionTimer = setTimeout(() => {
      this.startElection()
    }, timeout)
  }

  async startElection() {

    this.state.state = "candidate"
    this.state.currentTerm += 1
    this.state.votedFor = this.state.id
    this.state.votesReceived = 1

    console.log(`${this.state.id} starting election for term ${this.state.currentTerm}`)

    try {

      // 🔥 PARALLEL REQUESTS (KEY FIX)
      const promises = this.state.peers.map(peer => {
        return axios.post(`${peer}/requestVote`, {
          term: this.state.currentTerm,
          candidateId: this.state.id
        }).catch(err => {
          console.log(`Peer unreachable: ${peer} → ${err.message}`)
          return null
        })
      })

      const results = await Promise.all(promises)

      for (let res of results) {
        if (res && res.data.voteGranted) {
          this.state.votesReceived++
        }
      }

    } catch (err) {
      console.log("Election error:", err.message)
    }

    // 🔥 Majority check
    if (this.state.votesReceived > this.state.peers.length / 2) {
      this.becomeLeader()
    } else {
      this.startElectionTimer()
    }
  }

  becomeLeader() {

    this.state.state = "leader"
    this.state.leaderId = this.state.id

    console.log(`${this.state.id} became LEADER`)

    // 🔥 Clear old heartbeat (important)
    clearInterval(this.state.heartbeatTimer)

    this.startHeartbeat()
  }

  startHeartbeat() {

    this.state.heartbeatTimer = setInterval(() => {

      this.state.peers.forEach(peer => {

        axios.post(`${peer}/appendEntries`, {
          term: this.state.currentTerm,
          leaderId: this.state.id
        }).catch(err => {
          console.log(`Heartbeat failed to ${peer}`)
        })

      })

    }, 300) // slightly slower for stability
  }
}

module.exports = Election