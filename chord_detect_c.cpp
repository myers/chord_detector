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
}