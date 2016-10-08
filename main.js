var audioCtx = new AudioContext();

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
  audioCtx.decodeAudioData(audioData, function(buffer) {

    var vec = new Module.VectorDouble();

    var channelData = buffer.getChannelData(0)

    for(var ii in channelData) {
      vec.push_back(ii)
    }
    var chromagram = new Module.Chromagram(1024, buffer.sampleRate)

    chromagram.processAudioFrame(vec)

    vec._deleted()

    console.log("isReady", chromagram.isReady())

  }, function () { console.error("error", arguments) })
}



$(function() {

  getData()


})




// var sndBuffer = null;
// // Fix up prefixing
// window.AudioContext = window.AudioContext || window.webkitAudioContext;
// var context = new AudioContext();

// onError = console.error

// function loadSound(url) {
//   var request = new XMLHttpRequest();
//   request.open('GET', url, true);
//   request.responseType = 'arraybuffer';

//   // Decode asynchronously
//   request.onload = function() {
//     context.decodeAudioData(request.response, function(buffer) {
//       sndBuffer = buffer;
//       console.log("hi")
//     }, onError);
//   }
//   request.send();
// }

// $(function() {

//   loadSound('/samples/A-Chord.mp3')


// })


