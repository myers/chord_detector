class Chromagram {
  constructor(frameSize, samplingFrequency) {
    this._ptr = Chromagram._constructor(frameSize, samplingFrequency)
  }

  _free() {
    Chromagram._destructor(this._ptr)
  }

  processAudioFrame(audioBuffer) {
    var float32Arr = audioBuffer.getChannelData(0)
    var float64Arr = new Float64Array(float32Arr)
    var size = float64Arr.length * float64Arr.BYTES_PER_ELEMENT;
    var cArray = Module._malloc(size);
    Module.HEAPF64.set(float64Arr, cArray / float64Arr.BYTES_PER_ELEMENT);
    Chromagram._processAudioFrame(this._ptr, cArray)
    Module._free(cArray)
  }

  isReady() {
    return Chromagram._isReady(this._ptr) == 1
  }

  getChromagram() {
    const dest = new Float64Array(12)
    const cArray = Module._malloc(dest.length * dest.BYTES_PER_ELEMENT)
    Chromagram._getChromagram(this._ptr, cArray)
    const startOffset = cArray / dest.BYTES_PER_ELEMENT
    dest.set(Module.HEAPF64.slice(startOffset, startOffset+dest.length))
    Module._free(cArray)
    return dest
  }
}

Chromagram._constructor = Module.cwrap('Chromagram_constructor', 'number', ['number', 'number'])
Chromagram._destructor = Module.cwrap('Chromagram_destructor', null, ['number'])
Chromagram._processAudioFrame = Module.cwrap('Chromagram_processAudioFrame', null, ['number'])
Chromagram._isReady = Module.cwrap('Chromagram_isReady', 'number', ['number'])
Chromagram._getChromagram = Module.cwrap('Chromagram_getChromagram', 'number', ['number', 'number'])
