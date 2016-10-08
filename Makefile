chords.js: chords.cpp vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130/kiss_fft.o vendor/Chord-Detector-and-Chromagram/src/Chromagram.o
	emcc --bind chords.cpp -D USE_KISS_FFT -I vendor/Chord-Detector-and-Chromagram/src vendor/Chord-Detector-and-Chromagram/src/*.o -I vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130 vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130/*.o -o chords.js

vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130/kiss_fft.o: vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130/kiss_fft.c
	emcc vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130/kiss_fft.c -o vendor/Chord-Detector-and-Chromagram/libs/kiss_fft130/kiss_fft.o


vendor/Chord-Detector-and-Chromagram/src/Chromagram.o: vendor/Chord-Detector-and-Chromagram/src/Chromagram.cpp
	emcc vendor/Chord-Detector-and-Chromagram/src/Chromagram.cpp -o vendor/Chord-Detector-and-Chromagram/src/Chromagram.o


