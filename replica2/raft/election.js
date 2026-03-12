const axios = require("axios")

class Election {

  constructor(state) {
    this.state = state
  }

  startElectionTimer() {

    const timeout = Math.floor(Math.random() * 300) + 500

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

    for (let peer of this.state.peers) {
      try {

        const res = await axios.post(`${peer}/requestVote`, {
          term: this.state.currentTerm,
          candidateId: this.state.id
        })

        if (res.data.voteGranted) {
          this.state.votesReceived++
        }

      } catch (err) {
        console.log("Peer unreachable")
      }
    }

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

    this.startHeartbeat()
  }

  startHeartbeat() {

    this.state.heartbeatTimer = setInterval(() => {

      for (let peer of this.state.peers) {

        axios.post(`${peer}/appendEntries`, {
          term: this.state.currentTerm,
          leaderId: this.state.id
        }).catch(() => {})

      }

    }, 150)
  }
}

module.exports = Election