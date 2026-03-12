const axios = require("axios")
const { replicas } = require("./config")

let currentLeader = null

async function detectLeader() {

  for (let replica of replicas) {

    try {

      const res = await axios.get(`${replica}/state`)

      if (res.data.state === "leader") {

        currentLeader = replica
        console.log("Leader detected:", replica)

        return
      }

    } catch (err) {}

  }

}

function getLeader() {
  return currentLeader
}

module.exports = { detectLeader, getLeader }