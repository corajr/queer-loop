// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE

import * as Block from "../node_modules/bs-platform/lib/es6/block.js";
import * as Curry from "../node_modules/bs-platform/lib/es6/curry.js";
import * as Printf from "../node_modules/bs-platform/lib/es6/printf.js";
import * as Caml_float from "../node_modules/bs-platform/lib/es6/caml_float.js";
import * as Caml_int32 from "../node_modules/bs-platform/lib/es6/caml_int32.js";
import * as Caml_format from "../node_modules/bs-platform/lib/es6/caml_format.js";

function floatFromHexDigits(digits) {
  var i;
  try {
    i = Caml_format.caml_int_of_string("0x" + digits);
  }
  catch (exn){
    i = 0;
  }
  return i / 15.0;
}

function rgbFloatFromHash(hex) {
  return /* tuple */[
          floatFromHexDigits(hex.slice(1, 2)),
          floatFromHexDigits(hex.slice(2, 3)),
          floatFromHexDigits(hex.slice(3, 4))
        ];
}

function wrap01(x) {
  if (x < 0.0) {
    return 1.0;
  } else if (x > 1.0) {
    return 0.0;
  } else {
    return x;
  }
}

function getNextHsv(param) {
  var v = param[2];
  var s = param[1];
  var h = param[0];
  var inc = 1.0 / 5.0;
  var match = s !== 0.0;
  var match$1 = Caml_float.caml_modf_float(match ? h + inc : h);
  var match$2 = s === 0.0 && v === 1.0 || match$1[1] !== 0.0;
  var s_ = match$2 ? s + inc : s;
  var match$3 = s_ === 0.0 || h === 0.8 && s === 1.0;
  var v_ = match$3 ? v - inc : v;
  return /* tuple */[
          match$1[0],
          wrap01(s_),
          wrap01(v_)
        ];
}

function roundToFifth(x) {
  return Math.floor((x + 0.05) / 0.2);
}

function rgbFloatToHex(r, g, b) {
  var r_ = Caml_int32.imul(roundToFifth(r) | 0, 3);
  var g_ = Caml_int32.imul(roundToFifth(g) | 0, 3);
  var b_ = Caml_int32.imul(roundToFifth(b) | 0, 3);
  return Curry._3(Printf.sprintf(/* Format */[
                  /* Char_literal */Block.__(12, [
                      /* "#" */35,
                      /* Int */Block.__(4, [
                          /* Int_x */6,
                          /* Lit_padding */Block.__(0, [
                              /* Right */1,
                              0
                            ]),
                          /* No_precision */0,
                          /* Int */Block.__(4, [
                              /* Int_x */6,
                              /* Lit_padding */Block.__(0, [
                                  /* Right */1,
                                  0
                                ]),
                              /* No_precision */0,
                              /* Int */Block.__(4, [
                                  /* Int_x */6,
                                  /* Lit_padding */Block.__(0, [
                                      /* Right */1,
                                      0
                                    ]),
                                  /* No_precision */0,
                                  /* End_of_format */0
                                ])
                            ])
                        ])
                    ]),
                  "#%0x%0x%0x"
                ]), r_, g_, b_);
}

function rgbToHsv (r,g,b){

     var max = Math.max(r, g, b), min = Math.min(r, g, b);
     var h, s, v = max;

     var d = max - min;
     s = max === 0 ? 0 : d / max;

     if(max == min) {
     h = 0; // achromatic
     }
     else {
     switch(max) {
     case r: h = (g - b) / d + (g < b ? 6 : 0); break;
     case g: h = (b - r) / d + 2; break;
     case b: h = (r - g) / d + 4; break;
     }
     h /= 6;
     }

     return [h, s, v];
     };

function hsvToRgb (h,s,v){
     h = h * 6;

     var i = Math.floor(h),
     f = h - i,
     p = v * (1 - s),
     q = v * (1 - f * s),
     t = v * (1 - (1 - f) * s),
     mod = i % 6,
     r = [v, q, p, p, t, v][mod],
     g = [t, v, v, q, p, p][mod],
     b = [p, p, t, v, v, q][mod];

     return [r, g, b];
     };

function getNextColor(current) {
  var match = rgbFloatFromHash(current);
  var hsv = rgbToHsv(match[0], match[1], match[2]);
  var match$1 = getNextHsv(hsv);
  var match$2 = hsvToRgb(match$1[0], match$1[1], match$1[2]);
  return rgbFloatToHex(match$2[0], match$2[1], match$2[2]);
}

function sinebow(t) {
  return "";
}

export {
  floatFromHexDigits ,
  rgbFloatFromHash ,
  wrap01 ,
  getNextHsv ,
  roundToFifth ,
  rgbFloatToHex ,
  rgbToHsv ,
  hsvToRgb ,
  getNextColor ,
  sinebow ,
  
}
/* No side effect */
