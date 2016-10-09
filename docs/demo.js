const cd = require("../index.js")

$(function() {
  const audioCtx = new AudioContext();

  var chromagram
  var source
  var currentChroma;
  const chordDetector = new cd.ChordDetector()
  var output

  $('audio').on('play', function(event) {
    // pause and reset other elements
    $('audio').each((idx, el) => {
      if (el == this) return
      el.pause()
      el.currentTime = 0
    })

    output = $(this).parent().find(".chord")

    if (chromagram) {
      chromagram._free()
    }
    chromagram = new cd.Chromagram(1024, 44100)

    source = audioCtx.createMediaElementSource(this)
    $(this).on('ended', () => {
      source.disconnect(scriptNode)
      scriptNode.disconnect(audioCtx.destination)
      this.currentTime = 0
    })
    source.connect(scriptNode)
    scriptNode.connect(audioCtx.destination)
  })

  const scriptNode = audioCtx.createScriptProcessor(1024, 1, 1)
  scriptNode.onaudioprocess = function(audioProcessingEvent) {
    var inputBuffer = audioProcessingEvent.inputBuffer;
    var outputBuffer = audioProcessingEvent.outputBuffer;
    chromagram.processAudioFrame(inputBuffer)
    if (chromagram.isReady()) {
      currentChroma = chromagram.getChromagram()
      chordDetector.detectChord(currentChroma)
      output.html("Detected " + chordDetector.rootNote() + " " + chordDetector.quality() + " " +  chordDetector.intervals())
    }

    // Loop through the output channels (in this case there is only one)
    for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
      outputBuffer.copyToChannel(inputBuffer.getChannelData(channel), channel)
    }
  }
})
