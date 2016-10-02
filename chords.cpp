#include <emscripten/bind.h>
#include "Chromagram.h"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(chords) {
  class_<Chromagram>("Chromagram")
    .constructor<int, int>()
    .function("processAudioFrame", select_overload<void(std::vector<double>)>(&Chromagram::processAudioFrame))
    .function("isReady", &Chromagram::isReady)
    .function("getChromagram", &Chromagram::getChromagram)
  ;
}

// EMSCRIPTEN_BINDINGS(my_class_example) {
//   class_<Chromagram>("MyClass")
//     .constructor<int, int>()
//     .function("processAudioFrame", select_overload<void(std::vector<double>)>(&Chromagram::processAudioFrame));
//     // .property("x", &MyClass::getX, &MyClass::setX)
//     // .class_function("getStringFromInstance", &MyClass::getStringFromInstance)
//     // ;
// }
