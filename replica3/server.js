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

// Provide log access to election for vote requests
state.logManager = logManager

/* =========================
   RequestVote RPC
========================= */

app.post("/requestVote", (req, res) => {

  const { term, candidateId, lastLogIndex, lastLogTerm } = req.body

  // 1. Reply false if term < currentTerm
  if (term < state.currentTerm) {
    return res.json({ voteGranted: false, term: state.currentTerm })
  }

  // If candidate's term is higher, update our term and step down
  if (term > state.currentTerm) {
    state.currentTerm = term
    state.state = "follower"
    state.votedFor = null
  }

  // 2. If votedFor is null or candidateId, and candidate's log is at least as up-to-date as receiver's log, grant vote
  const myLastLogIndex = logManager.getLastIndex()
  const myLastLogTerm = logManager.getLastTerm()

  const logUpToDate = (lastLogTerm > myLastLogTerm) || 
                   (lastLogTerm === myLastLogTerm && lastLogIndex >= myLastLogIndex)

  if ((!state.votedFor || state.votedFor === candidateId) && logUpToDate) {
    state.votedFor = candidateId
    state.currentTerm = term
    election.startElectionTimer()

    console.log(`${state.id} voted for ${candidateId} in term ${term}`)
    return res.json({ voteGranted: true, term: state.currentTerm })
  }

  res.json({ voteGranted: false, term: state.currentTerm })
})

/* =========================
   AppendEntries RPC
========================= */

app.post("/appendEntries", (req, res) => {

  const { term, leaderId, entries, commitIndex } = req.body

  if (term < state.currentTerm) {
    return res.json({ success: false, term: state.currentTerm })
  }

  // If term >= currentTerm, the sender is a valid leader
  state.state = "follower"
  if (term > state.currentTerm) {
    state.currentTerm = term
    state.votedFor = null
  }
  state.leaderId = leaderId

  // Reset election timer
  election.startElectionTimer()

  // 🔥 Handle log replication
  if (entries && entries.length > 0) {
    logManager.appendEntries(entries)
    console.log(`${state.id} replicated logs from ${leaderId}`)
  }

  // Update commit index
  if (commitIndex > logManager.commitIndex) {
    logManager.commitIndex = Math.min(commitIndex, logManager.getLastIndex())
  }

  res.json({ success: true, term: state.currentTerm })
})

/* =========================
   Sync-Log RPC (Catch-Up)
========================= */

app.get("/sync-log", (req, res) => {
  const fromIndex = parseInt(req.query.from) || 0
  const committedEntries = logManager.log.slice(fromIndex)
  res.json(committedEntries)
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