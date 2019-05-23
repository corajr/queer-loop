// Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

import * as JsqrEs6 from "jsqr-es6";
import * as Caml_option from "../node_modules/bs-platform/lib/es6/caml_option.js";

function string_of_invertOptions(param) {
  switch (param) {
    case 0 : 
        return "attemptBoth";
    case 1 : 
        return "dontInvert";
    case 2 : 
        return "onlyInvert";
    case 3 : 
        return "invertFirst";
    
  }
}

function jsQR(d, w, h, invertOptions) {
  var optString = string_of_invertOptions(invertOptions);
  return Caml_option.nullable_to_opt(JsqrEs6.default(d, w, h, {
                  inversionAttempts: optString,
                  canOverwriteImage: true
                }));
}

var defaultInversion = /* InvertFirst */3;

export {
  string_of_invertOptions ,
  defaultInversion ,
  jsQR ,
  
}
/* jsqr-es6 Not a pure module */
