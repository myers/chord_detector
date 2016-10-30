(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var currentChroma = new Float32Array(12)

var webworkify = require('webworkify');
var chromagramWorker = webworkify(require('./worker.js'))

$(function() {
  const audioCtx = new AudioContext();

  var output = $('#chord-detection')

  $('audio').on('play', function(event) {
    // pause and reset other elements
    $('audio').each((idx, el) => {
      if (el == this) return
      el.pause()
      el.currentTime = 0
    })

    source = audioCtx.createMediaElementSource(this)
    $(this).on('ended', () => {
      currentChroma.fill(0)
      source.disconnect()
      this.currentTime = 0
    })
    source.connect(scriptNode)
    source.connect(audioCtx.destination)
  })


  $('#chroma-visualizer').html('<canvas width="800" height="256">');
  visualizationCtx = $('#chroma-visualizer canvas').get(0).getContext('2d');
  const gradient = visualizationCtx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(1, '#000000');
  gradient.addColorStop(0.75, '#2ecc71');
  gradient.addColorStop(0.25, '#f1c40f');
  gradient.addColorStop(0, '#e74c3c');
  visualizationCtx.font="20px Georgia";
  notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
  function updateVisualization() {
    requestAnimationFrame(updateVisualization);

    visualizationCtx.clearRect(0, 0, 480, 250);

    for (let i = 0; i < currentChroma.length; i++) {
      const value = currentChroma[i];
      visualizationCtx.fillStyle = gradient;
      // the max value we've seen in a chroma is >50
      visualizationCtx.fillRect(i * 40, 250, 39, value * -5);

      visualizationCtx.fillStyle = 'black';
      visualizationCtx.fillText(notes[i], (i * 40)+3, 250);
    }
  }
  updateVisualization()

  chromagramWorker.addEventListener('message', function (ev) {
    currentChroma = ev.data.currentChroma
    output.html("Is it " + ev.data.rootNote + " " + ev.data.quality + " " + ev.data.intervals + "?")
  })
  const scriptNode = audioCtx.createScriptProcessor(1024, 1, 1)
  scriptNode.onaudioprocess = function(event) {
    console.log('onaudioprocess')
    var audioData = event.inputBuffer.getChannelData(0)
    chromagramWorker.postMessage({audioData: audioData, sentAt: performance.now()})
  }
  scriptNode.connect(audioCtx.destination)
})

},{"./worker.js":2,"webworkify":7}],2:[function(require,module,exports){
const cd = require("../index.js")

const chromagram = new cd.Chromagram(1024, 44100)
const chordDetector = new cd.ChordDetector()

module.exports = function (self) {
  self.firstSampleArrivedAt = null;
  self.addEventListener('message', function (ev) {
    if (!ev.data.hasOwnProperty('audioData')) {
      console.log("expected audioData")
    }
    chromagram.processAudioFrame(ev.data.audioData)

    if (self.firstSampleArrivedAt == null) {
      self.firstSampleArrivedAt = ev.data.sentAt
    }

    if (!chromagram.isReady()) return

    currentChroma = chromagram.getChromagram()
    chordDetector.detectChord(currentChroma)
    self.postMessage({
      receivedAt: self.firstSampleArrivedAt,
      currentChroma: currentChroma,
      rootNote: chordDetector.rootNote(),
      quality: chordDetector.quality(),
      intervals: chordDetector.intervals()
    })
    self.firstSampleArrivedAt = null
  })
}
},{"../index.js":3}],3:[function(require,module,exports){
(function (process){
var Module;if(!Module)Module=(typeof Module!=="undefined"?Module:null)||{};var moduleOverrides={};for(var key in Module){if(Module.hasOwnProperty(key)){moduleOverrides[key]=Module[key]}}var ENVIRONMENT_IS_WEB=false;var ENVIRONMENT_IS_WORKER=false;var ENVIRONMENT_IS_NODE=false;var ENVIRONMENT_IS_SHELL=false;if(Module["ENVIRONMENT"]){if(Module["ENVIRONMENT"]==="WEB"){ENVIRONMENT_IS_WEB=true}else if(Module["ENVIRONMENT"]==="WORKER"){ENVIRONMENT_IS_WORKER=true}else if(Module["ENVIRONMENT"]==="NODE"){ENVIRONMENT_IS_NODE=true}else if(Module["ENVIRONMENT"]==="SHELL"){ENVIRONMENT_IS_SHELL=true}else{throw new Error("The provided Module['ENVIRONMENT'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.")}}else{ENVIRONMENT_IS_WEB=typeof window==="object";ENVIRONMENT_IS_WORKER=typeof importScripts==="function";ENVIRONMENT_IS_NODE=typeof process==="object"&&typeof require==="function"&&!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_WORKER;ENVIRONMENT_IS_SHELL=!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_NODE&&!ENVIRONMENT_IS_WORKER}if(ENVIRONMENT_IS_NODE){if(!Module["print"])Module["print"]=console.log;if(!Module["printErr"])Module["printErr"]=console.warn;var nodeFS;var nodePath;Module["read"]=function read(filename,binary){if(!nodeFS)nodeFS=require("fs");if(!nodePath)nodePath=require("path");filename=nodePath["normalize"](filename);var ret=nodeFS["readFileSync"](filename);return binary?ret:ret.toString()};Module["readBinary"]=function readBinary(filename){var ret=Module["read"](filename,true);if(!ret.buffer){ret=new Uint8Array(ret)}assert(ret.buffer);return ret};Module["load"]=function load(f){globalEval(read(f))};if(!Module["thisProgram"]){if(process["argv"].length>1){Module["thisProgram"]=process["argv"][1].replace(/\\/g,"/")}else{Module["thisProgram"]="unknown-program"}}Module["arguments"]=process["argv"].slice(2);if(typeof module!=="undefined"){module["exports"]=Module}process["on"]("uncaughtException",(function(ex){if(!(ex instanceof ExitStatus)){throw ex}}));Module["inspect"]=(function(){return"[Emscripten Module object]"})}else if(ENVIRONMENT_IS_SHELL){if(!Module["print"])Module["print"]=print;if(typeof printErr!="undefined")Module["printErr"]=printErr;if(typeof read!="undefined"){Module["read"]=read}else{Module["read"]=function read(){throw"no read() available (jsc?)"}}Module["readBinary"]=function readBinary(f){if(typeof readbuffer==="function"){return new Uint8Array(readbuffer(f))}var data=read(f,"binary");assert(typeof data==="object");return data};if(typeof scriptArgs!="undefined"){Module["arguments"]=scriptArgs}else if(typeof arguments!="undefined"){Module["arguments"]=arguments}}else if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){Module["read"]=function read(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText};Module["readAsync"]=function readAsync(url,onload,onerror){var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=function xhr_onload(){if(xhr.status==200||xhr.status==0&&xhr.response){onload(xhr.response)}else{onerror()}};xhr.onerror=onerror;xhr.send(null)};if(typeof arguments!="undefined"){Module["arguments"]=arguments}if(typeof console!=="undefined"){if(!Module["print"])Module["print"]=function print(x){console.log(x)};if(!Module["printErr"])Module["printErr"]=function printErr(x){console.warn(x)}}else{var TRY_USE_DUMP=false;if(!Module["print"])Module["print"]=TRY_USE_DUMP&&typeof dump!=="undefined"?(function(x){dump(x)}):(function(x){})}if(ENVIRONMENT_IS_WORKER){Module["load"]=importScripts}if(typeof Module["setWindowTitle"]==="undefined"){Module["setWindowTitle"]=(function(title){document.title=title})}}else{throw"Unknown runtime environment. Where are we?"}function globalEval(x){eval.call(null,x)}if(!Module["load"]&&Module["read"]){Module["load"]=function load(f){globalEval(Module["read"](f))}}if(!Module["print"]){Module["print"]=(function(){})}if(!Module["printErr"]){Module["printErr"]=Module["print"]}if(!Module["arguments"]){Module["arguments"]=[]}if(!Module["thisProgram"]){Module["thisProgram"]="./this.program"}Module.print=Module["print"];Module.printErr=Module["printErr"];Module["preRun"]=[];Module["postRun"]=[];for(var key in moduleOverrides){if(moduleOverrides.hasOwnProperty(key)){Module[key]=moduleOverrides[key]}}moduleOverrides=undefined;var Runtime={setTempRet0:(function(value){tempRet0=value}),getTempRet0:(function(){return tempRet0}),stackSave:(function(){return STACKTOP}),stackRestore:(function(stackTop){STACKTOP=stackTop}),getNativeTypeSize:(function(type){switch(type){case"i1":case"i8":return 1;case"i16":return 2;case"i32":return 4;case"i64":return 8;case"float":return 4;case"double":return 8;default:{if(type[type.length-1]==="*"){return Runtime.QUANTUM_SIZE}else if(type[0]==="i"){var bits=parseInt(type.substr(1));assert(bits%8===0);return bits/8}else{return 0}}}}),getNativeFieldSize:(function(type){return Math.max(Runtime.getNativeTypeSize(type),Runtime.QUANTUM_SIZE)}),STACK_ALIGN:16,prepVararg:(function(ptr,type){if(type==="double"||type==="i64"){if(ptr&7){assert((ptr&7)===4);ptr+=4}}else{assert((ptr&3)===0)}return ptr}),getAlignSize:(function(type,size,vararg){if(!vararg&&(type=="i64"||type=="double"))return 8;if(!type)return Math.min(size,8);return Math.min(size||(type?Runtime.getNativeFieldSize(type):0),Runtime.QUANTUM_SIZE)}),dynCall:(function(sig,ptr,args){if(args&&args.length){return Module["dynCall_"+sig].apply(null,[ptr].concat(args))}else{return Module["dynCall_"+sig].call(null,ptr)}}),functionPointers:[],addFunction:(function(func){for(var i=0;i<Runtime.functionPointers.length;i++){if(!Runtime.functionPointers[i]){Runtime.functionPointers[i]=func;return 2*(1+i)}}throw"Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS."}),removeFunction:(function(index){Runtime.functionPointers[(index-2)/2]=null}),warnOnce:(function(text){if(!Runtime.warnOnce.shown)Runtime.warnOnce.shown={};if(!Runtime.warnOnce.shown[text]){Runtime.warnOnce.shown[text]=1;Module.printErr(text)}}),funcWrappers:{},getFuncWrapper:(function(func,sig){assert(sig);if(!Runtime.funcWrappers[sig]){Runtime.funcWrappers[sig]={}}var sigCache=Runtime.funcWrappers[sig];if(!sigCache[func]){if(sig.length===1){sigCache[func]=function dynCall_wrapper(){return Runtime.dynCall(sig,func)}}else if(sig.length===2){sigCache[func]=function dynCall_wrapper(arg){return Runtime.dynCall(sig,func,[arg])}}else{sigCache[func]=function dynCall_wrapper(){return Runtime.dynCall(sig,func,Array.prototype.slice.call(arguments))}}}return sigCache[func]}),getCompilerSetting:(function(name){throw"You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work"}),stackAlloc:(function(size){var ret=STACKTOP;STACKTOP=STACKTOP+size|0;STACKTOP=STACKTOP+15&-16;return ret}),staticAlloc:(function(size){var ret=STATICTOP;STATICTOP=STATICTOP+size|0;STATICTOP=STATICTOP+15&-16;return ret}),dynamicAlloc:(function(size){var ret=DYNAMICTOP;DYNAMICTOP=DYNAMICTOP+size|0;DYNAMICTOP=DYNAMICTOP+15&-16;if(DYNAMICTOP>=TOTAL_MEMORY){var success=enlargeMemory();if(!success){DYNAMICTOP=ret;return 0}}return ret}),alignMemory:(function(size,quantum){var ret=size=Math.ceil(size/(quantum?quantum:16))*(quantum?quantum:16);return ret}),makeBigInt:(function(low,high,unsigned){var ret=unsigned?+(low>>>0)+ +(high>>>0)*+4294967296:+(low>>>0)+ +(high|0)*+4294967296;return ret}),GLOBAL_BASE:8,QUANTUM_SIZE:4,__dummy__:0};Module["Runtime"]=Runtime;var ABORT=false;var EXITSTATUS=0;function assert(condition,text){if(!condition){abort("Assertion failed: "+text)}}function getCFunc(ident){var func=Module["_"+ident];if(!func){try{func=eval("_"+ident)}catch(e){}}assert(func,"Cannot call unknown function "+ident+" (perhaps LLVM optimizations or closure removed it?)");return func}var cwrap,ccall;((function(){var JSfuncs={"stackSave":(function(){Runtime.stackSave()}),"stackRestore":(function(){Runtime.stackRestore()}),"arrayToC":(function(arr){var ret=Runtime.stackAlloc(arr.length);writeArrayToMemory(arr,ret);return ret}),"stringToC":(function(str){var ret=0;if(str!==null&&str!==undefined&&str!==0){ret=Runtime.stackAlloc((str.length<<2)+1);writeStringToMemory(str,ret)}return ret})};var toC={"string":JSfuncs["stringToC"],"array":JSfuncs["arrayToC"]};ccall=function ccallFunc(ident,returnType,argTypes,args,opts){var func=getCFunc(ident);var cArgs=[];var stack=0;if(args){for(var i=0;i<args.length;i++){var converter=toC[argTypes[i]];if(converter){if(stack===0)stack=Runtime.stackSave();cArgs[i]=converter(args[i])}else{cArgs[i]=args[i]}}}var ret=func.apply(null,cArgs);if(returnType==="string")ret=Pointer_stringify(ret);if(stack!==0){if(opts&&opts.async){EmterpreterAsync.asyncFinalizers.push((function(){Runtime.stackRestore(stack)}));return}Runtime.stackRestore(stack)}return ret};var sourceRegex=/^function\s*[a-zA-Z$_0-9]*\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;function parseJSFunc(jsfunc){var parsed=jsfunc.toString().match(sourceRegex).slice(1);return{arguments:parsed[0],body:parsed[1],returnValue:parsed[2]}}var JSsource=null;function ensureJSsource(){if(!JSsource){JSsource={};for(var fun in JSfuncs){if(JSfuncs.hasOwnProperty(fun)){JSsource[fun]=parseJSFunc(JSfuncs[fun])}}}}cwrap=function cwrap(ident,returnType,argTypes){argTypes=argTypes||[];var cfunc=getCFunc(ident);var numericArgs=argTypes.every((function(type){return type==="number"}));var numericRet=returnType!=="string";if(numericRet&&numericArgs){return cfunc}var argNames=argTypes.map((function(x,i){return"$"+i}));var funcstr="(function("+argNames.join(",")+") {";var nargs=argTypes.length;if(!numericArgs){ensureJSsource();funcstr+="var stack = "+JSsource["stackSave"].body+";";for(var i=0;i<nargs;i++){var arg=argNames[i],type=argTypes[i];if(type==="number")continue;var convertCode=JSsource[type+"ToC"];funcstr+="var "+convertCode.arguments+" = "+arg+";";funcstr+=convertCode.body+";";funcstr+=arg+"=("+convertCode.returnValue+");"}}var cfuncname=parseJSFunc((function(){return cfunc})).returnValue;funcstr+="var ret = "+cfuncname+"("+argNames.join(",")+");";if(!numericRet){var strgfy=parseJSFunc((function(){return Pointer_stringify})).returnValue;funcstr+="ret = "+strgfy+"(ret);"}if(!numericArgs){ensureJSsource();funcstr+=JSsource["stackRestore"].body.replace("()","(stack)")+";"}funcstr+="return ret})";return eval(funcstr)}}))();Module["ccall"]=ccall;Module["cwrap"]=cwrap;function setValue(ptr,value,type,noSafe){type=type||"i8";if(type.charAt(type.length-1)==="*")type="i32";switch(type){case"i1":HEAP8[ptr>>0]=value;break;case"i8":HEAP8[ptr>>0]=value;break;case"i16":HEAP16[ptr>>1]=value;break;case"i32":HEAP32[ptr>>2]=value;break;case"i64":tempI64=[value>>>0,(tempDouble=value,+Math_abs(tempDouble)>=+1?tempDouble>+0?(Math_min(+Math_floor(tempDouble/+4294967296),+4294967295)|0)>>>0:~~+Math_ceil((tempDouble- +(~~tempDouble>>>0))/+4294967296)>>>0:0)],HEAP32[ptr>>2]=tempI64[0],HEAP32[ptr+4>>2]=tempI64[1];break;case"float":HEAPF32[ptr>>2]=value;break;case"double":HEAPF64[ptr>>3]=value;break;default:abort("invalid type for setValue: "+type)}}Module["setValue"]=setValue;function getValue(ptr,type,noSafe){type=type||"i8";if(type.charAt(type.length-1)==="*")type="i32";switch(type){case"i1":return HEAP8[ptr>>0];case"i8":return HEAP8[ptr>>0];case"i16":return HEAP16[ptr>>1];case"i32":return HEAP32[ptr>>2];case"i64":return HEAP32[ptr>>2];case"float":return HEAPF32[ptr>>2];case"double":return HEAPF64[ptr>>3];default:abort("invalid type for setValue: "+type)}return null}Module["getValue"]=getValue;var ALLOC_NORMAL=0;var ALLOC_STACK=1;var ALLOC_STATIC=2;var ALLOC_DYNAMIC=3;var ALLOC_NONE=4;Module["ALLOC_NORMAL"]=ALLOC_NORMAL;Module["ALLOC_STACK"]=ALLOC_STACK;Module["ALLOC_STATIC"]=ALLOC_STATIC;Module["ALLOC_DYNAMIC"]=ALLOC_DYNAMIC;Module["ALLOC_NONE"]=ALLOC_NONE;function allocate(slab,types,allocator,ptr){var zeroinit,size;if(typeof slab==="number"){zeroinit=true;size=slab}else{zeroinit=false;size=slab.length}var singleType=typeof types==="string"?types:null;var ret;if(allocator==ALLOC_NONE){ret=ptr}else{ret=[typeof _malloc==="function"?_malloc:Runtime.staticAlloc,Runtime.stackAlloc,Runtime.staticAlloc,Runtime.dynamicAlloc][allocator===undefined?ALLOC_STATIC:allocator](Math.max(size,singleType?1:types.length))}if(zeroinit){var ptr=ret,stop;assert((ret&3)==0);stop=ret+(size&~3);for(;ptr<stop;ptr+=4){HEAP32[ptr>>2]=0}stop=ret+size;while(ptr<stop){HEAP8[ptr++>>0]=0}return ret}if(singleType==="i8"){if(slab.subarray||slab.slice){HEAPU8.set(slab,ret)}else{HEAPU8.set(new Uint8Array(slab),ret)}return ret}var i=0,type,typeSize,previousType;while(i<size){var curr=slab[i];if(typeof curr==="function"){curr=Runtime.getFunctionIndex(curr)}type=singleType||types[i];if(type===0){i++;continue}if(type=="i64")type="i32";setValue(ret+i,curr,type);if(previousType!==type){typeSize=Runtime.getNativeTypeSize(type);previousType=type}i+=typeSize}return ret}Module["allocate"]=allocate;function getMemory(size){if(!staticSealed)return Runtime.staticAlloc(size);if(typeof _sbrk!=="undefined"&&!_sbrk.called||!runtimeInitialized)return Runtime.dynamicAlloc(size);return _malloc(size)}Module["getMemory"]=getMemory;function Pointer_stringify(ptr,length){if(length===0||!ptr)return"";var hasUtf=0;var t;var i=0;while(1){t=HEAPU8[ptr+i>>0];hasUtf|=t;if(t==0&&!length)break;i++;if(length&&i==length)break}if(!length)length=i;var ret="";if(hasUtf<128){var MAX_CHUNK=1024;var curr;while(length>0){curr=String.fromCharCode.apply(String,HEAPU8.subarray(ptr,ptr+Math.min(length,MAX_CHUNK)));ret=ret?ret+curr:curr;ptr+=MAX_CHUNK;length-=MAX_CHUNK}return ret}return Module["UTF8ToString"](ptr)}Module["Pointer_stringify"]=Pointer_stringify;function AsciiToString(ptr){var str="";while(1){var ch=HEAP8[ptr++>>0];if(!ch)return str;str+=String.fromCharCode(ch)}}Module["AsciiToString"]=AsciiToString;function stringToAscii(str,outPtr){return writeAsciiToMemory(str,outPtr,false)}Module["stringToAscii"]=stringToAscii;function UTF8ArrayToString(u8Array,idx){var u0,u1,u2,u3,u4,u5;var str="";while(1){u0=u8Array[idx++];if(!u0)return str;if(!(u0&128)){str+=String.fromCharCode(u0);continue}u1=u8Array[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}u2=u8Array[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2}else{u3=u8Array[idx++]&63;if((u0&248)==240){u0=(u0&7)<<18|u1<<12|u2<<6|u3}else{u4=u8Array[idx++]&63;if((u0&252)==248){u0=(u0&3)<<24|u1<<18|u2<<12|u3<<6|u4}else{u5=u8Array[idx++]&63;u0=(u0&1)<<30|u1<<24|u2<<18|u3<<12|u4<<6|u5}}}if(u0<65536){str+=String.fromCharCode(u0)}else{var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}}}Module["UTF8ArrayToString"]=UTF8ArrayToString;function UTF8ToString(ptr){return UTF8ArrayToString(HEAPU8,ptr)}Module["UTF8ToString"]=UTF8ToString;function stringToUTF8Array(str,outU8Array,outIdx,maxBytesToWrite){if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343)u=65536+((u&1023)<<10)|str.charCodeAt(++i)&1023;if(u<=127){if(outIdx>=endIdx)break;outU8Array[outIdx++]=u}else if(u<=2047){if(outIdx+1>=endIdx)break;outU8Array[outIdx++]=192|u>>6;outU8Array[outIdx++]=128|u&63}else if(u<=65535){if(outIdx+2>=endIdx)break;outU8Array[outIdx++]=224|u>>12;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63}else if(u<=2097151){if(outIdx+3>=endIdx)break;outU8Array[outIdx++]=240|u>>18;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63}else if(u<=67108863){if(outIdx+4>=endIdx)break;outU8Array[outIdx++]=248|u>>24;outU8Array[outIdx++]=128|u>>18&63;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63}else{if(outIdx+5>=endIdx)break;outU8Array[outIdx++]=252|u>>30;outU8Array[outIdx++]=128|u>>24&63;outU8Array[outIdx++]=128|u>>18&63;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63}}outU8Array[outIdx]=0;return outIdx-startIdx}Module["stringToUTF8Array"]=stringToUTF8Array;function stringToUTF8(str,outPtr,maxBytesToWrite){return stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite)}Module["stringToUTF8"]=stringToUTF8;function lengthBytesUTF8(str){var len=0;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343)u=65536+((u&1023)<<10)|str.charCodeAt(++i)&1023;if(u<=127){++len}else if(u<=2047){len+=2}else if(u<=65535){len+=3}else if(u<=2097151){len+=4}else if(u<=67108863){len+=5}else{len+=6}}return len}Module["lengthBytesUTF8"]=lengthBytesUTF8;function demangle(func){var hasLibcxxabi=!!Module["___cxa_demangle"];if(hasLibcxxabi){try{var buf=_malloc(func.length);writeStringToMemory(func.substr(1),buf);var status=_malloc(4);var ret=Module["___cxa_demangle"](buf,0,0,status);if(getValue(status,"i32")===0&&ret){return Pointer_stringify(ret)}}catch(e){}finally{if(buf)_free(buf);if(status)_free(status);if(ret)_free(ret)}return func}Runtime.warnOnce("warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");return func}function demangleAll(text){return text.replace(/__Z[\w\d_]+/g,(function(x){var y=demangle(x);return x===y?x:x+" ["+y+"]"}))}function jsStackTrace(){var err=new Error;if(!err.stack){try{throw new Error(0)}catch(e){err=e}if(!err.stack){return"(no stack trace available)"}}return err.stack.toString()}function stackTrace(){var js=jsStackTrace();if(Module["extraStackTrace"])js+="\n"+Module["extraStackTrace"]();return demangleAll(js)}Module["stackTrace"]=stackTrace;function alignMemoryPage(x){if(x%4096>0){x+=4096-x%4096}return x}var HEAP;var buffer;var HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;function updateGlobalBufferViews(){Module["HEAP8"]=HEAP8=new Int8Array(buffer);Module["HEAP16"]=HEAP16=new Int16Array(buffer);Module["HEAP32"]=HEAP32=new Int32Array(buffer);Module["HEAPU8"]=HEAPU8=new Uint8Array(buffer);Module["HEAPU16"]=HEAPU16=new Uint16Array(buffer);Module["HEAPU32"]=HEAPU32=new Uint32Array(buffer);Module["HEAPF32"]=HEAPF32=new Float32Array(buffer);Module["HEAPF64"]=HEAPF64=new Float64Array(buffer)}var STATIC_BASE=0,STATICTOP=0,staticSealed=false;var STACK_BASE=0,STACKTOP=0,STACK_MAX=0;var DYNAMIC_BASE=0,DYNAMICTOP=0;function abortOnCannotGrowMemory(){abort("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value "+TOTAL_MEMORY+", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which adjusts the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ")}function enlargeMemory(){abortOnCannotGrowMemory()}var TOTAL_STACK=Module["TOTAL_STACK"]||5242880;var TOTAL_MEMORY=Module["TOTAL_MEMORY"]||16777216;var totalMemory=64*1024;while(totalMemory<TOTAL_MEMORY||totalMemory<2*TOTAL_STACK){if(totalMemory<16*1024*1024){totalMemory*=2}else{totalMemory+=16*1024*1024}}if(totalMemory!==TOTAL_MEMORY){TOTAL_MEMORY=totalMemory}if(Module["buffer"]){buffer=Module["buffer"]}else{buffer=new ArrayBuffer(TOTAL_MEMORY)}updateGlobalBufferViews();HEAP32[0]=255;if(HEAPU8[0]!==255||HEAPU8[3]!==0)throw"Typed arrays 2 must be run on a little-endian system";Module["HEAP"]=HEAP;Module["buffer"]=buffer;Module["HEAP8"]=HEAP8;Module["HEAP16"]=HEAP16;Module["HEAP32"]=HEAP32;Module["HEAPU8"]=HEAPU8;Module["HEAPU16"]=HEAPU16;Module["HEAPU32"]=HEAPU32;Module["HEAPF32"]=HEAPF32;Module["HEAPF64"]=HEAPF64;function callRuntimeCallbacks(callbacks){while(callbacks.length>0){var callback=callbacks.shift();if(typeof callback=="function"){callback();continue}var func=callback.func;if(typeof func==="number"){if(callback.arg===undefined){Runtime.dynCall("v",func)}else{Runtime.dynCall("vi",func,[callback.arg])}}else{func(callback.arg===undefined?null:callback.arg)}}}var __ATPRERUN__=[];var __ATINIT__=[];var __ATMAIN__=[];var __ATEXIT__=[];var __ATPOSTRUN__=[];var runtimeInitialized=false;var runtimeExited=false;function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift())}}callRuntimeCallbacks(__ATPRERUN__)}function ensureInitRuntime(){if(runtimeInitialized)return;runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__)}function preMain(){callRuntimeCallbacks(__ATMAIN__)}function exitRuntime(){callRuntimeCallbacks(__ATEXIT__);runtimeExited=true}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift())}}callRuntimeCallbacks(__ATPOSTRUN__)}function addOnPreRun(cb){__ATPRERUN__.unshift(cb)}Module["addOnPreRun"]=addOnPreRun;function addOnInit(cb){__ATINIT__.unshift(cb)}Module["addOnInit"]=addOnInit;function addOnPreMain(cb){__ATMAIN__.unshift(cb)}Module["addOnPreMain"]=addOnPreMain;function addOnExit(cb){__ATEXIT__.unshift(cb)}Module["addOnExit"]=addOnExit;function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb)}Module["addOnPostRun"]=addOnPostRun;function intArrayFromString(stringy,dontAddNull,length){var len=length>0?length:lengthBytesUTF8(stringy)+1;var u8array=new Array(len);var numBytesWritten=stringToUTF8Array(stringy,u8array,0,u8array.length);if(dontAddNull)u8array.length=numBytesWritten;return u8array}Module["intArrayFromString"]=intArrayFromString;function intArrayToString(array){var ret=[];for(var i=0;i<array.length;i++){var chr=array[i];if(chr>255){chr&=255}ret.push(String.fromCharCode(chr))}return ret.join("")}Module["intArrayToString"]=intArrayToString;function writeStringToMemory(string,buffer,dontAddNull){var array=intArrayFromString(string,dontAddNull);var i=0;while(i<array.length){var chr=array[i];HEAP8[buffer+i>>0]=chr;i=i+1}}Module["writeStringToMemory"]=writeStringToMemory;function writeArrayToMemory(array,buffer){for(var i=0;i<array.length;i++){HEAP8[buffer++>>0]=array[i]}}Module["writeArrayToMemory"]=writeArrayToMemory;function writeAsciiToMemory(str,buffer,dontAddNull){for(var i=0;i<str.length;++i){HEAP8[buffer++>>0]=str.charCodeAt(i)}if(!dontAddNull)HEAP8[buffer>>0]=0}Module["writeAsciiToMemory"]=writeAsciiToMemory;if(!Math["imul"]||Math["imul"](4294967295,5)!==-5)Math["imul"]=function imul(a,b){var ah=a>>>16;var al=a&65535;var bh=b>>>16;var bl=b&65535;return al*bl+(ah*bl+al*bh<<16)|0};Math.imul=Math["imul"];if(!Math["clz32"])Math["clz32"]=(function(x){x=x>>>0;for(var i=0;i<32;i++){if(x&1<<31-i)return i}return 32});Math.clz32=Math["clz32"];if(!Math["trunc"])Math["trunc"]=(function(x){return x<0?Math.ceil(x):Math.floor(x)});Math.trunc=Math["trunc"];var Math_abs=Math.abs;var Math_cos=Math.cos;var Math_sin=Math.sin;var Math_tan=Math.tan;var Math_acos=Math.acos;var Math_asin=Math.asin;var Math_atan=Math.atan;var Math_atan2=Math.atan2;var Math_exp=Math.exp;var Math_log=Math.log;var Math_sqrt=Math.sqrt;var Math_ceil=Math.ceil;var Math_floor=Math.floor;var Math_pow=Math.pow;var Math_imul=Math.imul;var Math_fround=Math.fround;var Math_min=Math.min;var Math_clz32=Math.clz32;var Math_trunc=Math.trunc;var runDependencies=0;var runDependencyWatcher=null;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}}Module["addRunDependency"]=addRunDependency;function removeRunDependency(id){runDependencies--;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}if(runDependencies==0){if(runDependencyWatcher!==null){clearInterval(runDependencyWatcher);runDependencyWatcher=null}if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback()}}}Module["removeRunDependency"]=removeRunDependency;Module["preloadedImages"]={};Module["preloadedAudios"]={};var ASM_CONSTS=[];STATIC_BASE=8;STATICTOP=STATIC_BASE+2176;__ATINIT__.push();allocate([212,0,0,0,26,2,0,0,252,0,0,0,248,1,0,0,48,0,0,0,0,0,0,0,252,0,0,0,165,1,0,0,16,0,0,0,0,0,0,0,252,0,0,0,202,1,0,0,64,0,0,0,0,0,0,0,212,0,0,0,235,1,0,0,252,0,0,0,39,2,0,0,8,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,116,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,0,0,0,0,0,0,0,16,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,3,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,32,0,0,0,1,0,0,0,5,0,0,0,3,0,0,0,4,0,0,0,3,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,72,0,0,0,6,0,0,0,7,0,0,0,2,0,0,0,33,34,118,101,99,116,111,114,32,108,101,110,103,116,104,95,101,114,114,111,114,34,0,47,117,115,114,47,108,111,99,97,108,47,67,101,108,108,97,114,47,101,109,115,99,114,105,112,116,101,110,47,49,46,51,54,46,53,47,108,105,98,101,120,101,99,47,115,121,115,116,101,109,47,105,110,99,108,117,100,101,47,108,105,98,99,120,120,47,118,101,99,116,111,114,0,95,95,116,104,114,111,119,95,108,101,110,103,116,104,95,101,114,114,111,114,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,83,116,57,116,121,112,101,95,105,110,102,111,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,83,116,57,101,120,99,101,112,116,105,111,110,0,83,116,57,98,97,100,95,97,108,108,111,99,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0],"i8",ALLOC_NONE,Runtime.GLOBAL_BASE);var tempDoublePtr=STATICTOP;STATICTOP+=16;function ___assert_fail(condition,filename,line,func){ABORT=true;throw"Assertion failed: "+Pointer_stringify(condition)+", at: "+[filename?Pointer_stringify(filename):"unknown filename",line,func?Pointer_stringify(func):"unknown function"]+" at "+stackTrace()}function __ZSt18uncaught_exceptionv(){return!!__ZSt18uncaught_exceptionv.uncaught_exception}var EXCEPTIONS={last:0,caught:[],infos:{},deAdjust:(function(adjusted){if(!adjusted||EXCEPTIONS.infos[adjusted])return adjusted;for(var ptr in EXCEPTIONS.infos){var info=EXCEPTIONS.infos[ptr];if(info.adjusted===adjusted){return ptr}}return adjusted}),addRef:(function(ptr){if(!ptr)return;var info=EXCEPTIONS.infos[ptr];info.refcount++}),decRef:(function(ptr){if(!ptr)return;var info=EXCEPTIONS.infos[ptr];assert(info.refcount>0);info.refcount--;if(info.refcount===0){if(info.destructor){Runtime.dynCall("vi",info.destructor,[ptr])}delete EXCEPTIONS.infos[ptr];___cxa_free_exception(ptr)}}),clearRef:(function(ptr){if(!ptr)return;var info=EXCEPTIONS.infos[ptr];info.refcount=0})};function ___resumeException(ptr){if(!EXCEPTIONS.last){EXCEPTIONS.last=ptr}EXCEPTIONS.clearRef(EXCEPTIONS.deAdjust(ptr));throw ptr+" - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch."}function ___cxa_find_matching_catch(){var thrown=EXCEPTIONS.last;if(!thrown){return(asm["setTempRet0"](0),0)|0}var info=EXCEPTIONS.infos[thrown];var throwntype=info.type;if(!throwntype){return(asm["setTempRet0"](0),thrown)|0}var typeArray=Array.prototype.slice.call(arguments);var pointer=Module["___cxa_is_pointer_type"](throwntype);if(!___cxa_find_matching_catch.buffer)___cxa_find_matching_catch.buffer=_malloc(4);HEAP32[___cxa_find_matching_catch.buffer>>2]=thrown;thrown=___cxa_find_matching_catch.buffer;for(var i=0;i<typeArray.length;i++){if(typeArray[i]&&Module["___cxa_can_catch"](typeArray[i],throwntype,thrown)){thrown=HEAP32[thrown>>2];info.adjusted=thrown;return(asm["setTempRet0"](typeArray[i]),thrown)|0}}thrown=HEAP32[thrown>>2];return(asm["setTempRet0"](throwntype),thrown)|0}function ___cxa_throw(ptr,type,destructor){EXCEPTIONS.infos[ptr]={ptr:ptr,adjusted:ptr,type:type,destructor:destructor,refcount:0};EXCEPTIONS.last=ptr;if(!("uncaught_exception"in __ZSt18uncaught_exceptionv)){__ZSt18uncaught_exceptionv.uncaught_exception=1}else{__ZSt18uncaught_exceptionv.uncaught_exception++}throw ptr+" - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch."}Module["_memset"]=_memset;function _pthread_cleanup_push(routine,arg){__ATEXIT__.push((function(){Runtime.dynCall("vi",routine,[arg])}));_pthread_cleanup_push.level=__ATEXIT__.length}function _pthread_cleanup_pop(){assert(_pthread_cleanup_push.level==__ATEXIT__.length,"cannot pop if something else added meanwhile!");__ATEXIT__.pop();_pthread_cleanup_push.level=__ATEXIT__.length}function _abort(){Module["abort"]()}function ___lock(){}function ___unlock(){}var SYSCALLS={varargs:0,get:(function(varargs){SYSCALLS.varargs+=4;var ret=HEAP32[SYSCALLS.varargs-4>>2];return ret}),getStr:(function(){var ret=Pointer_stringify(SYSCALLS.get());return ret}),get64:(function(){var low=SYSCALLS.get(),high=SYSCALLS.get();if(low>=0)assert(high===0);else assert(high===-1);return low}),getZero:(function(){assert(SYSCALLS.get()===0)})};function ___syscall6(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD();FS.close(stream);return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return-e.errno}}function _sbrk(bytes){var self=_sbrk;if(!self.called){DYNAMICTOP=alignMemoryPage(DYNAMICTOP);self.called=true;assert(Runtime.dynamicAlloc);self.alloc=Runtime.dynamicAlloc;Runtime.dynamicAlloc=(function(){abort("cannot dynamically allocate, sbrk now has control")})}var ret=DYNAMICTOP;if(bytes!=0){var success=self.alloc(bytes);if(!success)return-1>>>0}return ret}function _emscripten_memcpy_big(dest,src,num){HEAPU8.set(HEAPU8.subarray(src,src+num),dest);return dest}Module["_memcpy"]=_memcpy;Module["_memmove"]=_memmove;function _malloc(bytes){var ptr=Runtime.dynamicAlloc(bytes+8);return ptr+8&4294967288}Module["_malloc"]=_malloc;function ___cxa_allocate_exception(size){return _malloc(size)}function ___gxx_personality_v0(){}Module["_pthread_self"]=_pthread_self;function ___syscall140(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(),offset_high=SYSCALLS.get(),offset_low=SYSCALLS.get(),result=SYSCALLS.get(),whence=SYSCALLS.get();var offset=offset_low;assert(offset_high===0);FS.llseek(stream,offset,whence);HEAP32[result>>2]=stream.position;if(stream.getdents&&offset===0&&whence===0)stream.getdents=null;return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return-e.errno}}function ___syscall146(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.get(),iov=SYSCALLS.get(),iovcnt=SYSCALLS.get();var ret=0;if(!___syscall146.buffer){___syscall146.buffers=[null,[],[]];___syscall146.printChar=(function(stream,curr){var buffer=___syscall146.buffers[stream];assert(buffer);if(curr===0||curr===10){(stream===1?Module["print"]:Module["printErr"])(UTF8ArrayToString(buffer,0));buffer.length=0}else{buffer.push(curr)}})}for(var i=0;i<iovcnt;i++){var ptr=HEAP32[iov+i*8>>2];var len=HEAP32[iov+(i*8+4)>>2];for(var j=0;j<len;j++){___syscall146.printChar(stream,HEAPU8[ptr+j])}ret+=len}return ret}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return-e.errno}}function ___syscall54(which,varargs){SYSCALLS.varargs=varargs;try{return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return-e.errno}}__ATEXIT__.push((function(){var fflush=Module["_fflush"];if(fflush)fflush(0);var printChar=___syscall146.printChar;if(!printChar)return;var buffers=___syscall146.buffers;if(buffers[1].length)printChar(1,10);if(buffers[2].length)printChar(2,10)}));STACK_BASE=STACKTOP=Runtime.alignMemory(STATICTOP);staticSealed=true;STACK_MAX=STACK_BASE+TOTAL_STACK;DYNAMIC_BASE=DYNAMICTOP=Runtime.alignMemory(STACK_MAX);function invoke_iiii(index,a1,a2,a3){try{return Module["dynCall_iiii"](index,a1,a2,a3)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;asm["setThrew"](1,0)}}function invoke_viiiii(index,a1,a2,a3,a4,a5){try{Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;asm["setThrew"](1,0)}}function invoke_vi(index,a1){try{Module["dynCall_vi"](index,a1)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;asm["setThrew"](1,0)}}function invoke_ii(index,a1){try{return Module["dynCall_ii"](index,a1)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;asm["setThrew"](1,0)}}function invoke_v(index){try{Module["dynCall_v"](index)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;asm["setThrew"](1,0)}}function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6){try{Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;asm["setThrew"](1,0)}}function invoke_viiii(index,a1,a2,a3,a4){try{Module["dynCall_viiii"](index,a1,a2,a3,a4)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;asm["setThrew"](1,0)}}Module.asmGlobalArg={"Math":Math,"Int8Array":Int8Array,"Int16Array":Int16Array,"Int32Array":Int32Array,"Uint8Array":Uint8Array,"Uint16Array":Uint16Array,"Uint32Array":Uint32Array,"Float32Array":Float32Array,"Float64Array":Float64Array,"NaN":NaN,"Infinity":Infinity};Module.asmLibraryArg={"abort":abort,"assert":assert,"invoke_iiii":invoke_iiii,"invoke_viiiii":invoke_viiiii,"invoke_vi":invoke_vi,"invoke_ii":invoke_ii,"invoke_v":invoke_v,"invoke_viiiiii":invoke_viiiiii,"invoke_viiii":invoke_viiii,"_pthread_cleanup_pop":_pthread_cleanup_pop,"___syscall54":___syscall54,"___cxa_throw":___cxa_throw,"___lock":___lock,"_abort":_abort,"_pthread_cleanup_push":_pthread_cleanup_push,"___syscall6":___syscall6,"_sbrk":_sbrk,"___syscall140":___syscall140,"___syscall146":___syscall146,"_emscripten_memcpy_big":_emscripten_memcpy_big,"___gxx_personality_v0":___gxx_personality_v0,"___unlock":___unlock,"___resumeException":___resumeException,"___cxa_find_matching_catch":___cxa_find_matching_catch,"___assert_fail":___assert_fail,"___cxa_allocate_exception":___cxa_allocate_exception,"__ZSt18uncaught_exceptionv":__ZSt18uncaught_exceptionv,"STACKTOP":STACKTOP,"STACK_MAX":STACK_MAX,"tempDoublePtr":tempDoublePtr,"ABORT":ABORT};// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer) {
"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=0;var n=0;var o=0;var p=0;var q=global.NaN,r=global.Infinity;var s=0,t=0,u=0,v=0,w=0.0,x=0,y=0,z=0,A=0.0;var B=0;var C=global.Math.floor;var D=global.Math.abs;var E=global.Math.sqrt;var F=global.Math.pow;var G=global.Math.cos;var H=global.Math.sin;var I=global.Math.tan;var J=global.Math.acos;var K=global.Math.asin;var L=global.Math.atan;var M=global.Math.atan2;var N=global.Math.exp;var O=global.Math.log;var P=global.Math.ceil;var Q=global.Math.imul;var R=global.Math.min;var S=global.Math.clz32;var T=env.abort;var U=env.assert;var V=env.invoke_iiii;var W=env.invoke_viiiii;var X=env.invoke_vi;var Y=env.invoke_ii;var Z=env.invoke_v;var _=env.invoke_viiiiii;var $=env.invoke_viiii;var aa=env._pthread_cleanup_pop;var ba=env.___syscall54;var ca=env.___cxa_throw;var da=env.___lock;var ea=env._abort;var fa=env._pthread_cleanup_push;var ga=env.___syscall6;var ha=env._sbrk;var ia=env.___syscall140;var ja=env.___syscall146;var ka=env._emscripten_memcpy_big;var la=env.___gxx_personality_v0;var ma=env.___unlock;var na=env.___resumeException;var oa=env.___cxa_find_matching_catch;var pa=env.___assert_fail;var qa=env.___cxa_allocate_exception;var ra=env.__ZSt18uncaught_exceptionv;var sa=0.0;
// EMSCRIPTEN_START_FUNCS
function Aa(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+15&-16;return b|0}function Ba(){return i|0}function Ca(a){a=a|0;i=a}function Da(a,b){a=a|0;b=b|0;i=a;j=b}function Ea(a,b){a=a|0;b=b|0;if(!m){m=a;n=b}}function Fa(a){a=a|0;B=a}function Ga(){return B|0}function Ha(a,b){a=a|0;b=b|0;var c=0;c=wb(224)|0;Wa(c,a,b);return c|0}function Ia(a){a=a|0;if(!a)return;Ya(a);yb(a);return}function Ja(a,b){a=a|0;b=b|0;Za(a,b);return}function Ka(a){a=a|0;return (eb(a)|0)&1|0}function La(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;f=i;i=i+16|0;d=f;db(d,a);e=c[d>>2]|0;h[b>>3]=+h[e>>3];h[b+8>>3]=+h[e+8>>3];h[b+16>>3]=+h[e+16>>3];h[b+24>>3]=+h[e+24>>3];h[b+32>>3]=+h[e+32>>3];h[b+40>>3]=+h[e+40>>3];h[b+48>>3]=+h[e+48>>3];h[b+56>>3]=+h[e+56>>3];h[b+64>>3]=+h[e+64>>3];h[b+72>>3]=+h[e+72>>3];h[b+80>>3]=+h[e+80>>3];h[b+88>>3]=+h[e+88>>3];if(!e){i=f;return}a=d+4|0;d=c[a>>2]|0;if((d|0)!=(e|0))c[a>>2]=d+(~((d+-8-e|0)>>>3)<<3);yb(e);i=f;return}function Ma(){var a=0;a=wb(11352)|0;Sa(a);return a|0}function Na(a){a=a|0;if(!a)return;yb(a);return}function Oa(a,b){a=a|0;b=b|0;Va(a,b);return}function Pa(a){a=a|0;return c[a>>2]|0}function Qa(a){a=a|0;return c[a+4>>2]|0}function Ra(a){a=a|0;return c[a+8>>2]|0}function Sa(a){a=a|0;h[a+11344>>3]=1.06;Ta(a);return}function Ta(a){a=a|0;var b=0,c=0;Xb(a+112|0,0,10368)|0;b=0;do{h[a+112+(b*96|0)+(b<<3)>>3]=1.0;h[a+112+(b*96|0)+(((b+4|0)%12|0)<<3)>>3]=1.0;h[a+112+(b*96|0)+(((b+7|0)%12|0)<<3)>>3]=1.0;b=b+1|0}while((b|0)!=12);b=0;c=12;while(1){h[a+112+(c*96|0)+(b<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+3|0)%12|0)<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+7|0)%12|0)<<3)>>3]=1.0;b=b+1|0;if((b|0)==12){b=0;c=24;break}else c=c+1|0}while(1){h[a+112+(c*96|0)+(b<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+3|0)%12|0)<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+6|0)%12|0)<<3)>>3]=1.0;b=b+1|0;if((b|0)==12){b=0;c=36;break}else c=c+1|0}while(1){h[a+112+(c*96|0)+(b<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+4|0)%12|0)<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+8|0)%12|0)<<3)>>3]=1.0;b=b+1|0;if((b|0)==12){b=0;c=48;break}else c=c+1|0}while(1){h[a+112+(c*96|0)+(b<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+2|0)%12|0)<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+7|0)%12|0)<<3)>>3]=1.0;b=b+1|0;if((b|0)==12){b=0;c=60;break}else c=c+1|0}while(1){h[a+112+(c*96|0)+(b<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+5|0)%12|0)<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+7|0)%12|0)<<3)>>3]=1.0;b=b+1|0;if((b|0)==12){b=0;c=72;break}else c=c+1|0}while(1){h[a+112+(c*96|0)+(b<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+4|0)%12|0)<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+7|0)%12|0)<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+11|0)%12|0)<<3)>>3]=1.0;b=b+1|0;if((b|0)==12){b=0;c=84;break}else c=c+1|0}while(1){h[a+112+(c*96|0)+(b<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+3|0)%12|0)<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+7|0)%12|0)<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+10|0)%12|0)<<3)>>3]=1.0;b=b+1|0;if((b|0)==12){b=0;c=96;break}else c=c+1|0}while(1){h[a+112+(c*96|0)+(b<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+4|0)%12|0)<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+7|0)%12|0)<<3)>>3]=1.0;h[a+112+(c*96|0)+(((b+10|0)%12|0)<<3)>>3]=1.0;b=b+1|0;if((b|0)==12)break;else c=c+1|0}return}function Ua(a){a=a|0;var b=0,d=0.0,e=0,f=0,g=0.0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0;b=0;do{s=a+16+(((b+7|0)%12|0)<<3)|0;g=+h[s>>3]-+h[a+16+(b<<3)>>3]*.1;h[s>>3]=g<0.0?0.0:g;b=b+1|0}while((b|0)!=12);e=a+16|0;f=a+11344|0;l=a+24|0;m=a+32|0;n=a+40|0;o=a+48|0;p=a+56|0;q=a+64|0;r=a+72|0;s=a+80|0;i=a+88|0;j=a+96|0;k=a+104|0;b=0;do{C=+h[e>>3];B=+h[l>>3];A=+h[m>>3];z=+h[n>>3];y=+h[o>>3];x=+h[p>>3];w=+h[q>>3];v=+h[r>>3];u=+h[s>>3];t=+h[i>>3];d=+h[j>>3];g=+h[k>>3];h[a+10480+(b<<3)>>3]=+E(+((1.0-+h[a+112+(b*96|0)>>3])*(C*C)+0.0+(1.0-+h[a+112+(b*96|0)+8>>3])*(B*B)+(1.0-+h[a+112+(b*96|0)+16>>3])*(A*A)+(1.0-+h[a+112+(b*96|0)+24>>3])*(z*z)+(1.0-+h[a+112+(b*96|0)+32>>3])*(y*y)+(1.0-+h[a+112+(b*96|0)+40>>3])*(x*x)+(1.0-+h[a+112+(b*96|0)+48>>3])*(w*w)+(1.0-+h[a+112+(b*96|0)+56>>3])*(v*v)+(1.0-+h[a+112+(b*96|0)+64>>3])*(u*u)+(1.0-+h[a+112+(b*96|0)+72>>3])*(t*t)+(1.0-+h[a+112+(b*96|0)+80>>3])*(d*d)+(1.0-+h[a+112+(b*96|0)+88>>3])*(g*g)))/(+h[f>>3]*9.0);b=b+1|0}while((b|0)!=12);b=12;do{d=+h[e>>3];g=+h[l>>3];t=+h[m>>3];u=+h[n>>3];v=+h[o>>3];w=+h[p>>3];x=+h[q>>3];y=+h[r>>3];z=+h[s>>3];A=+h[i>>3];B=+h[j>>3];C=+h[k>>3];h[a+10480+(b<<3)>>3]=+E(+((1.0-+h[a+112+(b*96|0)>>3])*(d*d)+0.0+(1.0-+h[a+112+(b*96|0)+8>>3])*(g*g)+(1.0-+h[a+112+(b*96|0)+16>>3])*(t*t)+(1.0-+h[a+112+(b*96|0)+24>>3])*(u*u)+(1.0-+h[a+112+(b*96|0)+32>>3])*(v*v)+(1.0-+h[a+112+(b*96|0)+40>>3])*(w*w)+(1.0-+h[a+112+(b*96|0)+48>>3])*(x*x)+(1.0-+h[a+112+(b*96|0)+56>>3])*(y*y)+(1.0-+h[a+112+(b*96|0)+64>>3])*(z*z)+(1.0-+h[a+112+(b*96|0)+72>>3])*(A*A)+(1.0-+h[a+112+(b*96|0)+80>>3])*(B*B)+(1.0-+h[a+112+(b*96|0)+88>>3])*(C*C)))/(+h[f>>3]*9.0);b=b+1|0}while((b|0)!=24);b=24;do{d=+h[e>>3];g=+h[l>>3];t=+h[m>>3];u=+h[n>>3];v=+h[o>>3];w=+h[p>>3];x=+h[q>>3];y=+h[r>>3];z=+h[s>>3];A=+h[i>>3];B=+h[j>>3];C=+h[k>>3];h[a+10480+(b<<3)>>3]=+E(+((1.0-+h[a+112+(b*96|0)>>3])*(d*d)+0.0+(1.0-+h[a+112+(b*96|0)+8>>3])*(g*g)+(1.0-+h[a+112+(b*96|0)+16>>3])*(t*t)+(1.0-+h[a+112+(b*96|0)+24>>3])*(u*u)+(1.0-+h[a+112+(b*96|0)+32>>3])*(v*v)+(1.0-+h[a+112+(b*96|0)+40>>3])*(w*w)+(1.0-+h[a+112+(b*96|0)+48>>3])*(x*x)+(1.0-+h[a+112+(b*96|0)+56>>3])*(y*y)+(1.0-+h[a+112+(b*96|0)+64>>3])*(z*z)+(1.0-+h[a+112+(b*96|0)+72>>3])*(A*A)+(1.0-+h[a+112+(b*96|0)+80>>3])*(B*B)+(1.0-+h[a+112+(b*96|0)+88>>3])*(C*C)))/(+h[f>>3]*9.0);b=b+1|0}while((b|0)!=36);b=36;do{d=+h[e>>3];g=+h[l>>3];t=+h[m>>3];u=+h[n>>3];v=+h[o>>3];w=+h[p>>3];x=+h[q>>3];y=+h[r>>3];z=+h[s>>3];A=+h[i>>3];B=+h[j>>3];C=+h[k>>3];h[a+10480+(b<<3)>>3]=+E(+((1.0-+h[a+112+(b*96|0)>>3])*(d*d)+0.0+(1.0-+h[a+112+(b*96|0)+8>>3])*(g*g)+(1.0-+h[a+112+(b*96|0)+16>>3])*(t*t)+(1.0-+h[a+112+(b*96|0)+24>>3])*(u*u)+(1.0-+h[a+112+(b*96|0)+32>>3])*(v*v)+(1.0-+h[a+112+(b*96|0)+40>>3])*(w*w)+(1.0-+h[a+112+(b*96|0)+48>>3])*(x*x)+(1.0-+h[a+112+(b*96|0)+56>>3])*(y*y)+(1.0-+h[a+112+(b*96|0)+64>>3])*(z*z)+(1.0-+h[a+112+(b*96|0)+72>>3])*(A*A)+(1.0-+h[a+112+(b*96|0)+80>>3])*(B*B)+(1.0-+h[a+112+(b*96|0)+88>>3])*(C*C)))/(+h[f>>3]*9.0);b=b+1|0}while((b|0)!=48);b=48;do{d=+h[e>>3];g=+h[l>>3];t=+h[m>>3];u=+h[n>>3];v=+h[o>>3];w=+h[p>>3];x=+h[q>>3];y=+h[r>>3];z=+h[s>>3];A=+h[i>>3];B=+h[j>>3];C=+h[k>>3];h[a+10480+(b<<3)>>3]=+E(+((1.0-+h[a+112+(b*96|0)>>3])*(d*d)+0.0+(1.0-+h[a+112+(b*96|0)+8>>3])*(g*g)+(1.0-+h[a+112+(b*96|0)+16>>3])*(t*t)+(1.0-+h[a+112+(b*96|0)+24>>3])*(u*u)+(1.0-+h[a+112+(b*96|0)+32>>3])*(v*v)+(1.0-+h[a+112+(b*96|0)+40>>3])*(w*w)+(1.0-+h[a+112+(b*96|0)+48>>3])*(x*x)+(1.0-+h[a+112+(b*96|0)+56>>3])*(y*y)+(1.0-+h[a+112+(b*96|0)+64>>3])*(z*z)+(1.0-+h[a+112+(b*96|0)+72>>3])*(A*A)+(1.0-+h[a+112+(b*96|0)+80>>3])*(B*B)+(1.0-+h[a+112+(b*96|0)+88>>3])*(C*C)))/9.0;b=b+1|0}while((b|0)!=60);b=60;do{d=+h[e>>3];g=+h[l>>3];t=+h[m>>3];u=+h[n>>3];v=+h[o>>3];w=+h[p>>3];x=+h[q>>3];y=+h[r>>3];z=+h[s>>3];A=+h[i>>3];B=+h[j>>3];C=+h[k>>3];h[a+10480+(b<<3)>>3]=+E(+((1.0-+h[a+112+(b*96|0)>>3])*(d*d)+0.0+(1.0-+h[a+112+(b*96|0)+8>>3])*(g*g)+(1.0-+h[a+112+(b*96|0)+16>>3])*(t*t)+(1.0-+h[a+112+(b*96|0)+24>>3])*(u*u)+(1.0-+h[a+112+(b*96|0)+32>>3])*(v*v)+(1.0-+h[a+112+(b*96|0)+40>>3])*(w*w)+(1.0-+h[a+112+(b*96|0)+48>>3])*(x*x)+(1.0-+h[a+112+(b*96|0)+56>>3])*(y*y)+(1.0-+h[a+112+(b*96|0)+64>>3])*(z*z)+(1.0-+h[a+112+(b*96|0)+72>>3])*(A*A)+(1.0-+h[a+112+(b*96|0)+80>>3])*(B*B)+(1.0-+h[a+112+(b*96|0)+88>>3])*(C*C)))/9.0;b=b+1|0}while((b|0)!=72);b=72;do{d=+h[e>>3];g=+h[l>>3];t=+h[m>>3];u=+h[n>>3];v=+h[o>>3];w=+h[p>>3];x=+h[q>>3];y=+h[r>>3];z=+h[s>>3];A=+h[i>>3];B=+h[j>>3];C=+h[k>>3];h[a+10480+(b<<3)>>3]=+E(+((1.0-+h[a+112+(b*96|0)>>3])*(d*d)+0.0+(1.0-+h[a+112+(b*96|0)+8>>3])*(g*g)+(1.0-+h[a+112+(b*96|0)+16>>3])*(t*t)+(1.0-+h[a+112+(b*96|0)+24>>3])*(u*u)+(1.0-+h[a+112+(b*96|0)+32>>3])*(v*v)+(1.0-+h[a+112+(b*96|0)+40>>3])*(w*w)+(1.0-+h[a+112+(b*96|0)+48>>3])*(x*x)+(1.0-+h[a+112+(b*96|0)+56>>3])*(y*y)+(1.0-+h[a+112+(b*96|0)+64>>3])*(z*z)+(1.0-+h[a+112+(b*96|0)+72>>3])*(A*A)+(1.0-+h[a+112+(b*96|0)+80>>3])*(B*B)+(1.0-+h[a+112+(b*96|0)+88>>3])*(C*C)))*.125;b=b+1|0}while((b|0)!=84);b=84;do{d=+h[e>>3];g=+h[l>>3];t=+h[m>>3];u=+h[n>>3];v=+h[o>>3];w=+h[p>>3];x=+h[q>>3];y=+h[r>>3];z=+h[s>>3];A=+h[i>>3];B=+h[j>>3];C=+h[k>>3];h[a+10480+(b<<3)>>3]=+E(+((1.0-+h[a+112+(b*96|0)>>3])*(d*d)+0.0+(1.0-+h[a+112+(b*96|0)+8>>3])*(g*g)+(1.0-+h[a+112+(b*96|0)+16>>3])*(t*t)+(1.0-+h[a+112+(b*96|0)+24>>3])*(u*u)+(1.0-+h[a+112+(b*96|0)+32>>3])*(v*v)+(1.0-+h[a+112+(b*96|0)+40>>3])*(w*w)+(1.0-+h[a+112+(b*96|0)+48>>3])*(x*x)+(1.0-+h[a+112+(b*96|0)+56>>3])*(y*y)+(1.0-+h[a+112+(b*96|0)+64>>3])*(z*z)+(1.0-+h[a+112+(b*96|0)+72>>3])*(A*A)+(1.0-+h[a+112+(b*96|0)+80>>3])*(B*B)+(1.0-+h[a+112+(b*96|0)+88>>3])*(C*C)))/(+h[f>>3]*8.0);b=b+1|0}while((b|0)!=96);b=96;do{d=+h[e>>3];g=+h[l>>3];t=+h[m>>3];u=+h[n>>3];v=+h[o>>3];w=+h[p>>3];x=+h[q>>3];y=+h[r>>3];z=+h[s>>3];A=+h[i>>3];B=+h[j>>3];C=+h[k>>3];h[a+10480+(b<<3)>>3]=+E(+((1.0-+h[a+112+(b*96|0)>>3])*(d*d)+0.0+(1.0-+h[a+112+(b*96|0)+8>>3])*(g*g)+(1.0-+h[a+112+(b*96|0)+16>>3])*(t*t)+(1.0-+h[a+112+(b*96|0)+24>>3])*(u*u)+(1.0-+h[a+112+(b*96|0)+32>>3])*(v*v)+(1.0-+h[a+112+(b*96|0)+40>>3])*(w*w)+(1.0-+h[a+112+(b*96|0)+48>>3])*(x*x)+(1.0-+h[a+112+(b*96|0)+56>>3])*(y*y)+(1.0-+h[a+112+(b*96|0)+64>>3])*(z*z)+(1.0-+h[a+112+(b*96|0)+72>>3])*(A*A)+(1.0-+h[a+112+(b*96|0)+80>>3])*(B*B)+(1.0-+h[a+112+(b*96|0)+88>>3])*(C*C)))/(+h[f>>3]*8.0);b=b+1|0}while((b|0)!=108);f=0;b=0;g=1.0e5;while(1){d=+h[a+10480+(f<<3)>>3];e=d<g;b=e?f:b;f=f+1|0;if((f|0)==108){e=b;break}else g=e?d:g}if((e|0)<12){c[a>>2]=e;c[a+4>>2]=1;c[a+8>>2]=0}b=e+-12|0;if(b>>>0<12){c[a>>2]=b;c[a+4>>2]=0;c[a+8>>2]=0}b=e+-24|0;if(b>>>0<12){c[a>>2]=b;c[a+4>>2]=4;c[a+8>>2]=0}b=e+-36|0;if(b>>>0<12){c[a>>2]=b;c[a+4>>2]=5;c[a+8>>2]=0}b=e+-48|0;if(b>>>0<12){c[a>>2]=b;c[a+4>>2]=2;c[a+8>>2]=2}b=e+-60|0;if(b>>>0<12){c[a>>2]=b;c[a+4>>2]=2;c[a+8>>2]=4}b=e+-72|0;if(b>>>0<12){c[a>>2]=b;c[a+4>>2]=1;c[a+8>>2]=7}b=e+-84|0;if(b>>>0<12){c[a>>2]=b;c[a+4>>2]=0;c[a+8>>2]=7}b=e+-96|0;if(b>>>0>=12)return;c[a>>2]=b;c[a+4>>2]=3;c[a+8>>2]=7;return}function Va(a,b){a=a|0;b=b|0;h[a+16>>3]=+h[b>>3];h[a+24>>3]=+h[b+8>>3];h[a+32>>3]=+h[b+16>>3];h[a+40>>3]=+h[b+24>>3];h[a+48>>3]=+h[b+32>>3];h[a+56>>3]=+h[b+40>>3];h[a+64>>3]=+h[b+48>>3];h[a+72>>3]=+h[b+56>>3];h[a+80>>3]=+h[b+64>>3];h[a+88>>3]=+h[b+72>>3];h[a+96>>3]=+h[b+80>>3];h[a+104>>3]=+h[b+88>>3];Ua(a);return}function Wa(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,i=0.0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;v=b+4|0;l=b+12|0;m=b+16|0;r=b+24|0;s=b+28|0;x=b+36|0;y=b+40|0;p=b+48|0;q=b+52|0;g=b+64|0;f=b;j=f+60|0;do{c[f>>2]=0;f=f+4|0}while((f|0)<(j|0));h[g>>3]=130.81278265;u=b+168|0;c[u>>2]=8192;c[b+184>>2]=2;c[b+188>>2]=2;c[b+192>>2]=2;h[b+72>>3]=130.81278265;h[b+80>>3]=138.59131572669693;h[b+88>>3]=146.83238446389691;h[b+96>>3]=155.5634918606845;h[b+104>>3]=164.8137795909323;h[b+112>>3]=174.6141145137448;h[b+120>>3]=184.99721135539392;h[b+128>>3]=195.99771529122458;h[b+136>>3]=207.65235164920196;h[b+144>>3]=219.9999999994966;h[b+152>>3]=233.08187754860188;h[b+160>>3]=246.94165402827798;c[b+212>>2]=xb(65536)|0;c[b+216>>2]=xb(65536)|0;c[b+208>>2]=fb(8192,0,0,0)|0;f=c[u>>2]|0;k=c[m>>2]|0;j=c[l>>2]|0;g=k-j>>3;if(f>>>0<=g>>>0){if(f>>>0<g>>>0?(n=j+(f<<3)|0,(k|0)!=(n|0)):0)c[m>>2]=k+(~((k+-8-n|0)>>>3)<<3)}else Xa(l,f-g|0);j=c[q>>2]|0;f=c[p>>2]|0;g=j-f>>3;if(g>>>0>=12){if(g>>>0>12?(o=f+96|0,(j|0)!=(o|0)):0)c[q>>2]=j+(~((j+-8-o|0)>>>3)<<3)}else{Xa(p,12-g|0);f=c[p>>2]|0}j=f+96|0;do{c[f>>2]=0;f=f+4|0}while((f|0)<(j|0));g=c[u>>2]|0;f=((g|0)/2|0)+1|0;l=c[s>>2]|0;k=c[r>>2]|0;j=l-k>>3;if(f>>>0<=j>>>0){if(f>>>0<j>>>0?(t=k+(f<<3)|0,(l|0)!=(t|0)):0)c[s>>2]=l+(~((l+-8-t|0)>>>3)<<3)}else{Xa(r,f-j|0);g=c[u>>2]|0}k=c[v>>2]|0;j=c[b>>2]|0;f=k-j>>3;if(g>>>0<=f>>>0){if(g>>>0<f>>>0?(w=j+(g<<3)|0,(k|0)!=(w|0)):0)c[v>>2]=k+(~((k+-8-w|0)>>>3)<<3)}else{Xa(b,g-f|0);g=c[u>>2]|0}if((g|0)>0){f=c[b>>2]|0;i=+(g|0);j=0;do{h[f+(j<<3)>>3]=.54-+G(+(+(j|0)/i*6.283185307179586))*.46;j=j+1|0}while((j|0)!=(g|0))}c[b+172>>2]=e;c[b+176>>2]=d;f=(d|0)/4|0;j=c[y>>2]|0;k=c[x>>2]|0;g=j-k>>3;l=j;if(f>>>0>g>>>0){Xa(x,f-g|0);y=c[y>>2]|0;x=c[x>>2]|0;x=y-x|0;x=x>>3;y=b+180|0;c[y>>2]=x;y=b+196|0;c[y>>2]=0;y=b+200|0;c[y>>2]=4096;b=b+204|0;a[b>>0]=0;return}if(f>>>0>=g>>>0){y=j;x=k;x=y-x|0;x=x>>3;y=b+180|0;c[y>>2]=x;y=b+196|0;c[y>>2]=0;y=b+200|0;c[y>>2]=4096;b=b+204|0;a[b>>0]=0;return}f=k+(f<<3)|0;if((l|0)==(f|0)){y=j;x=k;x=y-x|0;x=x>>3;y=b+180|0;c[y>>2]=x;y=b+196|0;c[y>>2]=0;y=b+200|0;c[y>>2]=4096;b=b+204|0;a[b>>0]=0;return}x=l+(~((l+-8-f|0)>>>3)<<3)|0;c[y>>2]=x;y=x;x=k;x=y-x|0;x=x>>3;y=b+180|0;c[y>>2]=x;y=b+196|0;c[y>>2]=0;y=b+200|0;c[y>>2]=4096;b=b+204|0;a[b>>0]=0;return}function Xa(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;j=a+8|0;e=c[j>>2]|0;k=a+4|0;d=c[k>>2]|0;if(e-d>>3>>>0>=b>>>0){Xb(d|0,0,b<<3|0)|0;c[k>>2]=d+(b<<3);return}l=c[a>>2]|0;f=(d-l>>3)+b|0;if(f>>>0>536870911)vb(a);d=e-l|0;if(d>>3>>>0<268435455){d=d>>2;d=d>>>0<f>>>0?f:d;f=c[k>>2]|0;e=f-l>>3;if(d)if(d>>>0>536870911){a=qa(4)|0;Ub(a);ca(a|0,72,6)}else i=10;else{h=0;g=0;d=f}}else{e=c[k>>2]|0;d=536870911;f=e;e=e-l>>3;i=10}if((i|0)==10){h=d;g=wb(d<<3)|0;d=f}f=g+(e<<3)|0;Xb(f|0,0,b<<3|0)|0;d=d-l|0;e=f+(0-(d>>3)<<3)|0;if((d|0)>0)Yb(e|0,l|0,d|0)|0;c[a>>2]=e;c[k>>2]=f+(b<<3);c[j>>2]=g+(h<<3);if(!l)return;yb(l);return}function Ya(a){a=a|0;var b=0,d=0,e=0,f=0;ub(c[a+208>>2]|0);b=c[a+212>>2]|0;if(b|0)zb(b);b=c[a+216>>2]|0;if(b|0)zb(b);f=c[a+48>>2]|0;b=f;if(f|0){d=a+52|0;e=c[d>>2]|0;if((e|0)!=(f|0))c[d>>2]=e+(~((e+-8-b|0)>>>3)<<3);yb(f)}b=c[a+36>>2]|0;d=b;if(b|0){e=a+40|0;f=c[e>>2]|0;if((f|0)!=(b|0))c[e>>2]=f+(~((f+-8-d|0)>>>3)<<3);yb(b)}b=c[a+24>>2]|0;d=b;if(b|0){e=a+28|0;f=c[e>>2]|0;if((f|0)!=(b|0))c[e>>2]=f+(~((f+-8-d|0)>>>3)<<3);yb(b)}b=c[a+12>>2]|0;d=b;if(b|0){e=a+16|0;f=c[e>>2]|0;if((f|0)!=(b|0))c[e>>2]=f+(~((f+-8-d|0)>>>3)<<3);yb(b)}e=c[a>>2]|0;if(!e)return;b=a+4|0;d=c[b>>2]|0;if((d|0)!=(e|0))c[b>>2]=d+(~((d+-8-e|0)>>>3)<<3);yb(e);return}function Za(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;j=i;i=i+32|0;g=j+12|0;d=j;c[g>>2]=0;h=g+4|0;c[h>>2]=0;c[g+8>>2]=0;_a(g,b,b+(c[a+176>>2]<<3)|0);$a(d,g);ab(a,d);e=c[d>>2]|0;f=e;if(e|0){a=d+4|0;b=c[a>>2]|0;if((b|0)!=(e|0))c[a>>2]=b+(~((b+-8-f|0)>>>3)<<3);yb(e)}b=c[g>>2]|0;if(!b){i=j;return}a=c[h>>2]|0;if((a|0)!=(b|0))c[h>>2]=a+(~((a+-8-b|0)>>>3)<<3);yb(b);i=j;return}function _a(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;k=d;i=b;h=k-i|0;m=h>>3;j=a+8|0;e=c[j>>2]|0;n=c[a>>2]|0;l=n;if(m>>>0<=e-n>>3>>>0){j=a+4|0;g=(c[j>>2]|0)-n>>3;h=m>>>0>g>>>0;g=h?b+(g<<3)|0:d;f=g;e=f-i|0;d=e>>3;if(d|0)Zb(n|0,b|0,e|0)|0;d=l+(d<<3)|0;if(h){e=k-f|0;if((e|0)<=0)return;Yb(c[j>>2]|0,g|0,e|0)|0;c[j>>2]=(c[j>>2]|0)+(e>>3<<3);return}else{e=c[j>>2]|0;if((e|0)==(d|0))return;c[j>>2]=e+(~((e+-8-d|0)>>>3)<<3);return}}f=n;if(n){e=a+4|0;d=c[e>>2]|0;if((d|0)!=(l|0))c[e>>2]=d+(~((d+-8-n|0)>>>3)<<3);yb(f);c[j>>2]=0;c[e>>2]=0;c[a>>2]=0;e=0}if(m>>>0>536870911)vb(a);e=e-0|0;if(e>>3>>>0<268435455){e=e>>2;e=e>>>0<m>>>0?m:e;if(e>>>0>536870911)vb(a);else g=e}else g=536870911;e=wb(g<<3)|0;d=a+4|0;c[d>>2]=e;c[a>>2]=e;c[j>>2]=e+(g<<3);if((h|0)<=0)return;Yb(e|0,b|0,h|0)|0;c[d>>2]=e+(m<<3);return}function $a(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;c[a>>2]=0;h=a+4|0;c[h>>2]=0;c[a+8>>2]=0;f=b+4|0;d=(c[f>>2]|0)-(c[b>>2]|0)|0;e=d>>3;if(!e)return;if(e>>>0>536870911)vb(a);g=wb(d)|0;c[h>>2]=g;c[a>>2]=g;c[a+8>>2]=g+(e<<3);e=c[b>>2]|0;d=(c[f>>2]|0)-e|0;if((d|0)<=0)return;Yb(g|0,e|0,d|0)|0;c[h>>2]=g+(d>>3<<3);return}function ab(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0,l=0;l=i;i=i+16|0;e=l;a[b+204>>0]=0;$a(e,d);bb(b,e);f=c[e>>2]|0;g=f;if(f|0){d=e+4|0;e=c[d>>2]|0;if((e|0)!=(f|0))c[d>>2]=e+(~((e+-8-g|0)>>>3)<<3);yb(f)}f=b+168|0;d=c[f>>2]|0;g=c[b+180>>2]|0;k=d-g|0;if((k|0)>0){d=c[b+12>>2]|0;e=0;do{h[d+(e<<3)>>3]=+h[d+(g+e<<3)>>3];e=e+1|0}while((e|0)<(k|0));d=c[f>>2]|0}if((k|0)<(d|0)){g=c[b+36>>2]|0;j=c[b+12>>2]|0;e=k;f=0;while(1){h[j+(e<<3)>>3]=+h[g+(f<<3)>>3];e=e+1|0;if((e|0)>=(d|0))break;else f=f+1|0}}d=b+196|0;k=(c[d>>2]|0)+(c[b+176>>2]|0)|0;c[d>>2]=k;if((k|0)<(c[b+200>>2]|0)){i=l;return}cb(b);c[d>>2]=0;i=l;return}function bb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0.0,j=0.0,k=0.0,l=0.0,m=0,n=0,o=0,p=0,q=0,r=0,s=0.0;r=i;i=i+16|0;o=r;m=a+176|0;n=c[m>>2]|0;c[o>>2]=0;p=o+4|0;c[p>>2]=0;c[o+8>>2]=0;if(!n){i=r;return}if(n>>>0>536870911)vb(o);f=n<<3;d=wb(f)|0;c[o>>2]=d;q=d+(n<<3)|0;c[o+8>>2]=q;Xb(d|0,0,f|0)|0;c[p>>2]=q;b=c[b>>2]|0;f=0;k=0.0;g=0.0;l=0.0;j=0.0;while(1){e=b+(f<<3)|0;g=g*.2928999960422516+(k*.5857999920845032+ +h[e>>3]*.2928999960422516)-l*-0.0-j*.17159999907016754;h[d+(f<<3)>>3]=g;f=f+1|0;if((f|0)>=(n|0))break;else{j=l;s=k;k=+h[e>>3];l=g;g=s}}b=c[m>>2]|0;if((b|0)>3){d=c[o>>2]|0;f=c[a+36>>2]|0;b=(b|0)/4|0;e=0;do{h[f+(e<<3)>>3]=+h[d+(e<<2<<3)>>3];e=e+1|0}while((e|0)<(b|0))}if((q|0)!=(d|0))c[p>>2]=q+(~((q+-8-d|0)>>>3)<<3);yb(d);i=r;return}function cb(b){b=b|0;var d=0,e=0,f=0,i=0,j=0,k=0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0,s=0,t=0,u=0,v=0.0,w=0,x=0,y=0,z=0,A=0,B=0.0;k=b+168|0;e=c[k>>2]|0;if((e|0)>0){f=c[b+12>>2]|0;i=c[b>>2]|0;d=c[b+212>>2]|0;j=0;do{g[d+(j<<3)>>2]=+h[f+(j<<3)>>3]*+h[i+(j<<3)>>3];g[d+(j<<3)+4>>2]=0.0;j=j+1|0}while((j|0)!=(e|0))}else d=c[b+212>>2]|0;e=b+216|0;hb(c[b+208>>2]|0,d,c[e>>2]|0);k=c[k>>2]|0;if((k|0)<-1)e=b+24|0;else{d=c[e>>2]|0;e=b+24|0;f=c[e>>2]|0;i=(k|0)/2|0;j=0;while(1){q=+g[d+(j<<3)>>2];v=+g[d+(j<<3)+4>>2];h[f+(j<<3)>>3]=+E(+(+E(+(q*q+v*v))));if((j|0)<(i|0))j=j+1|0;else break}}v=+(c[b+172>>2]|0)*.25/+(k|0);w=b+188|0;x=b+48|0;y=b+184|0;z=b+192|0;A=0;do{u=c[w>>2]|0;a:do if((u|0)<1)l=0.0;else{s=c[y>>2]|0;if((s|0)<1){d=1;while(1)if((d|0)<(u|0))d=d+1|0;else{l=0.0;break a}}q=+h[b+72+(A<<3)>>3];r=c[z>>2]|0;l=0.0;t=1;while(1){p=+(t|0)*q;j=1;k=r;m=0.0;while(1){o=+(j|0);d=~~+C(+(o*p/v+.5));i=Q(r,j)|0;f=d-i|0;if((f|0)<(i+d|0)){i=c[e>>2]|0;d=d+k|0;n=0.0;do{B=+h[i+(f<<3)>>3];n=B>n?B:n;f=f+1|0}while((f|0)!=(d|0))}else n=0.0;m=m+n/o;if((j|0)<(s|0)){j=j+1|0;k=k+r|0}else break}l=l+m;if((t|0)<(u|0))t=t+1|0;else break}}while(0);h[(c[x>>2]|0)+(A<<3)>>3]=l;A=A+1|0}while((A|0)!=12);a[b+204>>0]=1;return}function db(a,b){a=a|0;b=b|0;$a(a,b+48|0);return}function eb(b){b=b|0;return (a[b+204>>0]|0)!=0|0}function fb(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,h=0.0,i=0,j=0.0;f=(a<<3)+264|0;if(!e)i=tb(f)|0;else{if(!d)d=0;else d=(c[e>>2]|0)>>>0<f>>>0?0:d;c[e>>2]=f;i=d}if(!i)return i|0;c[i>>2]=a;e=i+4|0;c[e>>2]=b;h=+(a|0);a:do if((a|0)>0){f=b;d=0;while(1){j=+(d|0)*-6.283185307179586/h;j=(f|0)==0?j:-j;g[i+264+(d<<3)>>2]=+G(+j);g[i+264+(d<<3)+4>>2]=+H(+j);d=d+1|0;if((d|0)==(a|0))break a;f=c[e>>2]|0}}while(0);h=+C(+(+E(+h)));f=a;e=i+8|0;d=4;while(1){b:do if((f|0)%(d|0)|0)while(1){switch(d|0){case 4:{d=2;break}case 2:{d=3;break}default:d=d+2|0}d=+(d|0)>h?f:d;if(!((f|0)%(d|0)|0))break b}while(0);f=(f|0)/(d|0)|0;c[e>>2]=d;c[e+4>>2]=f;if((f|0)<=1)break;else e=e+8|0}return i|0}function gb(a,b,d,e,f,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;var i=0,j=0,l=0,m=0,n=0.0,o=0.0,p=0.0,q=0.0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0.0,z=0.0,A=0.0,B=0.0,C=0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0;w=c[f>>2]|0;m=f+8|0;x=c[f+4>>2]|0;r=a+((Q(x,w)|0)<<3)|0;if((x|0)==1){j=Q(e,d)|0;i=a;f=b;while(1){t=f;u=c[t+4>>2]|0;v=i;c[v>>2]=c[t>>2];c[v+4>>2]=u;i=i+8|0;if((i|0)==(r|0))break;else f=f+(j<<3)|0}}else{j=Q(w,d)|0;l=Q(e,d)|0;i=a;f=b;while(1){gb(i,f,j,e,m,h);i=i+(x<<3)|0;if((i|0)==(r|0))break;else f=f+(l<<3)|0}}switch(w|0){case 2:{j=a;l=x;i=a+(x<<3)|0;f=h+264|0;while(1){o=+g[i>>2];y=+g[f>>2];a=i+4|0;n=+g[a>>2];q=+g[f+4>>2];p=o*y-n*q;q=y*n+o*q;g[i>>2]=+g[j>>2]-p;x=j+4|0;g[a>>2]=+g[x>>2]-q;g[j>>2]=p+ +g[j>>2];g[x>>2]=q+ +g[x>>2];l=l+-1|0;if(!l)break;else{j=j+8|0;i=i+8|0;f=f+(d<<3)|0}}return}case 3:{e=x<<1;n=+g[h+264+((Q(x,d)|0)<<3)+4>>2];l=h+264|0;m=d<<1;f=a;i=x;j=l;while(1){h=f+(x<<3)|0;o=+g[h>>2];p=+g[j>>2];a=f+(x<<3)+4|0;B=+g[a>>2];z=+g[j+4>>2];A=o*p-B*z;z=p*B+o*z;v=f+(e<<3)|0;o=+g[v>>2];B=+g[l>>2];w=f+(e<<3)+4|0;p=+g[w>>2];q=+g[l+4>>2];y=o*B-p*q;q=B*p+o*q;o=A+y;p=z+q;g[h>>2]=+g[f>>2]-o*.5;u=f+4|0;g[a>>2]=+g[u>>2]-p*.5;y=n*(A-y);q=n*(z-q);g[f>>2]=o+ +g[f>>2];g[u>>2]=p+ +g[u>>2];g[v>>2]=q+ +g[h>>2];g[w>>2]=+g[a>>2]-y;g[h>>2]=+g[h>>2]-q;g[a>>2]=y+ +g[a>>2];i=i+-1|0;if(!i)break;else{f=f+8|0;j=j+(d<<3)|0;l=l+(m<<3)|0}}return}case 4:{e=x<<1;b=x*3|0;f=h+264|0;r=d<<1;s=d*3|0;if(!(c[h+4>>2]|0)){i=a;j=x;l=f;m=f;while(1){v=i+(x<<3)|0;n=+g[v>>2];o=+g[l>>2];w=i+(x<<3)+4|0;y=+g[w>>2];D=+g[l+4>>2];E=n*o-y*D;D=o*y+n*D;C=i+(e<<3)|0;n=+g[C>>2];y=+g[m>>2];t=i+(e<<3)+4|0;o=+g[t>>2];p=+g[m+4>>2];q=n*y-o*p;p=y*o+n*p;h=i+(b<<3)|0;n=+g[h>>2];o=+g[f>>2];a=i+(b<<3)+4|0;y=+g[a>>2];z=+g[f+4>>2];B=n*o-y*z;z=o*y+n*z;n=+g[i>>2];y=n-q;u=i+4|0;o=+g[u>>2];A=o-p;n=q+n;g[i>>2]=n;o=p+o;g[u>>2]=o;p=E+B;q=D+z;B=E-B;z=D-z;g[C>>2]=n-p;g[t>>2]=o-q;g[i>>2]=p+ +g[i>>2];g[u>>2]=q+ +g[u>>2];g[v>>2]=y+z;g[w>>2]=A-B;g[h>>2]=y-z;g[a>>2]=A+B;j=j+-1|0;if(!j)break;else{i=i+8|0;l=l+(d<<3)|0;m=m+(r<<3)|0;f=f+(s<<3)|0}}return}else{i=a;j=x;l=f;m=f;while(1){w=i+(x<<3)|0;p=+g[w>>2];q=+g[l>>2];h=i+(x<<3)+4|0;A=+g[h>>2];o=+g[l+4>>2];n=p*q-A*o;o=q*A+p*o;t=i+(e<<3)|0;p=+g[t>>2];A=+g[m>>2];u=i+(e<<3)+4|0;q=+g[u>>2];y=+g[m+4>>2];z=p*A-q*y;y=A*q+p*y;a=i+(b<<3)|0;p=+g[a>>2];q=+g[f>>2];C=i+(b<<3)+4|0;A=+g[C>>2];B=+g[f+4>>2];E=p*q-A*B;B=q*A+p*B;p=+g[i>>2];A=p-z;v=i+4|0;q=+g[v>>2];D=q-y;p=z+p;g[i>>2]=p;q=y+q;g[v>>2]=q;y=n+E;z=o+B;E=n-E;B=o-B;g[t>>2]=p-y;g[u>>2]=q-z;g[i>>2]=y+ +g[i>>2];g[v>>2]=z+ +g[v>>2];g[w>>2]=A-B;g[h>>2]=D+E;g[a>>2]=A+B;g[C>>2]=D-E;j=j+-1|0;if(!j)break;else{i=i+8|0;l=l+(d<<3)|0;m=m+(r<<3)|0;f=f+(s<<3)|0}}return}}case 5:{C=Q(x,d)|0;n=+g[h+264+(C<<3)>>2];o=+g[h+264+(C<<3)+4>>2];C=Q(x,d<<1)|0;p=+g[h+264+(C<<3)>>2];q=+g[h+264+(C<<3)+4>>2];if((x|0)<=0)return;j=d*3|0;l=a;m=a+(x<<3)|0;e=a+(x<<1<<3)|0;b=a+(x*3<<3)|0;f=a+(x<<2<<3)|0;i=0;while(1){H=+g[l>>2];u=l+4|0;F=+g[u>>2];A=+g[m>>2];t=Q(i,d)|0;D=+g[h+264+(t<<3)>>2];v=m+4|0;M=+g[v>>2];I=+g[h+264+(t<<3)+4>>2];G=A*D-M*I;I=D*M+A*I;A=+g[e>>2];t=Q(i<<1,d)|0;M=+g[h+264+(t<<3)>>2];a=e+4|0;D=+g[a>>2];L=+g[h+264+(t<<3)+4>>2];J=A*M-D*L;L=M*D+A*L;A=+g[b>>2];t=Q(j,i)|0;D=+g[h+264+(t<<3)>>2];C=b+4|0;M=+g[C>>2];y=+g[h+264+(t<<3)+4>>2];E=A*D-M*y;y=D*M+A*y;A=+g[f>>2];t=Q(i<<2,d)|0;M=+g[h+264+(t<<3)>>2];w=f+4|0;D=+g[w>>2];B=+g[h+264+(t<<3)+4>>2];z=A*M-D*B;B=M*D+A*B;A=G+z;D=I+B;z=G-z;B=I-B;I=J+E;G=L+y;E=J-E;y=L-y;g[l>>2]=H+(I+A);g[u>>2]=F+(G+D);L=p*I+(H+n*A);J=p*G+(F+n*D);M=q*y+o*B;K=-(o*z)-q*E;g[m>>2]=L-M;g[v>>2]=J-K;g[f>>2]=M+L;g[w>>2]=K+J;A=n*I+(H+p*A);D=n*G+(F+p*D);B=o*y-q*B;E=q*z-o*E;g[e>>2]=B+A;g[a>>2]=E+D;g[b>>2]=A-B;g[C>>2]=D-E;i=i+1|0;if((i|0)==(x|0))break;else{l=l+8|0;m=m+8|0;e=e+8|0;b=b+8|0;f=f+8|0}}return}default:{t=c[h>>2]|0;v=tb(w<<3)|0;a:do if((x|0)>0?(w|0)>0:0){if((w|0)>1)u=0;else{m=0;while(1){f=m;i=0;while(1){h=a+(f<<3)|0;d=c[h+4>>2]|0;C=v+(i<<3)|0;c[C>>2]=c[h>>2];c[C+4>>2]=d;i=i+1|0;if((i|0)==(w|0))break;else f=f+x|0}i=v;f=c[i>>2]|0;i=c[i+4>>2]|0;j=m;l=0;while(1){C=a+(j<<3)|0;c[C>>2]=f;c[C+4>>2]=i;l=l+1|0;if((l|0)==(w|0))break;else j=j+x|0}m=m+1|0;if((m|0)==(x|0))break a}}do{f=u;i=0;while(1){r=a+(f<<3)|0;s=c[r+4>>2]|0;C=v+(i<<3)|0;c[C>>2]=c[r>>2];c[C+4>>2]=s;i=i+1|0;if((i|0)==(w|0))break;else f=f+x|0}i=v;f=c[i>>2]|0;i=c[i+4>>2]|0;n=(c[k>>2]=f,+g[k>>2]);e=u;r=0;while(1){j=a+(e<<3)|0;l=j;c[l>>2]=f;c[l+4>>2]=i;l=Q(e,d)|0;m=a+(e<<3)+4|0;o=n;p=+g[m>>2];b=1;s=0;do{C=s+l|0;s=C-((C|0)<(t|0)?0:t)|0;L=+g[v+(b<<3)>>2];J=+g[h+264+(s<<3)>>2];K=+g[v+(b<<3)+4>>2];M=+g[h+264+(s<<3)+4>>2];o=o+(L*J-K*M);g[j>>2]=o;p=p+(J*K+L*M);g[m>>2]=p;b=b+1|0}while((b|0)!=(w|0));r=r+1|0;if((r|0)==(w|0))break;else e=e+x|0}u=u+1|0}while((u|0)!=(x|0))}while(0);ub(v);return}}}function hb(a,b,d){a=a|0;b=b|0;d=d|0;if((b|0)==(d|0)){d=tb(c[a>>2]<<3)|0;gb(d,b,1,1,a+8|0,a);Yb(b|0,d|0,c[a>>2]<<3|0)|0;ub(d);return}else{gb(d,b,1,1,a+8|0,a);return}}function ib(a){a=a|0;var b=0,d=0;b=i;i=i+16|0;d=b;c[d>>2]=c[a+60>>2];a=jb(ga(6,d|0)|0)|0;i=b;return a|0}function jb(a){a=a|0;if(a>>>0>4294963200){c[(kb()|0)>>2]=0-a;a=-1}return a|0}function kb(){var a=0;if(!(c[146]|0))a=628;else a=c[(_b()|0)+64>>2]|0;return a|0}function lb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;q=i;i=i+48|0;n=q+16|0;m=q;e=q+32|0;o=a+28|0;f=c[o>>2]|0;c[e>>2]=f;p=a+20|0;f=(c[p>>2]|0)-f|0;c[e+4>>2]=f;c[e+8>>2]=b;c[e+12>>2]=d;k=a+60|0;l=a+44|0;b=2;f=f+d|0;while(1){if(!(c[146]|0)){c[n>>2]=c[k>>2];c[n+4>>2]=e;c[n+8>>2]=b;h=jb(ja(146,n|0)|0)|0}else{fa(8,a|0);c[m>>2]=c[k>>2];c[m+4>>2]=e;c[m+8>>2]=b;h=jb(ja(146,m|0)|0)|0;aa(0)}if((f|0)==(h|0)){f=6;break}if((h|0)<0){f=8;break}f=f-h|0;g=c[e+4>>2]|0;if(h>>>0<=g>>>0)if((b|0)==2){c[o>>2]=(c[o>>2]|0)+h;j=g;b=2}else j=g;else{j=c[l>>2]|0;c[o>>2]=j;c[p>>2]=j;j=c[e+12>>2]|0;h=h-g|0;e=e+8|0;b=b+-1|0}c[e>>2]=(c[e>>2]|0)+h;c[e+4>>2]=j-h}if((f|0)==6){n=c[l>>2]|0;c[a+16>>2]=n+(c[a+48>>2]|0);a=n;c[o>>2]=a;c[p>>2]=a}else if((f|0)==8){c[a+16>>2]=0;c[o>>2]=0;c[p>>2]=0;c[a>>2]=c[a>>2]|32;if((b|0)==2)d=0;else d=d-(c[e+4>>2]|0)|0}i=q;return d|0}function mb(a){a=a|0;if(!(c[a+68>>2]|0))nb(a);return}function nb(a){a=a|0;return}function ob(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;f=i;i=i+32|0;g=f;e=f+20|0;c[g>>2]=c[a+60>>2];c[g+4>>2]=0;c[g+8>>2]=b;c[g+12>>2]=e;c[g+16>>2]=d;if((jb(ia(140,g|0)|0)|0)<0){c[e>>2]=-1;a=-1}else a=c[e>>2]|0;i=f;return a|0}function pb(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0;g=i;i=i+80|0;f=g;c[b+36>>2]=4;if((c[b>>2]&64|0)==0?(c[f>>2]=c[b+60>>2],c[f+4>>2]=21505,c[f+8>>2]=g+12,ba(54,f|0)|0):0)a[b+75>>0]=-1;f=lb(b,d,e)|0;i=g;return f|0}function qb(a){a=a|0;return 0}function rb(a){a=a|0;var b=0,d=0;do if(a){if((c[a+76>>2]|0)<=-1){b=sb(a)|0;break}d=(qb(a)|0)==0;b=sb(a)|0;if(!d)nb(a)}else{if(!(c[50]|0))b=0;else b=rb(c[50]|0)|0;da(612);a=c[152]|0;if(a)do{if((c[a+76>>2]|0)>-1)d=qb(a)|0;else d=0;if((c[a+20>>2]|0)>>>0>(c[a+28>>2]|0)>>>0)b=sb(a)|0|b;if(d|0)nb(a);a=c[a+56>>2]|0}while((a|0)!=0);ma(612)}while(0);return b|0}function sb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=a+20|0;g=a+28|0;if((c[b>>2]|0)>>>0>(c[g>>2]|0)>>>0?(ta[c[a+36>>2]&7](a,0,0)|0,(c[b>>2]|0)==0):0)b=-1;else{h=a+4|0;d=c[h>>2]|0;e=a+8|0;f=c[e>>2]|0;if(d>>>0<f>>>0)ta[c[a+40>>2]&7](a,d-f|0,1)|0;c[a+16>>2]=0;c[g>>2]=0;c[b>>2]=0;c[e>>2]=0;c[h>>2]=0;b=0}return b|0}function tb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;O=i;i=i+16|0;p=O;do if(a>>>0<245){q=a>>>0<11?16:a+11&-8;a=q>>>3;k=c[158]|0;b=k>>>a;if(b&3|0){b=(b&1^1)+a|0;d=672+(b<<1<<2)|0;e=d+8|0;f=c[e>>2]|0;g=f+8|0;h=c[g>>2]|0;do if((d|0)!=(h|0)){if(h>>>0<(c[162]|0)>>>0)ea();a=h+12|0;if((c[a>>2]|0)==(f|0)){c[a>>2]=d;c[e>>2]=h;break}else ea()}else c[158]=k&~(1<<b);while(0);N=b<<3;c[f+4>>2]=N|3;N=f+N+4|0;c[N>>2]=c[N>>2]|1;N=g;i=O;return N|0}h=c[160]|0;if(q>>>0>h>>>0){if(b|0){d=2<<a;d=b<<a&(d|0-d);d=(d&0-d)+-1|0;j=d>>>12&16;d=d>>>j;f=d>>>5&8;d=d>>>f;g=d>>>2&4;d=d>>>g;e=d>>>1&2;d=d>>>e;b=d>>>1&1;b=(f|j|g|e|b)+(d>>>b)|0;d=672+(b<<1<<2)|0;e=d+8|0;g=c[e>>2]|0;j=g+8|0;f=c[j>>2]|0;do if((d|0)!=(f|0)){if(f>>>0<(c[162]|0)>>>0)ea();a=f+12|0;if((c[a>>2]|0)==(g|0)){c[a>>2]=d;c[e>>2]=f;l=c[160]|0;break}else ea()}else{c[158]=k&~(1<<b);l=h}while(0);h=(b<<3)-q|0;c[g+4>>2]=q|3;e=g+q|0;c[e+4>>2]=h|1;c[e+h>>2]=h;if(l|0){f=c[163]|0;b=l>>>3;d=672+(b<<1<<2)|0;a=c[158]|0;b=1<<b;if(a&b){a=d+8|0;b=c[a>>2]|0;if(b>>>0<(c[162]|0)>>>0)ea();else{m=a;n=b}}else{c[158]=a|b;m=d+8|0;n=d}c[m>>2]=f;c[n+12>>2]=f;c[f+8>>2]=n;c[f+12>>2]=d}c[160]=h;c[163]=e;N=j;i=O;return N|0}a=c[159]|0;if(a){d=(a&0-a)+-1|0;M=d>>>12&16;d=d>>>M;L=d>>>5&8;d=d>>>L;N=d>>>2&4;d=d>>>N;b=d>>>1&2;d=d>>>b;e=d>>>1&1;e=c[936+((L|M|N|b|e)+(d>>>e)<<2)>>2]|0;d=(c[e+4>>2]&-8)-q|0;b=e;while(1){a=c[b+16>>2]|0;if(!a){a=c[b+20>>2]|0;if(!a){k=e;break}}b=(c[a+4>>2]&-8)-q|0;N=b>>>0<d>>>0;d=N?b:d;b=a;e=N?a:e}g=c[162]|0;if(k>>>0<g>>>0)ea();j=k+q|0;if(k>>>0>=j>>>0)ea();h=c[k+24>>2]|0;e=c[k+12>>2]|0;do if((e|0)==(k|0)){b=k+20|0;a=c[b>>2]|0;if(!a){b=k+16|0;a=c[b>>2]|0;if(!a){o=0;break}}while(1){e=a+20|0;f=c[e>>2]|0;if(f|0){a=f;b=e;continue}e=a+16|0;f=c[e>>2]|0;if(!f)break;else{a=f;b=e}}if(b>>>0<g>>>0)ea();else{c[b>>2]=0;o=a;break}}else{f=c[k+8>>2]|0;if(f>>>0<g>>>0)ea();a=f+12|0;if((c[a>>2]|0)!=(k|0))ea();b=e+8|0;if((c[b>>2]|0)==(k|0)){c[a>>2]=e;c[b>>2]=f;o=e;break}else ea()}while(0);do if(h|0){a=c[k+28>>2]|0;b=936+(a<<2)|0;if((k|0)==(c[b>>2]|0)){c[b>>2]=o;if(!o){c[159]=c[159]&~(1<<a);break}}else{if(h>>>0<(c[162]|0)>>>0)ea();a=h+16|0;if((c[a>>2]|0)==(k|0))c[a>>2]=o;else c[h+20>>2]=o;if(!o)break}b=c[162]|0;if(o>>>0<b>>>0)ea();c[o+24>>2]=h;a=c[k+16>>2]|0;do if(a|0)if(a>>>0<b>>>0)ea();else{c[o+16>>2]=a;c[a+24>>2]=o;break}while(0);a=c[k+20>>2]|0;if(a|0)if(a>>>0<(c[162]|0)>>>0)ea();else{c[o+20>>2]=a;c[a+24>>2]=o;break}}while(0);if(d>>>0<16){N=d+q|0;c[k+4>>2]=N|3;N=k+N+4|0;c[N>>2]=c[N>>2]|1}else{c[k+4>>2]=q|3;c[j+4>>2]=d|1;c[j+d>>2]=d;a=c[160]|0;if(a|0){f=c[163]|0;b=a>>>3;e=672+(b<<1<<2)|0;a=c[158]|0;b=1<<b;if(a&b){a=e+8|0;b=c[a>>2]|0;if(b>>>0<(c[162]|0)>>>0)ea();else{r=a;s=b}}else{c[158]=a|b;r=e+8|0;s=e}c[r>>2]=f;c[s+12>>2]=f;c[f+8>>2]=s;c[f+12>>2]=e}c[160]=d;c[163]=j}N=k+8|0;i=O;return N|0}}}else if(a>>>0<=4294967231){a=a+11|0;q=a&-8;k=c[159]|0;if(k){d=0-q|0;a=a>>>8;if(a)if(q>>>0>16777215)j=31;else{s=(a+1048320|0)>>>16&8;G=a<<s;r=(G+520192|0)>>>16&4;G=G<<r;j=(G+245760|0)>>>16&2;j=14-(r|s|j)+(G<<j>>>15)|0;j=q>>>(j+7|0)&1|j<<1}else j=0;b=c[936+(j<<2)>>2]|0;a:do if(!b){a=0;b=0;G=86}else{f=d;a=0;g=q<<((j|0)==31?0:25-(j>>>1)|0);h=b;b=0;while(1){e=c[h+4>>2]&-8;d=e-q|0;if(d>>>0<f>>>0)if((e|0)==(q|0)){a=h;b=h;G=90;break a}else b=h;else d=f;e=c[h+20>>2]|0;h=c[h+16+(g>>>31<<2)>>2]|0;a=(e|0)==0|(e|0)==(h|0)?a:e;e=(h|0)==0;if(e){G=86;break}else{f=d;g=g<<(e&1^1)}}}while(0);if((G|0)==86){if((a|0)==0&(b|0)==0){a=2<<j;a=k&(a|0-a);if(!a)break;s=(a&0-a)+-1|0;n=s>>>12&16;s=s>>>n;m=s>>>5&8;s=s>>>m;o=s>>>2&4;s=s>>>o;r=s>>>1&2;s=s>>>r;a=s>>>1&1;a=c[936+((m|n|o|r|a)+(s>>>a)<<2)>>2]|0}if(!a){j=d;k=b}else G=90}if((G|0)==90)while(1){G=0;s=(c[a+4>>2]&-8)-q|0;e=s>>>0<d>>>0;d=e?s:d;b=e?a:b;e=c[a+16>>2]|0;if(e|0){a=e;G=90;continue}a=c[a+20>>2]|0;if(!a){j=d;k=b;break}else G=90}if((k|0)!=0?j>>>0<((c[160]|0)-q|0)>>>0:0){f=c[162]|0;if(k>>>0<f>>>0)ea();h=k+q|0;if(k>>>0>=h>>>0)ea();g=c[k+24>>2]|0;d=c[k+12>>2]|0;do if((d|0)==(k|0)){b=k+20|0;a=c[b>>2]|0;if(!a){b=k+16|0;a=c[b>>2]|0;if(!a){u=0;break}}while(1){d=a+20|0;e=c[d>>2]|0;if(e|0){a=e;b=d;continue}d=a+16|0;e=c[d>>2]|0;if(!e)break;else{a=e;b=d}}if(b>>>0<f>>>0)ea();else{c[b>>2]=0;u=a;break}}else{e=c[k+8>>2]|0;if(e>>>0<f>>>0)ea();a=e+12|0;if((c[a>>2]|0)!=(k|0))ea();b=d+8|0;if((c[b>>2]|0)==(k|0)){c[a>>2]=d;c[b>>2]=e;u=d;break}else ea()}while(0);do if(g|0){a=c[k+28>>2]|0;b=936+(a<<2)|0;if((k|0)==(c[b>>2]|0)){c[b>>2]=u;if(!u){c[159]=c[159]&~(1<<a);break}}else{if(g>>>0<(c[162]|0)>>>0)ea();a=g+16|0;if((c[a>>2]|0)==(k|0))c[a>>2]=u;else c[g+20>>2]=u;if(!u)break}b=c[162]|0;if(u>>>0<b>>>0)ea();c[u+24>>2]=g;a=c[k+16>>2]|0;do if(a|0)if(a>>>0<b>>>0)ea();else{c[u+16>>2]=a;c[a+24>>2]=u;break}while(0);a=c[k+20>>2]|0;if(a|0)if(a>>>0<(c[162]|0)>>>0)ea();else{c[u+20>>2]=a;c[a+24>>2]=u;break}}while(0);do if(j>>>0>=16){c[k+4>>2]=q|3;c[h+4>>2]=j|1;c[h+j>>2]=j;a=j>>>3;if(j>>>0<256){d=672+(a<<1<<2)|0;b=c[158]|0;a=1<<a;if(b&a){a=d+8|0;b=c[a>>2]|0;if(b>>>0<(c[162]|0)>>>0)ea();else{w=a;x=b}}else{c[158]=b|a;w=d+8|0;x=d}c[w>>2]=h;c[x+12>>2]=h;c[h+8>>2]=x;c[h+12>>2]=d;break}a=j>>>8;if(a)if(j>>>0>16777215)d=31;else{M=(a+1048320|0)>>>16&8;N=a<<M;L=(N+520192|0)>>>16&4;N=N<<L;d=(N+245760|0)>>>16&2;d=14-(L|M|d)+(N<<d>>>15)|0;d=j>>>(d+7|0)&1|d<<1}else d=0;e=936+(d<<2)|0;c[h+28>>2]=d;a=h+16|0;c[a+4>>2]=0;c[a>>2]=0;a=c[159]|0;b=1<<d;if(!(a&b)){c[159]=a|b;c[e>>2]=h;c[h+24>>2]=e;c[h+12>>2]=h;c[h+8>>2]=h;break}f=j<<((d|0)==31?0:25-(d>>>1)|0);a=c[e>>2]|0;while(1){if((c[a+4>>2]&-8|0)==(j|0)){d=a;G=148;break}b=a+16+(f>>>31<<2)|0;d=c[b>>2]|0;if(!d){G=145;break}else{f=f<<1;a=d}}if((G|0)==145)if(b>>>0<(c[162]|0)>>>0)ea();else{c[b>>2]=h;c[h+24>>2]=a;c[h+12>>2]=h;c[h+8>>2]=h;break}else if((G|0)==148){a=d+8|0;b=c[a>>2]|0;N=c[162]|0;if(b>>>0>=N>>>0&d>>>0>=N>>>0){c[b+12>>2]=h;c[a>>2]=h;c[h+8>>2]=b;c[h+12>>2]=d;c[h+24>>2]=0;break}else ea()}}else{N=j+q|0;c[k+4>>2]=N|3;N=k+N+4|0;c[N>>2]=c[N>>2]|1}while(0);N=k+8|0;i=O;return N|0}}}else q=-1;while(0);d=c[160]|0;if(d>>>0>=q>>>0){a=d-q|0;b=c[163]|0;if(a>>>0>15){N=b+q|0;c[163]=N;c[160]=a;c[N+4>>2]=a|1;c[N+a>>2]=a;c[b+4>>2]=q|3}else{c[160]=0;c[163]=0;c[b+4>>2]=d|3;N=b+d+4|0;c[N>>2]=c[N>>2]|1}N=b+8|0;i=O;return N|0}a=c[161]|0;if(a>>>0>q>>>0){L=a-q|0;c[161]=L;N=c[164]|0;M=N+q|0;c[164]=M;c[M+4>>2]=L|1;c[N+4>>2]=q|3;N=N+8|0;i=O;return N|0}if(!(c[276]|0)){c[278]=4096;c[277]=4096;c[279]=-1;c[280]=-1;c[281]=0;c[269]=0;x=p&-16^1431655768;c[p>>2]=x;c[276]=x}h=q+48|0;g=c[278]|0;j=q+47|0;f=g+j|0;g=0-g|0;k=f&g;if(k>>>0<=q>>>0){N=0;i=O;return N|0}a=c[268]|0;if(a|0?(w=c[266]|0,x=w+k|0,x>>>0<=w>>>0|x>>>0>a>>>0):0){N=0;i=O;return N|0}b:do if(!(c[269]&4)){a=c[164]|0;c:do if(a){d=1080;while(1){b=c[d>>2]|0;if(b>>>0<=a>>>0?(t=d+4|0,(b+(c[t>>2]|0)|0)>>>0>a>>>0):0){e=d;d=t;break}d=c[d+8>>2]|0;if(!d){G=171;break c}}a=f-(c[161]|0)&g;if(a>>>0<2147483647){b=ha(a|0)|0;if((b|0)==((c[e>>2]|0)+(c[d>>2]|0)|0)){if((b|0)!=(-1|0)){h=b;f=a;G=191;break b}}else G=181}}else G=171;while(0);do if((G|0)==171?(v=ha(0)|0,(v|0)!=(-1|0)):0){a=v;b=c[277]|0;d=b+-1|0;if(!(d&a))a=k;else a=k-a+(d+a&0-b)|0;b=c[266]|0;d=b+a|0;if(a>>>0>q>>>0&a>>>0<2147483647){x=c[268]|0;if(x|0?d>>>0<=b>>>0|d>>>0>x>>>0:0)break;b=ha(a|0)|0;if((b|0)==(v|0)){h=v;f=a;G=191;break b}else G=181}}while(0);d:do if((G|0)==181){d=0-a|0;do if(h>>>0>a>>>0&(a>>>0<2147483647&(b|0)!=(-1|0))?(y=c[278]|0,y=j-a+y&0-y,y>>>0<2147483647):0)if((ha(y|0)|0)==(-1|0)){ha(d|0)|0;break d}else{a=y+a|0;break}while(0);if((b|0)!=(-1|0)){h=b;f=a;G=191;break b}}while(0);c[269]=c[269]|4;G=188}else G=188;while(0);if((((G|0)==188?k>>>0<2147483647:0)?(z=ha(k|0)|0,A=ha(0)|0,z>>>0<A>>>0&((z|0)!=(-1|0)&(A|0)!=(-1|0))):0)?(B=A-z|0,B>>>0>(q+40|0)>>>0):0){h=z;f=B;G=191}if((G|0)==191){a=(c[266]|0)+f|0;c[266]=a;if(a>>>0>(c[267]|0)>>>0)c[267]=a;j=c[164]|0;do if(j){e=1080;do{a=c[e>>2]|0;b=e+4|0;d=c[b>>2]|0;if((h|0)==(a+d|0)){C=a;D=b;E=d;F=e;G=201;break}e=c[e+8>>2]|0}while((e|0)!=0);if(((G|0)==201?(c[F+12>>2]&8|0)==0:0)?j>>>0<h>>>0&j>>>0>=C>>>0:0){c[D>>2]=E+f;N=j+8|0;N=(N&7|0)==0?0:0-N&7;M=j+N|0;N=f-N+(c[161]|0)|0;c[164]=M;c[161]=N;c[M+4>>2]=N|1;c[M+N+4>>2]=40;c[165]=c[280];break}a=c[162]|0;if(h>>>0<a>>>0){c[162]=h;k=h}else k=a;d=h+f|0;a=1080;while(1){if((c[a>>2]|0)==(d|0)){b=a;G=209;break}a=c[a+8>>2]|0;if(!a){b=1080;break}}if((G|0)==209)if(!(c[a+12>>2]&8)){c[b>>2]=h;m=a+4|0;c[m>>2]=(c[m>>2]|0)+f;m=h+8|0;m=h+((m&7|0)==0?0:0-m&7)|0;a=d+8|0;a=d+((a&7|0)==0?0:0-a&7)|0;l=m+q|0;g=a-m-q|0;c[m+4>>2]=q|3;do if((a|0)!=(j|0)){if((a|0)==(c[163]|0)){N=(c[160]|0)+g|0;c[160]=N;c[163]=l;c[l+4>>2]=N|1;c[l+N>>2]=N;break}b=c[a+4>>2]|0;if((b&3|0)==1){j=b&-8;f=b>>>3;e:do if(b>>>0>=256){h=c[a+24>>2]|0;e=c[a+12>>2]|0;do if((e|0)==(a|0)){d=a+16|0;e=d+4|0;b=c[e>>2]|0;if(!b){b=c[d>>2]|0;if(!b){L=0;break}}else d=e;while(1){e=b+20|0;f=c[e>>2]|0;if(f|0){b=f;d=e;continue}e=b+16|0;f=c[e>>2]|0;if(!f)break;else{b=f;d=e}}if(d>>>0<k>>>0)ea();else{c[d>>2]=0;L=b;break}}else{f=c[a+8>>2]|0;if(f>>>0<k>>>0)ea();b=f+12|0;if((c[b>>2]|0)!=(a|0))ea();d=e+8|0;if((c[d>>2]|0)==(a|0)){c[b>>2]=e;c[d>>2]=f;L=e;break}else ea()}while(0);if(!h)break;b=c[a+28>>2]|0;d=936+(b<<2)|0;do if((a|0)!=(c[d>>2]|0)){if(h>>>0<(c[162]|0)>>>0)ea();b=h+16|0;if((c[b>>2]|0)==(a|0))c[b>>2]=L;else c[h+20>>2]=L;if(!L)break e}else{c[d>>2]=L;if(L|0)break;c[159]=c[159]&~(1<<b);break e}while(0);e=c[162]|0;if(L>>>0<e>>>0)ea();c[L+24>>2]=h;b=a+16|0;d=c[b>>2]|0;do if(d|0)if(d>>>0<e>>>0)ea();else{c[L+16>>2]=d;c[d+24>>2]=L;break}while(0);b=c[b+4>>2]|0;if(!b)break;if(b>>>0<(c[162]|0)>>>0)ea();else{c[L+20>>2]=b;c[b+24>>2]=L;break}}else{d=c[a+8>>2]|0;e=c[a+12>>2]|0;b=672+(f<<1<<2)|0;do if((d|0)!=(b|0)){if(d>>>0<k>>>0)ea();if((c[d+12>>2]|0)==(a|0))break;ea()}while(0);if((e|0)==(d|0)){c[158]=c[158]&~(1<<f);break}do if((e|0)==(b|0))I=e+8|0;else{if(e>>>0<k>>>0)ea();b=e+8|0;if((c[b>>2]|0)==(a|0)){I=b;break}ea()}while(0);c[d+12>>2]=e;c[I>>2]=d}while(0);a=a+j|0;g=j+g|0}a=a+4|0;c[a>>2]=c[a>>2]&-2;c[l+4>>2]=g|1;c[l+g>>2]=g;a=g>>>3;if(g>>>0<256){d=672+(a<<1<<2)|0;b=c[158]|0;a=1<<a;do if(!(b&a)){c[158]=b|a;M=d+8|0;N=d}else{a=d+8|0;b=c[a>>2]|0;if(b>>>0>=(c[162]|0)>>>0){M=a;N=b;break}ea()}while(0);c[M>>2]=l;c[N+12>>2]=l;c[l+8>>2]=N;c[l+12>>2]=d;break}a=g>>>8;do if(!a)d=0;else{if(g>>>0>16777215){d=31;break}M=(a+1048320|0)>>>16&8;N=a<<M;L=(N+520192|0)>>>16&4;N=N<<L;d=(N+245760|0)>>>16&2;d=14-(L|M|d)+(N<<d>>>15)|0;d=g>>>(d+7|0)&1|d<<1}while(0);e=936+(d<<2)|0;c[l+28>>2]=d;a=l+16|0;c[a+4>>2]=0;c[a>>2]=0;a=c[159]|0;b=1<<d;if(!(a&b)){c[159]=a|b;c[e>>2]=l;c[l+24>>2]=e;c[l+12>>2]=l;c[l+8>>2]=l;break}f=g<<((d|0)==31?0:25-(d>>>1)|0);a=c[e>>2]|0;while(1){if((c[a+4>>2]&-8|0)==(g|0)){d=a;G=279;break}b=a+16+(f>>>31<<2)|0;d=c[b>>2]|0;if(!d){G=276;break}else{f=f<<1;a=d}}if((G|0)==276)if(b>>>0<(c[162]|0)>>>0)ea();else{c[b>>2]=l;c[l+24>>2]=a;c[l+12>>2]=l;c[l+8>>2]=l;break}else if((G|0)==279){a=d+8|0;b=c[a>>2]|0;N=c[162]|0;if(b>>>0>=N>>>0&d>>>0>=N>>>0){c[b+12>>2]=l;c[a>>2]=l;c[l+8>>2]=b;c[l+12>>2]=d;c[l+24>>2]=0;break}else ea()}}else{N=(c[161]|0)+g|0;c[161]=N;c[164]=l;c[l+4>>2]=N|1}while(0);N=m+8|0;i=O;return N|0}else b=1080;while(1){a=c[b>>2]|0;if(a>>>0<=j>>>0?(H=a+(c[b+4>>2]|0)|0,H>>>0>j>>>0):0){b=H;break}b=c[b+8>>2]|0}g=b+-47|0;d=g+8|0;d=g+((d&7|0)==0?0:0-d&7)|0;g=j+16|0;d=d>>>0<g>>>0?j:d;a=d+8|0;e=h+8|0;e=(e&7|0)==0?0:0-e&7;N=h+e|0;e=f+-40-e|0;c[164]=N;c[161]=e;c[N+4>>2]=e|1;c[N+e+4>>2]=40;c[165]=c[280];e=d+4|0;c[e>>2]=27;c[a>>2]=c[270];c[a+4>>2]=c[271];c[a+8>>2]=c[272];c[a+12>>2]=c[273];c[270]=h;c[271]=f;c[273]=0;c[272]=a;a=d+24|0;do{a=a+4|0;c[a>>2]=7}while((a+4|0)>>>0<b>>>0);if((d|0)!=(j|0)){h=d-j|0;c[e>>2]=c[e>>2]&-2;c[j+4>>2]=h|1;c[d>>2]=h;a=h>>>3;if(h>>>0<256){d=672+(a<<1<<2)|0;b=c[158]|0;a=1<<a;if(b&a){a=d+8|0;b=c[a>>2]|0;if(b>>>0<(c[162]|0)>>>0)ea();else{J=a;K=b}}else{c[158]=b|a;J=d+8|0;K=d}c[J>>2]=j;c[K+12>>2]=j;c[j+8>>2]=K;c[j+12>>2]=d;break}a=h>>>8;if(a)if(h>>>0>16777215)d=31;else{M=(a+1048320|0)>>>16&8;N=a<<M;L=(N+520192|0)>>>16&4;N=N<<L;d=(N+245760|0)>>>16&2;d=14-(L|M|d)+(N<<d>>>15)|0;d=h>>>(d+7|0)&1|d<<1}else d=0;f=936+(d<<2)|0;c[j+28>>2]=d;c[j+20>>2]=0;c[g>>2]=0;a=c[159]|0;b=1<<d;if(!(a&b)){c[159]=a|b;c[f>>2]=j;c[j+24>>2]=f;c[j+12>>2]=j;c[j+8>>2]=j;break}e=h<<((d|0)==31?0:25-(d>>>1)|0);a=c[f>>2]|0;while(1){if((c[a+4>>2]&-8|0)==(h|0)){d=a;G=305;break}b=a+16+(e>>>31<<2)|0;d=c[b>>2]|0;if(!d){G=302;break}else{e=e<<1;a=d}}if((G|0)==302)if(b>>>0<(c[162]|0)>>>0)ea();else{c[b>>2]=j;c[j+24>>2]=a;c[j+12>>2]=j;c[j+8>>2]=j;break}else if((G|0)==305){a=d+8|0;b=c[a>>2]|0;N=c[162]|0;if(b>>>0>=N>>>0&d>>>0>=N>>>0){c[b+12>>2]=j;c[a>>2]=j;c[j+8>>2]=b;c[j+12>>2]=d;c[j+24>>2]=0;break}else ea()}}}else{N=c[162]|0;if((N|0)==0|h>>>0<N>>>0)c[162]=h;c[270]=h;c[271]=f;c[273]=0;c[167]=c[276];c[166]=-1;a=0;do{N=672+(a<<1<<2)|0;c[N+12>>2]=N;c[N+8>>2]=N;a=a+1|0}while((a|0)!=32);N=h+8|0;N=(N&7|0)==0?0:0-N&7;M=h+N|0;N=f+-40-N|0;c[164]=M;c[161]=N;c[M+4>>2]=N|1;c[M+N+4>>2]=40;c[165]=c[280]}while(0);a=c[161]|0;if(a>>>0>q>>>0){L=a-q|0;c[161]=L;N=c[164]|0;M=N+q|0;c[164]=M;c[M+4>>2]=L|1;c[N+4>>2]=q|3;N=N+8|0;i=O;return N|0}}c[(kb()|0)>>2]=12;N=0;i=O;return N|0}function ub(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if(!a)return;d=a+-8|0;h=c[162]|0;if(d>>>0<h>>>0)ea();a=c[a+-4>>2]|0;b=a&3;if((b|0)==1)ea();e=a&-8;m=d+e|0;do if(!(a&1)){a=c[d>>2]|0;if(!b)return;k=d+(0-a)|0;j=a+e|0;if(k>>>0<h>>>0)ea();if((k|0)==(c[163]|0)){a=m+4|0;b=c[a>>2]|0;if((b&3|0)!=3){q=k;g=j;break}c[160]=j;c[a>>2]=b&-2;c[k+4>>2]=j|1;c[k+j>>2]=j;return}e=a>>>3;if(a>>>0<256){b=c[k+8>>2]|0;d=c[k+12>>2]|0;a=672+(e<<1<<2)|0;if((b|0)!=(a|0)){if(b>>>0<h>>>0)ea();if((c[b+12>>2]|0)!=(k|0))ea()}if((d|0)==(b|0)){c[158]=c[158]&~(1<<e);q=k;g=j;break}if((d|0)!=(a|0)){if(d>>>0<h>>>0)ea();a=d+8|0;if((c[a>>2]|0)==(k|0))f=a;else ea()}else f=d+8|0;c[b+12>>2]=d;c[f>>2]=b;q=k;g=j;break}f=c[k+24>>2]|0;d=c[k+12>>2]|0;do if((d|0)==(k|0)){b=k+16|0;d=b+4|0;a=c[d>>2]|0;if(!a){a=c[b>>2]|0;if(!a){i=0;break}}else b=d;while(1){d=a+20|0;e=c[d>>2]|0;if(e|0){a=e;b=d;continue}d=a+16|0;e=c[d>>2]|0;if(!e)break;else{a=e;b=d}}if(b>>>0<h>>>0)ea();else{c[b>>2]=0;i=a;break}}else{e=c[k+8>>2]|0;if(e>>>0<h>>>0)ea();a=e+12|0;if((c[a>>2]|0)!=(k|0))ea();b=d+8|0;if((c[b>>2]|0)==(k|0)){c[a>>2]=d;c[b>>2]=e;i=d;break}else ea()}while(0);if(f){a=c[k+28>>2]|0;b=936+(a<<2)|0;if((k|0)==(c[b>>2]|0)){c[b>>2]=i;if(!i){c[159]=c[159]&~(1<<a);q=k;g=j;break}}else{if(f>>>0<(c[162]|0)>>>0)ea();a=f+16|0;if((c[a>>2]|0)==(k|0))c[a>>2]=i;else c[f+20>>2]=i;if(!i){q=k;g=j;break}}d=c[162]|0;if(i>>>0<d>>>0)ea();c[i+24>>2]=f;a=k+16|0;b=c[a>>2]|0;do if(b|0)if(b>>>0<d>>>0)ea();else{c[i+16>>2]=b;c[b+24>>2]=i;break}while(0);a=c[a+4>>2]|0;if(a)if(a>>>0<(c[162]|0)>>>0)ea();else{c[i+20>>2]=a;c[a+24>>2]=i;q=k;g=j;break}else{q=k;g=j}}else{q=k;g=j}}else{q=d;g=e}while(0);if(q>>>0>=m>>>0)ea();a=m+4|0;b=c[a>>2]|0;if(!(b&1))ea();if(!(b&2)){if((m|0)==(c[164]|0)){p=(c[161]|0)+g|0;c[161]=p;c[164]=q;c[q+4>>2]=p|1;if((q|0)!=(c[163]|0))return;c[163]=0;c[160]=0;return}if((m|0)==(c[163]|0)){p=(c[160]|0)+g|0;c[160]=p;c[163]=q;c[q+4>>2]=p|1;c[q+p>>2]=p;return}g=(b&-8)+g|0;e=b>>>3;do if(b>>>0>=256){f=c[m+24>>2]|0;a=c[m+12>>2]|0;do if((a|0)==(m|0)){b=m+16|0;d=b+4|0;a=c[d>>2]|0;if(!a){a=c[b>>2]|0;if(!a){n=0;break}}else b=d;while(1){d=a+20|0;e=c[d>>2]|0;if(e|0){a=e;b=d;continue}d=a+16|0;e=c[d>>2]|0;if(!e)break;else{a=e;b=d}}if(b>>>0<(c[162]|0)>>>0)ea();else{c[b>>2]=0;n=a;break}}else{b=c[m+8>>2]|0;if(b>>>0<(c[162]|0)>>>0)ea();d=b+12|0;if((c[d>>2]|0)!=(m|0))ea();e=a+8|0;if((c[e>>2]|0)==(m|0)){c[d>>2]=a;c[e>>2]=b;n=a;break}else ea()}while(0);if(f|0){a=c[m+28>>2]|0;b=936+(a<<2)|0;if((m|0)==(c[b>>2]|0)){c[b>>2]=n;if(!n){c[159]=c[159]&~(1<<a);break}}else{if(f>>>0<(c[162]|0)>>>0)ea();a=f+16|0;if((c[a>>2]|0)==(m|0))c[a>>2]=n;else c[f+20>>2]=n;if(!n)break}d=c[162]|0;if(n>>>0<d>>>0)ea();c[n+24>>2]=f;a=m+16|0;b=c[a>>2]|0;do if(b|0)if(b>>>0<d>>>0)ea();else{c[n+16>>2]=b;c[b+24>>2]=n;break}while(0);a=c[a+4>>2]|0;if(a|0)if(a>>>0<(c[162]|0)>>>0)ea();else{c[n+20>>2]=a;c[a+24>>2]=n;break}}}else{b=c[m+8>>2]|0;d=c[m+12>>2]|0;a=672+(e<<1<<2)|0;if((b|0)!=(a|0)){if(b>>>0<(c[162]|0)>>>0)ea();if((c[b+12>>2]|0)!=(m|0))ea()}if((d|0)==(b|0)){c[158]=c[158]&~(1<<e);break}if((d|0)!=(a|0)){if(d>>>0<(c[162]|0)>>>0)ea();a=d+8|0;if((c[a>>2]|0)==(m|0))l=a;else ea()}else l=d+8|0;c[b+12>>2]=d;c[l>>2]=b}while(0);c[q+4>>2]=g|1;c[q+g>>2]=g;if((q|0)==(c[163]|0)){c[160]=g;return}}else{c[a>>2]=b&-2;c[q+4>>2]=g|1;c[q+g>>2]=g}a=g>>>3;if(g>>>0<256){d=672+(a<<1<<2)|0;b=c[158]|0;a=1<<a;if(b&a){a=d+8|0;b=c[a>>2]|0;if(b>>>0<(c[162]|0)>>>0)ea();else{o=a;p=b}}else{c[158]=b|a;o=d+8|0;p=d}c[o>>2]=q;c[p+12>>2]=q;c[q+8>>2]=p;c[q+12>>2]=d;return}a=g>>>8;if(a)if(g>>>0>16777215)d=31;else{o=(a+1048320|0)>>>16&8;p=a<<o;n=(p+520192|0)>>>16&4;p=p<<n;d=(p+245760|0)>>>16&2;d=14-(n|o|d)+(p<<d>>>15)|0;d=g>>>(d+7|0)&1|d<<1}else d=0;e=936+(d<<2)|0;c[q+28>>2]=d;c[q+20>>2]=0;c[q+16>>2]=0;a=c[159]|0;b=1<<d;do if(a&b){f=g<<((d|0)==31?0:25-(d>>>1)|0);a=c[e>>2]|0;while(1){if((c[a+4>>2]&-8|0)==(g|0)){d=a;e=130;break}b=a+16+(f>>>31<<2)|0;d=c[b>>2]|0;if(!d){e=127;break}else{f=f<<1;a=d}}if((e|0)==127)if(b>>>0<(c[162]|0)>>>0)ea();else{c[b>>2]=q;c[q+24>>2]=a;c[q+12>>2]=q;c[q+8>>2]=q;break}else if((e|0)==130){a=d+8|0;b=c[a>>2]|0;p=c[162]|0;if(b>>>0>=p>>>0&d>>>0>=p>>>0){c[b+12>>2]=q;c[a>>2]=q;c[q+8>>2]=b;c[q+12>>2]=d;c[q+24>>2]=0;break}else ea()}}else{c[159]=a|b;c[e>>2]=q;c[q+24>>2]=e;c[q+12>>2]=q;c[q+8>>2]=q}while(0);q=(c[166]|0)+-1|0;c[166]=q;if(!q)a=1088;else return;while(1){a=c[a>>2]|0;if(!a)break;else a=a+8|0}c[166]=-1;return}function vb(a){a=a|0;pa(304,327,304,400)}function wb(a){a=a|0;var b=0;b=(a|0)==0?1:a;while(1){a=tb(b)|0;if(a|0)break;a=Vb()|0;if(!a){a=0;break}xa[a&0]()}return a|0}function xb(a){a=a|0;return wb(a)|0}function yb(a){a=a|0;ub(a);return}function zb(a){a=a|0;yb(a);return}function Ab(a){a=a|0;return}function Bb(a){a=a|0;return}function Cb(a){a=a|0;yb(a);return}function Db(a){a=a|0;return}function Eb(a){a=a|0;return}function Fb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;h=i;i=i+64|0;g=h;if((a|0)!=(b|0))if((b|0)!=0?(f=Gb(b,48,16,0)|0,(f|0)!=0):0){b=g;e=b+56|0;do{c[b>>2]=0;b=b+4|0}while((b|0)<(e|0));c[g>>2]=f;c[g+8>>2]=a;c[g+12>>2]=-1;c[g+48>>2]=1;za[c[(c[f>>2]|0)+28>>2]&3](f,g,c[d>>2]|0,1);if((c[g+24>>2]|0)==1){c[d>>2]=c[g+16>>2];b=1}else b=0}else b=0;else b=1;i=h;return b|0}function Gb(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;r=i;i=i+64|0;q=r;p=c[d>>2]|0;o=d+(c[p+-8>>2]|0)|0;p=c[p+-4>>2]|0;c[q>>2]=f;c[q+4>>2]=d;c[q+8>>2]=e;c[q+12>>2]=g;l=q+16|0;g=q+20|0;d=q+24|0;e=q+28|0;h=q+32|0;j=q+40|0;k=(p|0)==(f|0);m=l;n=m+36|0;do{c[m>>2]=0;m=m+4|0}while((m|0)<(n|0));b[l+36>>1]=0;a[l+38>>0]=0;a:do if(k){c[q+48>>2]=1;ya[c[(c[f>>2]|0)+20>>2]&3](f,q,o,o,1,0);g=(c[d>>2]|0)==1?o:0}else{ua[c[(c[p>>2]|0)+24>>2]&3](p,q,o,1,0);switch(c[q+36>>2]|0){case 0:{g=(c[j>>2]|0)==1&(c[e>>2]|0)==1&(c[h>>2]|0)==1?c[g>>2]|0:0;break a}case 1:break;default:{g=0;break a}}if((c[d>>2]|0)!=1?!((c[j>>2]|0)==0&(c[e>>2]|0)==1&(c[h>>2]|0)==1):0){g=0;break}g=c[l>>2]|0}while(0);i=r;return g|0}function Hb(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;if((a|0)==(c[b+8>>2]|0))Ib(0,b,d,e,f);else{a=c[a+8>>2]|0;ya[c[(c[a>>2]|0)+20>>2]&3](a,b,d,e,f,g)}return}function Ib(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;a[d+53>>0]=1;do if((c[d+4>>2]|0)==(f|0)){a[d+52>>0]=1;f=d+16|0;b=c[f>>2]|0;if(!b){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((g|0)==1?(c[d+48>>2]|0)==1:0))break;a[d+54>>0]=1;break}if((b|0)!=(e|0)){g=d+36|0;c[g>>2]=(c[g>>2]|0)+1;a[d+54>>0]=1;break}b=d+24|0;f=c[b>>2]|0;if((f|0)==2){c[b>>2]=g;f=g}if((f|0)==1?(c[d+48>>2]|0)==1:0)a[d+54>>0]=1}while(0);return}function Jb(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;do if((b|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)==(e|0)?(h=d+28|0,(c[h>>2]|0)!=1):0)c[h>>2]=f}else{if((b|0)!=(c[d>>2]|0)){j=c[b+8>>2]|0;ua[c[(c[j>>2]|0)+24>>2]&3](j,d,e,f,g);break}if((c[d+16>>2]|0)!=(e|0)?(j=d+20|0,(c[j>>2]|0)!=(e|0)):0){c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4)break;h=d+52|0;a[h>>0]=0;f=d+53|0;a[f>>0]=0;b=c[b+8>>2]|0;ya[c[(c[b>>2]|0)+20>>2]&3](b,d,e,e,1,g);if(a[f>>0]|0)if(!(a[h>>0]|0)){h=1;f=13}else f=17;else{h=0;f=13}do if((f|0)==13){c[j>>2]=e;e=d+40|0;c[e>>2]=(c[e>>2]|0)+1;if((c[d+36>>2]|0)==1?(c[d+24>>2]|0)==2:0){a[d+54>>0]=1;if(h){f=17;break}else{h=4;break}}if(h)f=17;else h=4}while(0);if((f|0)==17)h=3;c[i>>2]=h;break}if((f|0)==1)c[d+32>>2]=1}while(0);return}function Kb(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;if((a|0)==(c[b+8>>2]|0))Lb(0,b,d,e);else{a=c[a+8>>2]|0;za[c[(c[a>>2]|0)+28>>2]&3](a,b,d,e)}return}function Lb(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;b=d+16|0;g=c[b>>2]|0;do if(g){if((g|0)!=(e|0)){f=d+36|0;c[f>>2]=(c[f>>2]|0)+1;c[d+24>>2]=2;a[d+54>>0]=1;break}b=d+24|0;if((c[b>>2]|0)==2)c[b>>2]=f}else{c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1}while(0);return}function Mb(a){a=a|0;yb(a);return}function Nb(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;if((a|0)==(c[b+8>>2]|0))Ib(0,b,d,e,f);return}function Ob(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0;do if((b|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)==(e|0)?(i=d+28|0,(c[i>>2]|0)!=1):0)c[i>>2]=f}else if((b|0)==(c[d>>2]|0)){if((c[d+16>>2]|0)!=(e|0)?(h=d+20|0,(c[h>>2]|0)!=(e|0)):0){c[d+32>>2]=f;c[h>>2]=e;g=d+40|0;c[g>>2]=(c[g>>2]|0)+1;if((c[d+36>>2]|0)==1?(c[d+24>>2]|0)==2:0)a[d+54>>0]=1;c[d+44>>2]=4;break}if((f|0)==1)c[d+32>>2]=1}while(0);return}function Pb(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;if((a|0)==(c[b+8>>2]|0))Lb(0,b,d,e);return}function Qb(a){a=a|0;return}function Rb(a){a=a|0;return}function Sb(a){a=a|0;yb(a);return}function Tb(a){a=a|0;return 564}function Ub(a){a=a|0;c[a>>2]=292;return}function Vb(){var a=0;a=c[282]|0;c[282]=a+0;return a|0}function Wb(){}function Xb(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;h=b&3;i=d|d<<8|d<<16|d<<24;g=f&~3;if(h){h=b+4-h|0;while((b|0)<(h|0)){a[b>>0]=d;b=b+1|0}}while((b|0)<(g|0)){c[b>>2]=i;b=b+4|0}}while((b|0)<(f|0)){a[b>>0]=d;b=b+1|0}return b-e|0}function Yb(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((e|0)>=4096)return ka(b|0,d|0,e|0)|0;f=b|0;if((b&3)==(d&3)){while(b&3){if(!e)return f|0;a[b>>0]=a[d>>0]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b>>0]=a[d>>0]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function Zb(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;if((c|0)<(b|0)&(b|0)<(c+d|0)){e=b;c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b>>0]=a[c>>0]|0}b=e}else Yb(b,c,d)|0;return b|0}function _b(){return 0}function $b(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return ta[a&7](b|0,c|0,d|0)|0}function ac(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ua[a&3](b|0,c|0,d|0,e|0,f|0)}function bc(a,b){a=a|0;b=b|0;va[a&15](b|0)}function cc(a,b){a=a|0;b=b|0;return wa[a&3](b|0)|0}function dc(a){a=a|0;xa[a&0]()}function ec(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;ya[a&3](b|0,c|0,d|0,e|0,f|0,g|0)}function fc(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;za[a&3](b|0,c|0,d|0,e|0)}function gc(a,b,c){a=a|0;b=b|0;c=c|0;T(0);return 0}function hc(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;T(1)}function ic(a){a=a|0;T(2)}function jc(a){a=a|0;T(3);return 0}function kc(){T(4)}function lc(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;T(5)}function mc(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;T(6)}

