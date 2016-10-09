index.js: Makefile chord_detector.js chord_detector_wrapper.cpp build/kiss_fft.o build/Chromagram.o build/ChordDetector.o
	emcc -O3 --memory-init-file 0 chord_detector_wrapper.cpp -o index.js -s EXPORTED_FUNCTIONS="['_Chromagram_constructor','_Chromagram_destructor','_Chromagram_processAudioFrame', '_Chromagram_isReady', '_Chromagram_getChromagram', '_ChordDetector_constructor', '_ChordDetector_destructor', '_ChordDetector_detectChord', '_ChordDetector_getRootNote', '_ChordDetector_getQuality', '_ChordDetector_getIntervals']" -D USE_KISS_FFT -I vendor/Chord-Detector-and-Chromagram/src -I vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130 build/*.o --post-js chord_detector.js

build/kiss_fft.o: Makefile vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130/kiss_fft.c
	emcc -O3 vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130/kiss_fft.c -o build/kiss_fft.o

build/Chromagram.o: Makefile vendor/Chord-Detector-and-Chromagram/src/Chromagram.cpp
	emcc -O3 -I vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130 -D USE_KISS_FFT vendor/Chord-Detector-and-Chromagram/src/Chromagram.cpp -o build/Chromagram.o

build/ChordDetector.o: Makefile vendor/Chord-Detector-and-Chromagram/src/ChordDetector.cpp
	emcc -O3 vendor/Chord-Detector-and-Chromagram/src/ChordDetector.cpp -o build/ChordDetector.o
