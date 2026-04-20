const axios = require("axios")

class Election {

  constructor(state) {
    this.state = state
  }

  startElectionTimer() {

    // Specification randomized for stability: 1000-1500 ms
    const timeout = Math.floor(Math.random() * 500) + 1000

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

      const lastLogIndex = this.state.logManager ? this.state.logManager.getLastIndex() : -1
      const lastLogTerm = this.state.logManager ? this.state.logManager.getLastTerm() : 0

      // PARALLEL REQUESTS
      const promises = this.state.peers.map(peer => {
        return axios.post(`${peer}/requestVote`, {
          term: this.state.currentTerm,
          candidateId: this.state.id,
          lastLogIndex,
          lastLogTerm
        }).catch(err => {
          console.log(`Peer unreachable: ${peer}`)
          return null
        })
      })

      const results = await Promise.all(promises)

      for (let res of results) {
        if (res && res.data.voteGranted) {
          this.state.votesReceived++
        } else if (res && res.data.term > this.state.currentTerm) {
          // If we find a higher term, step down
          this.state.currentTerm = res.data.term
          this.state.state = "follower"
          this.state.votedFor = null
          this.startElectionTimer()
          return
        }
      }

    } catch (err) {
      console.log("Election error:", err.message)
    }

    // Majority check
    if (this.state.state === "candidate" && this.state.votesReceived > this.state.peers.length / 2) {
      this.becomeLeader()
    } else {
      this.startElectionTimer()
    }
  }

  becomeLeader() {

    this.state.state = "leader"
    this.state.leaderId = this.state.id

    console.log(`${this.state.id} became LEADER`)

    clearInterval(this.state.heartbeatTimer)
    this.startHeartbeat()
  }

  startHeartbeat() {

    this.state.heartbeatTimer = setInterval(() => {

      this.state.peers.forEach(peer => {

        axios.post(`${peer}/appendEntries`, {
          term: this.state.currentTerm,
          leaderId: this.state.id,
          commitIndex: this.state.logManager ? this.state.logManager.commitIndex : -1
        }).catch(err => {
          // console.log(`Heartbeat failed to ${peer}`)
        })

      })

    }, 150) // Specification: Heartbeat Interval 150 ms
  }
}

module.exports = Election