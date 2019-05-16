// Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE
'use strict';


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
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
      return buf;
     };

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

exports.abToStr = abToStr;
exports.abToHexAndBase64Str = abToHexAndBase64Str;
exports.abToHexStr = abToHexStr;
exports.str2ab = str2ab;
exports.digest = digest;
exports.hexDigest = hexDigest;
exports.hexAndBase64Digest = hexAndBase64Digest;
/* No side effect */
