// Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE
'use strict';

var Block = require("bs-platform/lib/js/block.js");
var Curry = require("bs-platform/lib/js/curry.js");
var Printf = require("bs-platform/lib/js/printf.js");
var ElementRe = require("bs-webapi/src/dom/nodes/ElementRe.js");
var Caml_array = require("bs-platform/lib/js/caml_array.js");
var Caml_int32 = require("bs-platform/lib/js/caml_int32.js");
var DocumentRe = require("bs-webapi/src/dom/nodes/DocumentRe.js");
var Pervasives = require("bs-platform/lib/js/pervasives.js");
var Belt_Option = require("bs-platform/lib/js/belt_Option.js");
var Caml_format = require("bs-platform/lib/js/caml_format.js");
var Caml_option = require("bs-platform/lib/js/caml_option.js");
var Scanner$QueerLoop = require("./Scanner.bs.js");
var QrCodeGen$QueerLoop = require("./QrCodeGen.bs.js");
var QueerCode$QueerLoop = require("./QueerCode.bs.js");
var UserMedia$QueerLoop = require("./UserMedia.bs.js");

function maybeSetCode(maybeEl, text) {
  Belt_Option.map(maybeEl, (function (el) {
          return QueerCode$QueerLoop.setSvg(QrCodeGen$QueerLoop.QrCode[/* encodeText */0](text, QrCodeGen$QueerLoop.Ecc[/* medium */1]), el);
        }));
  return /* () */0;
}

var domain = "qqq.lu";

var codeRegex = new RegExp("https:\\/\\/qqq.lu\\/#([0-f]{3})");

var defaultHash = "fff";

function getNextHash(current) {
  var i;
  try {
    i = Caml_format.caml_int_of_string("0x" + current.slice(1));
  }
  catch (exn){
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

function onHashChange(param) {
  var hash = window.location.hash;
  setBgColor(hash);
  var currentQrEl = document.querySelector("#current");
  maybeSetCode((currentQrEl == null) ? undefined : Caml_option.some(currentQrEl), "https://" + (domain + ("/" + hash)));
  return /* () */0;
}

function setOpacity(elQuery, opacity) {
  return Belt_Option.map(Belt_Option.flatMap(Caml_option.nullable_to_opt(document.querySelector(elQuery)), ElementRe.asHtmlElement), (function (body) {
                body.style.setProperty("opacity", Pervasives.string_of_float(opacity), "");
                return /* () */0;
              }));
}

function onTick(ts) {
  var scaled = ts * 0.0005;
  Math.pow(Math.cos(scaled), 2.0);
  var codeOpacity = Math.pow(Math.sin(scaled), 2.0);
  setOpacity("#current", codeOpacity);
  requestAnimationFrame(onTick);
  return /* () */0;
}

function init(param) {
  var videoEl = document.querySelector("#preview");
  var previousQrEl = document.querySelector("#previous");
  var previousQrEl$1 = (previousQrEl == null) ? undefined : Caml_option.some(previousQrEl);
  var initialHash = window.location.hash;
  if (initialHash === "") {
    window.location.hash = defaultHash;
  }
  onHashChange(/* () */0);
  var response = function (input) {
    var match = codeRegex.exec(input);
    if (match !== null) {
      var match$1 = Caml_array.caml_array_get(match, 1);
      if (match$1 == null) {
        return /* () */0;
      } else {
        maybeSetCode(previousQrEl$1, "https://" + (domain + ("/#" + match$1)));
        var nextHash = getNextHash(match$1);
        window.location.hash = nextHash;
        return /* () */0;
      }
    } else {
      console.log("Ignoring (external barcode): " + input);
      return /* () */0;
    }
  };
  UserMedia$QueerLoop.getCameras(/* () */0).then((function (cameras) {
            camerasRef[0] = cameras;
            if (videoEl == null) {
              return Promise.resolve(/* () */0);
            } else {
              return Scanner$QueerLoop.scanUsingDeviceId(videoEl, Caml_array.caml_array_get(cameras, 0).deviceId, response);
            }
          })).catch((function (err) {
          console.error("getCameras failed", err);
          return Promise.resolve(/* () */0);
        }));
  return /* () */0;
}

window.addEventListener("load", (function (param) {
        return init(/* () */0);
      }));

window.addEventListener("hashchange", (function (param) {
        return onHashChange(/* () */0);
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
exports.onHashChange = onHashChange;
exports.setOpacity = setOpacity;
exports.onTick = onTick;
exports.init = init;
/* codeRegex Not a pure module */
