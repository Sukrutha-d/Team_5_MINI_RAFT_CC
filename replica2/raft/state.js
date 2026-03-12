class RaftState {
  constructor(id, peers) {
    this.id = id
    this.peers = peers

    this.state = "follower"

    this.currentTerm = 0
    this.votedFor = null
    this.leaderId = null

    this.votesReceived = 0

    this.electionTimer = null
    this.heartbeatTimer = null
  }
}

module.exports = RaftState