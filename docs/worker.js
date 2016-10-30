const cd = require("../index.js")

const chromagram = new cd.Chromagram(1024, 44100)
const chordDetector = new cd.ChordDetector()

module.exports = function (self) {
  self.firstSampleArrivedAt = null;
  self.addEventListener('message', function (ev) {
    if (!ev.data.hasOwnProperty('audioData')) {
      console.log("expected audioData")
    }
    chromagram.processAudioFrame(ev.data.audioData)

    if (self.firstSampleArrivedAt == null) {
      self.firstSampleArrivedAt = ev.data.sentAt
    }

    if (!chromagram.isReady()) return

    currentChroma = chromagram.getChromagram()
    chordDetector.detectChord(currentChroma)
    self.postMessage({
      receivedAt: self.firstSampleArrivedAt,
      currentChroma: currentChroma,
      rootNote: chordDetector.rootNote(),
      quality: chordDetector.quality(),
      intervals: chordDetector.intervals()
    })
    self.firstSampleArrivedAt = null
  })
}