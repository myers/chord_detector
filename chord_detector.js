function Chromagram(frameSize, samplingFrequency) {
  this._ptr = Chromagram._constructor(frameSize, samplingFrequency)
}
Chromagram.prototype = {
  _free: function() {
    Chromagram._destructor(this._ptr)
  },

  processAudioFrame: function(channelData) {
    var float64Arr = new Float64Array(channelData)
    var size = float64Arr.length * float64Arr.BYTES_PER_ELEMENT;
    var cArray = Module._malloc(size);
    Module.HEAPF64.set(float64Arr, cArray / float64Arr.BYTES_PER_ELEMENT);
    Chromagram._processAudioFrame(this._ptr, cArray)
    Module._free(cArray)
  },

  isReady: function() {
    return Chromagram._isReady(this._ptr) == 1
  },

  getChromagram: function() {
    const dest = new Float64Array(12)
    const cArray = Module._malloc(dest.length * dest.BYTES_PER_ELEMENT)
    Chromagram._getChromagram(this._ptr, cArray)
    const startOffset = cArray / dest.BYTES_PER_ELEMENT
    dest.set(Module.HEAPF64.slice(startOffset, startOffset+dest.length))
    Module._free(cArray)
    return dest
  },
}

Chromagram._constructor = Module.cwrap('Chromagram_constructor', 'number', ['number', 'number'])
Chromagram._destructor = Module.cwrap('Chromagram_destructor', null, ['number'])
Chromagram._processAudioFrame = Module.cwrap('Chromagram_processAudioFrame', null, ['number'])
Chromagram._isReady = Module.cwrap('Chromagram_isReady', 'number', ['number'])
Chromagram._getChromagram = Module.cwrap('Chromagram_getChromagram', 'number', ['number', 'number'])


function ChordDetector() {
  this._ptr = ChordDetector._constructor()
}

ChordDetector.prototype = {
  _free: function() {
    ChordDetector._destructor(this._ptr)
  },

  detectChord: function(chroma) {
    var size = chroma.length * chroma.BYTES_PER_ELEMENT;
    var cArray = Module._malloc(size);
    Module.HEAPF64.set(chroma, cArray / chroma.BYTES_PER_ELEMENT);
    ChordDetector._detectChord(this._ptr, cArray)
    Module._free(cArray)
  },

  /** The root note of the detected chord */
  rootNote: function() {
    switch(ChordDetector._getRootNote(this._ptr)) {
      case 0: return "C";
      case 1: return "C#";
      case 2: return "D";
      case 3: return "D#";
      case 4: return "E";
      case 5: return "F";
      case 6: return "F#";
      case 7: return "G";
      case 8: return "G#";
      case 9: return "A";
      case 10: return "A#";
      case 11: return "B";
    }
  },

  quality: function() {
    switch(ChordDetector._getQuality(this._ptr)) {
      case 0: return "Minor";
      case 1: return "Major";
      case 2: return "Suspended";
      case 3: return "Dominant";
      case 4: return "Dimished5th";
      case 5: return "Augmented5th";
    }
  },

  intervals: function() {
    return ChordDetector._getIntervals(this._ptr)
  }
}

ChordDetector._constructor = Module.cwrap('ChordDetector_constructor', 'number')
ChordDetector._destructor = Module.cwrap('ChordDetector_destructor', null, ['number'])
ChordDetector._detectChord = Module.cwrap('ChordDetector_detectChord', null, ['number'])
ChordDetector._getRootNote = Module.cwrap('ChordDetector_getRootNote', 'number', ['number'])
ChordDetector._getQuality = Module.cwrap('ChordDetector_getQuality', 'number', ['number'])
ChordDetector._getIntervals = Module.cwrap('ChordDetector_getIntervals', 'number', ['number'])

module.exports = {
  Chromagram: Chromagram,
  ChordDetector: ChordDetector
}
