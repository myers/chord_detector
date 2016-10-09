const cd = require("../index.js")

$(function() {

  $('audio').on('play', (event) => { console.log("here") })

  const audioCtx = new AudioContext();

  const scriptNode = audioCtx.createScriptProcessor(1024, 1, 1);

  const chromagram = new cd.Chromagram(1024, 44100)
  const chordDetector = new cd.ChordDetector()

  var currentChroma;

  scriptNode.onaudioprocess = function(audioProcessingEvent) {
    var inputBuffer = audioProcessingEvent.inputBuffer;
    var outputBuffer = audioProcessingEvent.inputBuffer;
    chromagram.processAudioFrame(inputBuffer)
    if (chromagram.isReady()) {
      currentChroma = chromagram.getChromagram()
      // console.log("chromagram", currentChroma)
      chordDetector.detectChord(currentChroma)
      console.log("chord", chordDetector.rootNote, chordDetector.quality, chordDetector.intervals)
    }

    // Loop through the output channels (in this case there is only one)
    for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
      var inputData = inputBuffer.getChannelData(channel);
      var outputData = outputBuffer.getChannelData(channel);

      // Loop through the 4096 samples
      for (var sample = 0; sample < inputBuffer.length; sample++) {
        // make output equal to the same as the input
        outputData[sample] = inputData[sample];
      }
    }
  }

  var source = audioCtx.createBufferSource();

  source.onended = function() {
    source.disconnect(scriptNode);
    scriptNode.disconnect(audioCtx.destination);
    chromagram._free()
    chordDetector._free()
  }

  source.connect(scriptNode);
  scriptNode.connect(audioCtx.destination);

  function getData() {
    request = new XMLHttpRequest();

    request.open('GET', '/samples/A-Chord.mp3', true);
    request.responseType = 'arraybuffer';
    request.onload = function() {
      processAudio(request.response)
    }
    request.send()
  }

  function processAudio(audioData) {
    audioCtx.decodeAudioData(audioData, function(audioBuffer) {
      source.buffer = audioBuffer;
      source.start();
    }, function () { console.error("error", arguments) })
  }


  getData()

})