// EMSCRIPTEN_END_FUNCS
var ta=[gc,pb,ob,Fb,lb,gc,gc,gc];var ua=[hc,Ob,Jb,hc];var va=[ic,Ab,Mb,Db,Eb,Cb,Qb,Sb,mb,ic,ic,ic,ic,ic,ic,ic];var wa=[jc,ib,Tb,jc];var xa=[kc];var ya=[lc,Nb,Hb,lc];var za=[mc,Pb,Kb,mc];return{_Chromagram_getChromagram:La,_fflush:rb,_memmove:Zb,_ChordDetector_getRootNote:Pa,_pthread_self:_b,_Chromagram_destructor:Ia,_memset:Xb,_ChordDetector_constructor:Ma,_Chromagram_isReady:Ka,_malloc:tb,_Chromagram_constructor:Ha,_memcpy:Yb,_ChordDetector_destructor:Na,_ChordDetector_getQuality:Qa,_Chromagram_processAudioFrame:Ja,_free:ub,_ChordDetector_getIntervals:Ra,___errno_location:kb,_ChordDetector_detectChord:Oa,runPostSets:Wb,stackAlloc:Aa,stackSave:Ba,stackRestore:Ca,establishStackSpace:Da,setThrew:Ea,setTempRet0:Fa,getTempRet0:Ga,dynCall_iiii:$b,dynCall_viiiii:ac,dynCall_vi:bc,dynCall_ii:cc,dynCall_v:dc,dynCall_viiiiii:ec,dynCall_viiii:fc}})


// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg,Module.asmLibraryArg,buffer);var _Chromagram_getChromagram=Module["_Chromagram_getChromagram"]=asm["_Chromagram_getChromagram"];var _fflush=Module["_fflush"]=asm["_fflush"];var runPostSets=Module["runPostSets"]=asm["runPostSets"];var _memmove=Module["_memmove"]=asm["_memmove"];var _ChordDetector_getRootNote=Module["_ChordDetector_getRootNote"]=asm["_ChordDetector_getRootNote"];var _pthread_self=Module["_pthread_self"]=asm["_pthread_self"];var _Chromagram_destructor=Module["_Chromagram_destructor"]=asm["_Chromagram_destructor"];var _memset=Module["_memset"]=asm["_memset"];var _ChordDetector_constructor=Module["_ChordDetector_constructor"]=asm["_ChordDetector_constructor"];var _Chromagram_isReady=Module["_Chromagram_isReady"]=asm["_Chromagram_isReady"];var _malloc=Module["_malloc"]=asm["_malloc"];var _Chromagram_constructor=Module["_Chromagram_constructor"]=asm["_Chromagram_constructor"];var _memcpy=Module["_memcpy"]=asm["_memcpy"];var _ChordDetector_destructor=Module["_ChordDetector_destructor"]=asm["_ChordDetector_destructor"];var _ChordDetector_getQuality=Module["_ChordDetector_getQuality"]=asm["_ChordDetector_getQuality"];var _Chromagram_processAudioFrame=Module["_Chromagram_processAudioFrame"]=asm["_Chromagram_processAudioFrame"];var _free=Module["_free"]=asm["_free"];var _ChordDetector_getIntervals=Module["_ChordDetector_getIntervals"]=asm["_ChordDetector_getIntervals"];var ___errno_location=Module["___errno_location"]=asm["___errno_location"];var _ChordDetector_detectChord=Module["_ChordDetector_detectChord"]=asm["_ChordDetector_detectChord"];var dynCall_iiii=Module["dynCall_iiii"]=asm["dynCall_iiii"];var dynCall_viiiii=Module["dynCall_viiiii"]=asm["dynCall_viiiii"];var dynCall_vi=Module["dynCall_vi"]=asm["dynCall_vi"];var dynCall_ii=Module["dynCall_ii"]=asm["dynCall_ii"];var dynCall_v=Module["dynCall_v"]=asm["dynCall_v"];var dynCall_viiiiii=Module["dynCall_viiiiii"]=asm["dynCall_viiiiii"];var dynCall_viiii=Module["dynCall_viiii"]=asm["dynCall_viiii"];Runtime.stackAlloc=asm["stackAlloc"];Runtime.stackSave=asm["stackSave"];Runtime.stackRestore=asm["stackRestore"];Runtime.establishStackSpace=asm["establishStackSpace"];Runtime.setTempRet0=asm["setTempRet0"];Runtime.getTempRet0=asm["getTempRet0"];function ExitStatus(status){this.name="ExitStatus";this.message="Program terminated with exit("+status+")";this.status=status}ExitStatus.prototype=new Error;ExitStatus.prototype.constructor=ExitStatus;var initialStackTop;var preloadStartTime=null;var calledMain=false;dependenciesFulfilled=function runCaller(){if(!Module["calledRun"])run();if(!Module["calledRun"])dependenciesFulfilled=runCaller};Module["callMain"]=Module.callMain=function callMain(args){args=args||[];ensureInitRuntime();var argc=args.length+1;function pad(){for(var i=0;i<4-1;i++){argv.push(0)}}var argv=[allocate(intArrayFromString(Module["thisProgram"]),"i8",ALLOC_NORMAL)];pad();for(var i=0;i<argc-1;i=i+1){argv.push(allocate(intArrayFromString(args[i]),"i8",ALLOC_NORMAL));pad()}argv.push(0);argv=allocate(argv,"i32",ALLOC_NORMAL);try{var ret=Module["_main"](argc,argv,0);exit(ret,true)}catch(e){if(e instanceof ExitStatus){return}else if(e=="SimulateInfiniteLoop"){Module["noExitRuntime"]=true;return}else{if(e&&typeof e==="object"&&e.stack)Module.printErr("exception thrown: "+[e,e.stack]);throw e}}finally{calledMain=true}};function run(args){args=args||Module["arguments"];if(preloadStartTime===null)preloadStartTime=Date.now();if(runDependencies>0){return}preRun();if(runDependencies>0)return;if(Module["calledRun"])return;function doRun(){if(Module["calledRun"])return;Module["calledRun"]=true;if(ABORT)return;ensureInitRuntime();preMain();if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();if(Module["_main"]&&shouldRunNow)Module["callMain"](args);postRun()}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout((function(){setTimeout((function(){Module["setStatus"]("")}),1);doRun()}),1)}else{doRun()}}Module["run"]=Module.run=run;function exit(status,implicit){if(implicit&&Module["noExitRuntime"]){return}if(Module["noExitRuntime"]){}else{ABORT=true;EXITSTATUS=status;STACKTOP=initialStackTop;exitRuntime();if(Module["onExit"])Module["onExit"](status)}if(ENVIRONMENT_IS_NODE){process["exit"](status)}else if(ENVIRONMENT_IS_SHELL&&typeof quit==="function"){quit(status)}throw new ExitStatus(status)}Module["exit"]=Module.exit=exit;var abortDecorators=[];function abort(what){if(what!==undefined){Module.print(what);Module.printErr(what);what=JSON.stringify(what)}else{what=""}ABORT=true;EXITSTATUS=1;var extra="\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";var output="abort("+what+") at "+stackTrace()+extra;if(abortDecorators){abortDecorators.forEach((function(decorator){output=decorator(output,what)}))}throw output}Module["abort"]=Module.abort=abort;if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()()}}var shouldRunNow=true;if(Module["noInitialRun"]){shouldRunNow=false}run();function Chromagram(frameSize,samplingFrequency){this._ptr=Chromagram._constructor(frameSize,samplingFrequency)}Chromagram.prototype={_free:(function(){Chromagram._destructor(this._ptr)}),processAudioFrame:(function(channelData){var float64Arr=new Float64Array(channelData);var size=float64Arr.length*float64Arr.BYTES_PER_ELEMENT;var cArray=Module._malloc(size);Module.HEAPF64.set(float64Arr,cArray/float64Arr.BYTES_PER_ELEMENT);Chromagram._processAudioFrame(this._ptr,cArray);Module._free(cArray)}),isReady:(function(){return Chromagram._isReady(this._ptr)==1}),getChromagram:(function(){const dest=new Float64Array(12);const cArray=Module._malloc(dest.length*dest.BYTES_PER_ELEMENT);Chromagram._getChromagram(this._ptr,cArray);const startOffset=cArray/dest.BYTES_PER_ELEMENT;dest.set(Module.HEAPF64.slice(startOffset,startOffset+dest.length));Module._free(cArray);return dest})};Chromagram._constructor=Module.cwrap("Chromagram_constructor","number",["number","number"]);Chromagram._destructor=Module.cwrap("Chromagram_destructor",null,["number"]);Chromagram._processAudioFrame=Module.cwrap("Chromagram_processAudioFrame",null,["number"]);Chromagram._isReady=Module.cwrap("Chromagram_isReady","number",["number"]);Chromagram._getChromagram=Module.cwrap("Chromagram_getChromagram","number",["number","number"]);function ChordDetector(){this._ptr=ChordDetector._constructor()}ChordDetector.prototype={_free:(function(){ChordDetector._destructor(this._ptr)}),detectChord:(function(chroma){var size=chroma.length*chroma.BYTES_PER_ELEMENT;var cArray=Module._malloc(size);Module.HEAPF64.set(chroma,cArray/chroma.BYTES_PER_ELEMENT);ChordDetector._detectChord(this._ptr,cArray);Module._free(cArray)}),rootNote:(function(){switch(ChordDetector._getRootNote(this._ptr)){case 0:return"C";case 1:return"C#";case 2:return"D";case 3:return"D#";case 4:return"E";case 5:return"F";case 6:return"F#";case 7:return"G";case 8:return"G#";case 9:return"A";case 10:return"A#";case 11:return"B"}}),quality:(function(){switch(ChordDetector._getQuality(this._ptr)){case 0:return"Minor";case 1:return"Major";case 2:return"Suspended";case 3:return"Dominant";case 4:return"Dimished5th";case 5:return"Augmented5th"}}),intervals:(function(){return ChordDetector._getIntervals(this._ptr)})};ChordDetector._constructor=Module.cwrap("ChordDetector_constructor","number");ChordDetector._destructor=Module.cwrap("ChordDetector_destructor",null,["number"]);ChordDetector._detectChord=Module.cwrap("ChordDetector_detectChord",null,["number"]);ChordDetector._getRootNote=Module.cwrap("ChordDetector_getRootNote","number",["number"]);ChordDetector._getQuality=Module.cwrap("ChordDetector_getQuality","number",["number"]);ChordDetector._getIntervals=Module.cwrap("ChordDetector_getIntervals","number",["number"]);module.exports={Chromagram:Chromagram,ChordDetector:ChordDetector}





}).call(this,require('_process'))
},{"_process":6,"fs":4,"path":5}],4:[function(require,module,exports){

},{}],5:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":6}],6:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],7:[function(require,module,exports){
var bundleFn = arguments[3];
var sources = arguments[4];
var cache = arguments[5];

