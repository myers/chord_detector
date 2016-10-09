chords.js: Makefile chord_detect_c.cpp vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130/kiss_fft.o vendor/Chord-Detector-and-Chromagram/src/Chromagram.o vendor/Chord-Detector-and-Chromagram/src/ChordDetector.o
	emcc -O3 chord_detect_c.cpp -o chords.js -s EXPORTED_FUNCTIONS="['_Chromagram_constructor','_Chromagram_destructor','_Chromagram_processAudioFrame', '_Chromagram_isReady', '_Chromagram_getChromagram']" -D USE_KISS_FFT -I vendor/Chord-Detector-and-Chromagram/src vendor/Chord-Detector-and-Chromagram/src/*.o -I vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130 vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130/*.o

vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130/kiss_fft.o: vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130/kiss_fft.c Makefile
	emcc -O3 vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130/kiss_fft.c -o vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130/kiss_fft.o


vendor/Chord-Detector-and-Chromagram/src/Chromagram.o: vendor/Chord-Detector-and-Chromagram/src/Chromagram.cpp Makefile
	emcc -O3 -I vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130 -D USE_KISS_FFT vendor/Chord-Detector-and-Chromagram/src/Chromagram.cpp -o vendor/Chord-Detector-and-Chromagram/src/Chromagram.o

vendor/Chord-Detector-and-Chromagram/src/ChordDetector.o: vendor/Chord-Detector-and-Chromagram/src/ChordDetector.cpp Makefile
	emcc -O3 vendor/Chord-Detector-and-Chromagram/src/ChordDetector.cpp -o vendor/Chord-Detector-and-Chromagram/src/ChordDetector.o

server:
	python -m SimpleHTTPServer 8000
