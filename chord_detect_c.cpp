#include <Chromagram.h>
#include <ChordDetector.h>
#include <emscripten.h>
#include <stdio.h>

using namespace std;

extern "C" {
    void *Chromagram_constructor(int frameSize, int samplingFrequency) {
        Chromagram *c = new Chromagram(frameSize, samplingFrequency);
        return c;
    }

    void Chromagram_destructor(Chromagram *c) {
        delete c;
    }

    void Chromagram_processAudioFrame(Chromagram *c, double* frames) {
        c->processAudioFrame(frames);
    }

    int Chromagram_isReady(Chromagram *c) {
        if (c->isReady()) {
            return 1;
        } else {
            return 0;
        };
    }

    void Chromagram_getChromagram(Chromagram *c, double* chromaDest) {
        std::vector<double> chroma = c->getChromagram();
        for(int ii = 0; ii < 12; ii++) {
            chromaDest[ii] = chroma[ii];
        }
    }


    void *ChordDetector_constructor() {
        ChordDetector *c = new ChordDetector();
        return c;
    }

    void ChordDetector_destructor(ChordDetector *c) {
        delete c;
    }

    void ChordDetector_detectChord(ChordDetector *c, double *chroma) {
        c->detectChord(chroma);
    }

    int ChordDetector_getRootNote(ChordDetector *c) {
        return c->rootNote;
    }

    int ChordDetector_getQuality(ChordDetector *c) {
        return c->quality;
    }

    int ChordDetector_getIntervals(ChordDetector *c) {
        return c->intervals;
    }
}
