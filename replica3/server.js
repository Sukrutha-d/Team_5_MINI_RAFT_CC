const express = require("express")
const bodyParser = require("body-parser")

const RaftState = require("./raft/state")
const Election = require("./raft/election")

const app = express()
app.use(bodyParser.json())

const PORT = process.env.PORT || 5000
const ID = process.env.REPLICA_ID || "replica1"

const PEERS = process.env.PEERS
  ? process.env.PEERS.split(",")
  : []

const state = new RaftState(ID, PEERS)
const election = new Election(state)

election.startElectionTimer()

/* RequestVote RPC */

app.post("/requestVote", (req, res) => {

  const { term, candidateId } = req.body

  if (term < state.currentTerm) {
    return res.json({ voteGranted: false })
  }

  if (!state.votedFor || state.votedFor === candidateId) {

    state.votedFor = candidateId
    state.currentTerm = term

    election.startElectionTimer()

    console.log(`${state.id} voted for ${candidateId}`)

    return res.json({ voteGranted: true })
  }

  res.json({ voteGranted: false })
})

/* Heartbeat */

app.post("/appendEntries", (req, res) => {

  const { term, leaderId } = req.body

  if (term >= state.currentTerm) {

    state.state = "follower"
    state.currentTerm = term
    state.leaderId = leaderId

    election.startElectionTimer()

    console.log(`${state.id} received heartbeat from ${leaderId}`)
  }

  res.json({ success: true })
})

/* Debug endpoint */

app.get("/state", (req, res) => {

  res.json({
    id: state.id,
    state: state.state,
    term: state.currentTerm,
    leader: state.leaderId
  })

})

app.listen(PORT, () => {
  console.log(`${ID} running on port ${PORT}`)
})