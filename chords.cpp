#include <emscripten/bind.h>
#include "Chromagram.h"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(chords) {
  register_vector<double>("VectorDouble");

  class_<Chromagram>("Chromagram")
    .constructor<int, int>()
    .function("processAudioFrame", select_overload<void(std::vector<double>)>(&Chromagram::processAudioFrame))
    .function("isReady", &Chromagram::isReady)
    .function("getChromagram", &Chromagram::getChromagram)
  ;
}
