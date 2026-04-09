const fs = require("fs")
const path = require("path")

class LogManager {

  constructor() {

    this.log = []
    this.commitIndex = -1

    this.file = path.join(__dirname, "../storage/log.json")

    this.loadLog()
  }

  // Load log from disk when node starts
  loadLog() {
    try {
      const data = fs.readFileSync(this.file, "utf-8")
      this.log = JSON.parse(data)

      console.log("Log loaded from disk:", this.log)

    } catch (err) {
      console.log("No existing log file. Starting fresh.")
      this.log = []
    }
  }

  // Save log to disk
  persist() {
    try {
      fs.writeFileSync(this.file, JSON.stringify(this.log, null, 2))
    } catch (err) {
      console.error("Error writing log to disk:", err)
    }
  }

  // Add new entry (leader uses this)
  append(entry) {
    this.log.push(entry)
    this.persist()

    console.log("Log appended:", entry)
  }

  // Used by followers during replication
  appendEntries(entries) {

    for (let entry of entries) {

      if (entry.index < this.log.length) {
        // overwrite conflicting entry
        this.log[entry.index] = entry
      } else {
        this.log.push(entry)
      }

    }

    this.persist()

    console.log("Entries replicated:", entries)
  }

  // Get last log index
  getLastIndex() {
    return this.log.length - 1
  }

  // Get last log term
  getLastTerm() {
    if (this.log.length === 0) return 0
    return this.log[this.log.length - 1].term
  }

}

module.exports = LogManager