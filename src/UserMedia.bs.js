// Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE
'use strict';

var ElementRe = require("bs-webapi/src/dom/nodes/ElementRe.js");
var Belt_Array = require("bs-platform/lib/js/belt_Array.js");
var Caml_option = require("bs-platform/lib/js/caml_option.js");

function getCameras(param) {
  return window.navigator.mediaDevices.enumerateDevices().then((function (devices) {
                return Promise.resolve(Belt_Array.keep(devices, (function (x) {
                                  return x.kind === "videoinput";
                                })));
              }));
}

function initStreamByDeviceId(videoEl, deviceId) {
  return window.navigator.mediaDevices.getUserMedia({
                video: {
                  deviceId: deviceId
                }
              }).then((function (stream) {
                videoEl.srcObject = stream;
                var match = ElementRe.asHtmlElement(videoEl);
                if (match !== undefined) {
                  Caml_option.valFromOption(match).setAttribute("playsinline", "true");
                }
                videoEl.play();
                return Promise.resolve(videoEl);
              }));
}

exports.getCameras = getCameras;
exports.initStreamByDeviceId = initStreamByDeviceId;
/* ElementRe Not a pure module */