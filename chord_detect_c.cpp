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

    void Chromagram_getChromagram(Chromagram *c) {
        std::vector<double> chroma = c->getChromagram();
        printf("chromagram %f %f %f %f %f %f %f %f %f %f %f %f\n", chroma[0], chroma[1], chroma[2], chroma[3], chroma[4], chroma[5], chroma[6], chroma[7], chroma[8], chroma[9], chroma[10], chroma[11]);
    }
}