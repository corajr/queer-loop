// Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE
'use strict';

var Block = require("bs-platform/lib/js/block.js");
var Curry = require("bs-platform/lib/js/curry.js");
var Printf = require("bs-platform/lib/js/printf.js");
var ElementRe = require("bs-webapi/src/dom/nodes/ElementRe.js");
var Instascan = require("instascan");
var Caml_array = require("bs-platform/lib/js/caml_array.js");
var Caml_int32 = require("bs-platform/lib/js/caml_int32.js");
var DocumentRe = require("bs-webapi/src/dom/nodes/DocumentRe.js");
var Belt_Option = require("bs-platform/lib/js/belt_Option.js");
var Caml_format = require("bs-platform/lib/js/caml_format.js");
var Caml_option = require("bs-platform/lib/js/caml_option.js");
var Js_null_undefined = require("bs-platform/lib/js/js_null_undefined.js");
var Instascan$QueerLoop = require("./Instascan.bs.js");
var QrCodeGen$QueerLoop = require("./QrCodeGen.bs.js");

function maybeSetCode(maybeEl, text) {
  Belt_Option.map(maybeEl, (function (el) {
          return QrCodeGen$QueerLoop.setSvg(qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM), el);
        }));
  return /* () */0;
}

var domain = "qqq.lu";

var codeRegex = new RegExp("https:\\/\\/qqq.lu\\/#([0-f]{3})");

var defaultHash = "fff";

function getNextHash(current) {
  var i;
  try {
    i = Caml_format.caml_int_of_string("0x" + current);
  }
  catch (exn){
    console.log("Error: " + (current + " is invalid."));
    i = 0;
  }
  return Curry._1(Printf.sprintf(/* Format */[
                  /* Char_literal */Block.__(12, [
                      /* "#" */35,
                      /* Int */Block.__(4, [
                          /* Int_x */6,
                          /* Lit_padding */Block.__(0, [
                              /* Zeros */2,
                              3
                            ]),
                          /* No_precision */0,
                          /* End_of_format */0
                        ])
                    ]),
                  "#%03x"
                ]), (i + 1 | 0) % 4096);
}

var camerasRef = /* record */[/* contents : array */[]];

var cameraIndex = /* record */[/* contents */0];

function cycleCameras(scanner) {
  var n = camerasRef[0].length;
  cameraIndex[0] = Caml_int32.mod_(cameraIndex[0] + 1 | 0, n);
  var nextCamera = Caml_array.caml_array_get(camerasRef[0], cameraIndex[0]);
  scanner.start(nextCamera);
  return /* () */0;
}

function setBgColor(color) {
  return Belt_Option.map(Belt_Option.flatMap(Belt_Option.flatMap(DocumentRe.asHtmlDocument(document), (function (prim) {
                        return Caml_option.nullable_to_opt(prim.body);
                      })), ElementRe.asHtmlElement), (function (body) {
                body.style.setProperty("background-color", color, "");
                return /* () */0;
              }));
}

function init(param) {
  var videoEl = document.querySelector("#preview");
  var qrcodeEl = document.querySelector("#code");
  var qrcodeEl$1 = (qrcodeEl == null) ? undefined : Caml_option.some(qrcodeEl);
  var initialHash = window.location.hash;
  var hash = initialHash === "" ? (window.location.hash = defaultHash, defaultHash) : initialHash;
  setBgColor(hash);
  maybeSetCode(qrcodeEl$1, "https://" + (domain + ("/" + hash)));
  var instascanOpts = {
    video: Js_null_undefined.fromOption((videoEl == null) ? undefined : Caml_option.some(videoEl))
  };
  var scanner = new Instascan.Scanner(instascanOpts);
  var response = function (input) {
    var match = codeRegex.exec(input);
    if (match !== null) {
      var match$1 = Caml_array.caml_array_get(match, 1);
      if (match$1 == null) {
        return /* () */0;
      } else {
        console.log(match$1);
        var nextHash = getNextHash(match$1);
        window.location.hash = nextHash;
        setBgColor(nextHash);
        return maybeSetCode(qrcodeEl$1, "https://" + (domain + ("/" + nextHash)));
      }
    } else {
      console.log("Ignoring QR: " + input);
      return /* () */0;
    }
  };
  scanner.addListener("scan", response);
  window.addEventListener("click", (function (param) {
          return cycleCameras(scanner);
        }));
  Curry._1(Instascan$QueerLoop.Camera[/* getCameras */0], /* () */0).then((function (cameras) {
            camerasRef[0] = cameras;
            if (cameras.length !== 0) {
              scanner.start(Caml_array.caml_array_get(cameras, 0));
            } else {
              console.error("No cameras found!");
            }
            return Promise.resolve(/* () */0);
          })).catch((function (err) {
          console.error("getCameras failed", err);
          return Promise.resolve(/* () */0);
        }));
  return /* () */0;
}

window.addEventListener("load", (function (param) {
        return init(/* () */0);
      }));

exports.maybeSetCode = maybeSetCode;
exports.domain = domain;
exports.codeRegex = codeRegex;
exports.defaultHash = defaultHash;
exports.getNextHash = getNextHash;
exports.camerasRef = camerasRef;
exports.cameraIndex = cameraIndex;
exports.cycleCameras = cycleCameras;
exports.setBgColor = setBgColor;
exports.init = init;
/* codeRegex Not a pure module */
