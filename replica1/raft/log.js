const fs = require("fs")
const path = require("path")

class LogManager {

  constructor() {
    this.log = []
    this.commitIndex = -1

    this.file = path.join(__dirname, "../storage/log.json")

    this.loadLog()
  }

  loadLog() {
    try {
      const data = fs.readFileSync(this.file)
      this.log = JSON.parse(data)
    } catch {
      this.log = []
    }
  }

  persist() {
    fs.writeFileSync(this.file, JSON.stringify(this.log, null, 2))
  }

  append(entry) {
    this.log.push(entry)
    this.persist()
  }

  getLastIndex() {
    return this.log.length - 1
  }

  getLastTerm() {
    if (this.log.length === 0) return 0
    return this.log[this.log.length - 1].term
  }

}

module.exports = LogManager
