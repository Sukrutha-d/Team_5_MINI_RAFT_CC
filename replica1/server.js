const express = require("express")
const bodyParser = require("body-parser")

const RaftState = require("./raft/state")
const Election = require("./raft/election")
const LogManager = require("./raft/log")
const Replication = require("./raft/replication")

const app = express()
app.use(bodyParser.json())

const PORT = process.env.PORT || 5000
const ID = process.env.REPLICA_ID || "replica1"

const PEERS = process.env.PEERS
  ? process.env.PEERS.split(",")
  : []

// Initialize RAFT state
const state = new RaftState(ID, PEERS)
const election = new Election(state)

// Initialize Log + Replication
const logManager = new LogManager()
const replication = new Replication(state, logManager)

// Start election timer
election.startElectionTimer()

/* =========================
   RequestVote RPC
========================= */

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

/* =========================
   AppendEntries RPC
   (Heartbeat + Log Replication)
========================= */

app.post("/appendEntries", (req, res) => {

  const { term, leaderId, entries } = req.body

  if (term < state.currentTerm) {
    return res.json({ success: false })
  }

  state.state = "follower"
  state.currentTerm = term
  state.leaderId = leaderId

  // 🔥 Handle log replication
  if (entries && entries.length > 0) {
    logManager.appendEntries(entries)
  }

  election.startElectionTimer()

  if (entries && entries.length > 0) {
  console.log(`${state.id} replicated logs from ${leaderId}`)
}

  res.json({ success: true })
})

/* =========================
   Command Endpoint (Leader Only)
========================= */

app.post("/command", async (req, res) => {

  if (state.state !== "leader") {
    return res.status(400).json({ error: "Not leader" })
  }

  const command = req.body

  try {

    const success = await replication.replicate(command)

    res.json({ committed: success })

  } catch (err) {

    res.status(500).json({ error: err.message })

  }

})

/* =========================
   Debug Endpoints
========================= */

// Check state
app.get("/state", (req, res) => {

  res.json({
    id: state.id,
    state: state.state,
    term: state.currentTerm,
    leader: state.leaderId
  })

})

// Check logs
app.get("/logs", (req, res) => {

  res.json(logManager.log)

})

/* =========================
   Start Server
========================= */

app.listen(PORT, () => {
  console.log(`${ID} running on port ${PORT}`)
})