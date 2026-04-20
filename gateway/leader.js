const axios = require("axios")
const { replicas } = require("./config")

let currentLeader = null

async function detectLeader() {

  let found = false

  for (let replica of replicas) {

    try {

      const res = await axios.get(`${replica}/state`)

      console.log("Checking:", replica, res.data)

      if (res.data.state === "leader") {

        currentLeader = replica
        found = true

        console.log("Leader detected:", replica)
        break
      }

    } catch (err) {
      console.log("Replica unreachable:", replica)
    }
  }

  // 🔥 IMPORTANT: reset if no leader found
  if (!found) {
    currentLeader = null
  }
}

function getLeader() {
  return currentLeader
}

module.exports = { detectLeader, getLeader }