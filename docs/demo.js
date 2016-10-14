const cd = require("../index.js")

$(function() {
  const audioCtx = new AudioContext();

  var chromagram
  var source
  var currentChroma = new Float32Array(12)
  const chordDetector = new cd.ChordDetector()
  var output

  $('audio').on('play', function(event) {
    // pause and reset other elements
    $('audio').each((idx, el) => {
      if (el == this) return
      el.pause()
      el.currentTime = 0
    })

    output = $('#chord-detection')

    if (chromagram) {
      chromagram._free()
    }
    chromagram = new cd.Chromagram(1024, 44100)

    source = audioCtx.createMediaElementSource(this)
    $(this).on('ended', () => {
      currentChroma.fill(0)
      source.disconnect(scriptNode)
      scriptNode.disconnect(audioCtx.destination)
      this.currentTime = 0
    })
    source.connect(scriptNode)
    scriptNode.connect(audioCtx.destination)
  })


  $('#chroma-visualizer').html('<canvas width="800" height="256">');
  visualizationCtx = $('#chroma-visualizer canvas').get(0).getContext('2d');
  const gradient = visualizationCtx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(1, '#000000');
  gradient.addColorStop(0.75, '#2ecc71');
  gradient.addColorStop(0.25, '#f1c40f');
  gradient.addColorStop(0, '#e74c3c');

  notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
  function updateVisualization() {
    visualizationCtx.clearRect(0, 0, 800, 256);

    for (let i = 0; i < currentChroma.length; i++) {
      const value = currentChroma[i];
      visualizationCtx.fillStyle = gradient;
      visualizationCtx.fillRect(i * 65, 246, 10, value * -7);

      visualizationCtx.fillStyle = 'black';
      visualizationCtx.fillText(notes[i], i * 65, 256);
    }

    requestAnimationFrame(updateVisualization);
  }
  updateVisualization();

  const scriptNode = audioCtx.createScriptProcessor(1024, 1, 1)
  scriptNode.onaudioprocess = function(audioProcessingEvent) {
    var inputBuffer = audioProcessingEvent.inputBuffer;
    var outputBuffer = audioProcessingEvent.outputBuffer;
    // Loop through the output channels (in this case there is only one)
    for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
      outputBuffer.copyToChannel(inputBuffer.getChannelData(channel), channel)
    }

    chromagram.processAudioFrame(inputBuffer)
    if (chromagram.isReady()) {
      currentChroma = chromagram.getChromagram()
      chordDetector.detectChord(currentChroma)
      output.html("Is it " + chordDetector.rootNote() + " " + chordDetector.quality() + " " +  chordDetector.intervals() + "?")
    }
  }
})
