// Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE
'use strict';

var Jest = require("@glennsl/bs-jest/src/jest.js");
var QrCodeGen$QueerLoop = require("../src/QrCodeGen.bs.js");
var QueerCode$QueerLoop = require("../src/QueerCode.bs.js");

var qrCode = QrCodeGen$QueerLoop.QrCode[/* _encodeText */0]("https://qqq.lu", QrCodeGen$QueerLoop.Ecc[/* low */0]);

Jest.describe("QueerCode", (function (param) {
        Jest.Only[/* describe */4]("getSvgDataUri", (function (param) {
                return Jest.test("translates QR code data into QueerCode SVG", (function (param) {
                              return Jest.Expect[/* toEqual */12]("", Jest.Expect[/* expect */0](QueerCode$QueerLoop.getSvgDataUri(qrCode, /* array */[])));
                            }));
              }));
        return Jest.describe("drawCanvas", (function (param) {
                      return Jest.test("applies a QueerCode to a canvas", (function (param) {
                                    var canvas = document.createElement("canvas");
                                    QueerCode$QueerLoop.drawCanvas(canvas, qrCode);
                                    canvas.toDataURL();
                                    return Jest.Expect[/* toEqual */12]("", Jest.Expect[/* expect */0](canvas.toDataURL()));
                                  }));
                    }));
      }));

exports.qrCode = qrCode;
/* qrCode Not a pure module */
