// Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

import * as Caml_array from "../node_modules/bs-platform/lib/es6/caml_array.js";
import * as Caml_js_exceptions from "../node_modules/bs-platform/lib/es6/caml_js_exceptions.js";
import * as SubtleCrypto$QueerLoop from "./SubtleCrypto.bs.js";
import * as Caml_builtin_exceptions from "../node_modules/bs-platform/lib/es6/caml_builtin_exceptions.js";

function abToStr (buf){
  return String.fromCharCode.apply(null, new Uint8Array(buf));
     };

function abToHexAndBase64Str (buf){
     var uint8 = new Uint8Array(buf);
     var b64 = window.btoa(String.fromCharCode.apply(null, uint8));
     var hex = Array.prototype.map.call(uint8, x => ('00' + x.toString(16)).slice(-2)).join('');
     return [hex, b64];
     };

function abToHexStr (buf){
     return Array.prototype.map.call(new Uint8Array(buf), x => ('00' + x.toString(16)).slice(-2)).join('');
     };

function str2ab (str){
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
      return buf;
     };

function b64ToAB(s) {
  return str2ab(atob(s));
}

function abToB64(ab) {
  return btoa(abToStr(ab));
}

function digest(algorithm, input) {
  return window.crypto.subtle.digest(algorithm, str2ab(input)).then((function (output) {
                return Promise.resolve(abToStr(output));
              }));
}

function hexDigest(algorithm, input) {
  return window.crypto.subtle.digest(algorithm, str2ab(input)).then((function (output) {
                return Promise.resolve(abToHexStr(output));
              }));
}

function hexAndBase64Digest(algorithm, input) {
  return window.crypto.subtle.digest(algorithm, str2ab(input)).then((function (output) {
                return Promise.resolve(abToHexAndBase64Str(output));
              }));
}

function hmacSign(data) {
  return SubtleCrypto$QueerLoop.defaultHmacKey.then((function (key) {
                  var buf = str2ab(data);
                  return Promise.all(/* tuple */[
                              window.crypto.subtle.sign(SubtleCrypto$QueerLoop.defaultHmac, key, buf),
                              Promise.resolve(buf)
                            ]);
                })).then((function (param) {
                return Promise.resolve(btoa(abToStr(param[0])) + ("|" + btoa(abToStr(param[1]))));
              }));
}

function hmacVerify(input) {
  return SubtleCrypto$QueerLoop.defaultHmacKey.then((function (key) {
                  var parts = input.split("|");
                  if (parts.length !== 2) {
                    Promise.reject([
                          Caml_builtin_exceptions.invalid_argument,
                          input
                        ]);
                  }
                  var exit = 0;
                  var val;
                  var val$1;
                  try {
                    val = str2ab(atob(Caml_array.caml_array_get(parts, 0)));
                    val$1 = str2ab(atob(Caml_array.caml_array_get(parts, 1)));
                    exit = 1;
                  }
                  catch (raw_e){
                    var e = Caml_js_exceptions.internalToOCamlException(raw_e);
                    console.log(parts);
                    return Promise.reject(e);
                  }
                  if (exit === 1) {
                    return Promise.all(/* tuple */[
                                window.crypto.subtle.verify(SubtleCrypto$QueerLoop.defaultHmac, key, val, val$1),
                                Promise.resolve(abToHexStr(val)),
                                Promise.resolve(abToStr(val$1))
                              ]);
                  }
                  
                })).then((function (param) {
                if (param[0]) {
                  return Promise.resolve(/* tuple */[
                              param[1],
                              param[2]
                            ]);
                } else {
                  return Promise.reject([
                              Caml_builtin_exceptions.invalid_argument,
                              input
                            ]);
                }
              }));
}

export {
  abToStr ,
  abToHexAndBase64Str ,
  abToHexStr ,
  str2ab ,
  b64ToAB ,
  abToB64 ,
  digest ,
  hexDigest ,
  hexAndBase64Digest ,
  hmacSign ,
  hmacVerify ,
  
}
/* SubtleCrypto-QueerLoop Not a pure module */
