// Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

import * as Caml_array from "../node_modules/bs-platform/lib/es6/caml_array.js";
import * as Caml_format from "../node_modules/bs-platform/lib/es6/caml_format.js";
import * as Audio$QueerLoop from "./Audio.bs.js";

function hashToChroma(hexHash) {
  var chroma = Caml_array.caml_make_float_vect(12);
  var hexDigits = hexHash.slice(0, 3);
  var v = Caml_format.caml_int_of_string("0x" + hexDigits);
  for(var i = 0; i <= 11; ++i){
    if ((v & 1) > 0) {
      Caml_array.caml_array_set(chroma, i, Caml_array.caml_array_get(chroma, i) + 1.0);
    }
    v = (v >>> 1);
  }
  return chroma;
}

function init(audioContext, sourceNode, output, param) {
  var bank = Audio$QueerLoop.makeFilterBank(audioContext, 12, 32.0, (function (i) {
          return Audio$QueerLoop.noteToFrequency(i + 60.0);
        }));
  Audio$QueerLoop.updateFilterBank(undefined, undefined, bank, /* array */[
        0.5,
        0.0,
        0.0,
        0.0,
        0.5,
        0.0,
        0.0,
        0.5,
        0.0,
        0.0,
        0.0,
        0.0
      ], /* () */0);
  var now = audioContext.currentTime;
  var delay = audioContext.createDelay(2.0);
  delay.delayTime.setValueAtTime(2.0, now);
  sourceNode.connect(delay);
  delay.connect(bank[/* input */0]);
  bank[/* output */3].connect(output);
  return bank;
}

export {
  hashToChroma ,
  init ,
  
}
/* Audio-QueerLoop Not a pure module */