var stringify = JSON.stringify;

module.exports = function (fn, options) {
    var wkey;
    var cacheKeys = Object.keys(cache);

    for (var i = 0, l = cacheKeys.length; i < l; i++) {
        var key = cacheKeys[i];
        var exp = cache[key].exports;
        // Using babel as a transpiler to use esmodule, the export will always
        // be an object with the default export as a property of it. To ensure
        // the existing api and babel esmodule exports are both supported we
        // check for both
        if (exp === fn || exp && exp.default === fn) {
            wkey = key;
            break;
        }
    }

    if (!wkey) {
        wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
        var wcache = {};
        for (var i = 0, l = cacheKeys.length; i < l; i++) {
            var key = cacheKeys[i];
            wcache[key] = key;
        }
        sources[wkey] = [
            Function(['require','module','exports'], '(' + fn + ')(self)'),
            wcache
        ];
    }
    var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);

    var scache = {}; scache[wkey] = wkey;
    sources[skey] = [
        Function(['require'], (
            // try to call default if defined to also support babel esmodule
            // exports
            'var f = require(' + stringify(wkey) + ');' +
            '(f.default ? f.default : f)(self);'
        )),
        scache
    ];

    var workerSources = {};
    resolveSources(skey);

    function resolveSources(key) {
        workerSources[key] = true;

        for (var depPath in sources[key][1]) {
            var depKey = sources[key][1][depPath];
            if (!workerSources[depKey]) {
                resolveSources(depKey);
            }
        }
    }

    var src = '(' + bundleFn + ')({'
        + Object.keys(workerSources).map(function (key) {
            return stringify(key) + ':['
                + sources[key][0]
                + ',' + stringify(sources[key][1]) + ']'
            ;
        }).join(',')
        + '},{},[' + stringify(skey) + '])'
    ;

    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    var blob = new Blob([src], { type: 'text/javascript' });
    if (options && options.bare) { return blob; }
    var workerUrl = URL.createObjectURL(blob);
    var worker = new Worker(workerUrl);
    worker.objectURL = workerUrl;
    return worker;
};

},{}]},{},[1]);
