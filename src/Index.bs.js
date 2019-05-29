// Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

import * as $$Array from "../node_modules/bs-platform/lib/es6/array.js";
import * as Curry from "../node_modules/bs-platform/lib/es6/curry.js";
import * as Js_dict from "../node_modules/bs-platform/lib/es6/js_dict.js";
import * as Debouncer from "../node_modules/re-debouncer/src/Debouncer.bs.js";
import * as Caml_array from "../node_modules/bs-platform/lib/es6/caml_array.js";
import * as Caml_int32 from "../node_modules/bs-platform/lib/es6/caml_int32.js";
import * as Belt_Option from "../node_modules/bs-platform/lib/es6/belt_Option.js";
import * as Caml_format from "../node_modules/bs-platform/lib/es6/caml_format.js";
import * as Caml_option from "../node_modules/bs-platform/lib/es6/caml_option.js";
import * as Hash$QueerLoop from "./Hash.bs.js";
import * as JsQr$QueerLoop from "./JsQr.bs.js";
import * as Util$QueerLoop from "./Util.bs.js";
import * as Options$QueerLoop from "./Options.bs.js";
import * as Scanner$QueerLoop from "./Scanner.bs.js";
import * as Caml_js_exceptions from "../node_modules/bs-platform/lib/es6/caml_js_exceptions.js";
import * as QrCodeGen$QueerLoop from "./QrCodeGen.bs.js";
import * as QueerCode$QueerLoop from "./QueerCode.bs.js";
import * as SvgScript$QueerLoop from "./SvgScript.bs.js";
import * as UserMedia$QueerLoop from "./UserMedia.bs.js";

var domain = "qqq.lu";

function setBackground(selector, bgCss) {
  return Util$QueerLoop.withQuerySelector(selector, (function (el) {
                el.style.setProperty("background", bgCss, "");
                console.log(bgCss);
                return /* () */0;
              }));
}

var codeRegex = new RegExp("https:\\/\\/qqq.lu\\/#(.+)");

var defaultCode = QrCodeGen$QueerLoop.QrCode[/* _encodeText */0]("https://qqq.lu", QrCodeGen$QueerLoop.Ecc[/* low */0]);

var initialHash = /* record */[/* contents */""];

var camerasRef = /* record */[/* contents : array */[]];

function setSrc (img,src){
     img.src = src;};

var dataSeen = { };

var currentSignature = /* record */[/* contents */""];

var canvasesRef = /* record */[/* contents : array */[]];

function getTimestamp(param) {
  return new Date().toISOString();
}

function getTimestampAndLocaleString(param) {
  var date = new Date();
  return /* tuple */[
          date.toISOString(),
          date.toLocaleString()
        ];
}

function asOfNow(f) {
  return Curry._1(f, new Date());
}

function setHashToNow(param) {
  return Util$QueerLoop.setHash(new Date().toISOString());
}

var hasChanged = /* record */[/* contents */false];

var queerLoopState = /* record */[/* contents : Dreaming */1];

function simulateSelfRecognition(param) {
  console.log("Simulating self recognition...");
  Util$QueerLoop.withQuerySelectorDom("#snapshotCanvas", (function (snapshotCanvas) {
          var ctx = snapshotCanvas.getContext("2d");
          var size = snapshotCanvas.width;
          Util$QueerLoop.withQuerySelectorDom("img", (function (codeImg) {
                  ctx.drawImage(codeImg, 0, 0, size, size);
                  return /* () */0;
                }));
          ctx.drawImage(snapshotCanvas, 1, 1, size - 1 | 0, size - 1 | 0);
          return Scanner$QueerLoop.runScanFromCanvas(snapshotCanvas, undefined, (function (canvas, qrCode) {
                        console.log("simulating scan");
                        console.log("simulating scan");
                        return /* () */0;
                      }));
        }));
  return /* () */0;
}

function onClick(maybeHash, param) {
  if (!hasChanged[0]) {
    hasChanged[0] = true;
  }
  if (maybeHash !== undefined) {
    var hash = maybeHash;
    var match = Js_dict.get(dataSeen, hash);
    if (match !== undefined) {
      SvgScript$QueerLoop.toggleHash(hash);
    } else {
      false;
    }
    return /* () */0;
  } else {
    return Util$QueerLoop.setHash(new Date().toISOString());
  }
}

function _writeLogEntry(param) {
  var hash = param[3];
  var text = param[2];
  var timestamp = param[0];
  Util$QueerLoop.withQuerySelectorDom("#log", (function (log) {
          var entry = document.createElement("a");
          entry.setAttribute("href", "#" + hash);
          var linkClasses = entry.classList;
          linkClasses.add("log-entry", "codeLink", "code" + hash);
          entry.addEventListener("click", (function (evt) {
                  evt.preventDefault();
                  return onClick(hash, /* () */0);
                }));
          var timeDiv = document.createElement("div");
          var time = document.createElement("time");
          time.setAttribute("datetime", timestamp);
          time.textContent = timestamp;
          var textChild = document.createElement("span");
          textChild.innerText = text;
          var hashColor = hash.slice(0, 6);
          entry.setAttribute("style", "background-color: #" + (String(hashColor) + "66;"));
          timeDiv.appendChild(time);
          entry.appendChild(timeDiv);
          entry.appendChild(textChild);
          log.appendChild(entry);
          return /* () */0;
        }));
  return /* () */0;
}

var writeLogEntry = Debouncer.make(100, _writeLogEntry);

function takeSnapshot(codeImg) {
  return Util$QueerLoop.withQuerySelectorDom("#snapshotCanvas", (function (snapshotCanvas) {
                snapshotCanvas.getContext("2d");
                return snapshotCanvas.toDataURL("image/jpeg", 0.9);
              }));
}

function copySnapshotToIcon(param) {
  return Util$QueerLoop.withQuerySelectorDom("#iconCanvas", (function (iconCanvas) {
                return Util$QueerLoop.withQuerySelectorDom("#snapshotCanvas", (function (snapshotCanvas) {
                              var iconCtx = iconCanvas.getContext("2d");
                              iconCtx.globalAlpha = 1.0;
                              iconCtx.drawImage(snapshotCanvas, 0, 0, snapshotCanvas.width, snapshotCanvas.height, 0, 0, iconCanvas.width, iconCanvas.height);
                              return /* () */0;
                            }));
              }));
}

function hasBody (){return !!document.body;};

function withRootSvg(hash, f) {
  if (Curry._1(hasBody, /* () */0)) {
    Util$QueerLoop.withQuerySelectorDom("#queer-loop", (function (loopContainer) {
            var match = loopContainer.querySelector("svg");
            if (match == null) {
              var svg = QueerCode$QueerLoop.createSvgSkeleton(hash);
              svg.addEventListener("click", (function (param) {
                      return onClick(undefined, param);
                    }));
              loopContainer.appendChild(svg);
              return Curry._1(f, svg);
            } else {
              return Curry._1(f, match);
            }
          }));
    return /* () */0;
  } else {
    Util$QueerLoop.withQuerySelectorDom("svg.root", f);
    return /* () */0;
  }
}

function setCode(text) {
  Hash$QueerLoop.hexDigest("SHA-1", text).then((function (hash) {
          withRootSvg(hash, (function (rootSvg) {
                  var alreadySeen = Belt_Option.isSome(Js_dict.get(dataSeen, hash));
                  if (alreadySeen) {
                    return 0;
                  } else {
                    dataSeen[hash] = text;
                    var code = Belt_Option.getWithDefault(QrCodeGen$QueerLoop.QrCode[/* encodeText */1](text, QrCodeGen$QueerLoop.Ecc[/* medium */1]), defaultCode);
                    var sizeWithBorder = code.size + 12 | 0;
                    var match = getTimestampAndLocaleString(/* () */0);
                    var timestamp = match[0];
                    var codeSvg = QueerCode$QueerLoop.createCodeSvg(text, code, hash, match[1], timestamp, 6, Options$QueerLoop.currentOptions[0][/* invert */4]);
                    var codeImg = QueerCode$QueerLoop.svgToImg(codeSvg);
                    codeImg.addEventListener("load", (function (param) {
                            Util$QueerLoop.withQuerySelectorDom("#centralGroup", (function (centralGroup) {
                                    var match = takeSnapshot(/* () */0);
                                    if (match !== undefined) {
                                      QueerCode$QueerLoop.addBackground(codeSvg, sizeWithBorder, match);
                                      centralGroup.appendChild(codeSvg);
                                      if (Options$QueerLoop.currentOptions[0][/* animate */5]) {
                                        rootSvg.setAttribute("class", "root animationsEnabled");
                                      }
                                      SvgScript$QueerLoop.setAnimacy(rootSvg, hash);
                                      var iconCodeImg = QueerCode$QueerLoop.codeToImage(code, 6, hash);
                                      iconCodeImg.addEventListener("load", (function (_evt) {
                                              var match = Util$QueerLoop.withQuerySelectorDom("#iconCanvas", (function (iconCanvas) {
                                                      iconCanvas.width = sizeWithBorder;
                                                      iconCanvas.height = sizeWithBorder;
                                                      var ctx = iconCanvas.getContext("2d");
                                                      copySnapshotToIcon(/* () */0);
                                                      ctx.globalAlpha = 0.5;
                                                      ctx.drawImage(iconCodeImg, 0, 0);
                                                      return iconCanvas.toDataURL();
                                                    }));
                                              if (match !== undefined) {
                                                var iconUrl = match;
                                                Util$QueerLoop.withQuerySelectorDom("#codes", (function (container) {
                                                        var a = document.createElementNS(Util$QueerLoop.htmlNs, "a");
                                                        a.setAttribute("href", "#" + hash);
                                                        var linkClasses = a.classList;
                                                        linkClasses.add("codeLink", "code" + hash);
                                                        var img = document.createElementNS(Util$QueerLoop.htmlNs, "img");
                                                        img.setAttribute("src", iconUrl);
                                                        a.appendChild(img);
                                                        a.addEventListener("click", (function (evt) {
                                                                evt.preventDefault();
                                                                return onClick(hash, /* () */0);
                                                              }));
                                                        container.appendChild(a);
                                                        return /* () */0;
                                                      }));
                                                return /* () */0;
                                              } else {
                                                return /* () */0;
                                              }
                                            }));
                                      var url = QueerCode$QueerLoop.svgToDataURL(rootSvg);
                                      Util$QueerLoop.withQuerySelectorDom("#download", (function (a) {
                                              a.setAttribute("download", timestamp + ".svg");
                                              a.setAttribute("href", url);
                                              return /* () */0;
                                            }));
                                      currentSignature[0] = hash;
                                      return /* () */0;
                                    } else {
                                      return /* () */0;
                                    }
                                  }));
                            return /* () */0;
                          }));
                    return /* () */0;
                  }
                }));
          return Promise.resolve(/* () */0);
        }));
  return /* () */0;
}

var setText = Debouncer.make(200, (function (hash) {
        Util$QueerLoop.withQuerySelectorDom("#codeContents", (function (el) {
                el.innerText = decodeURIComponent(hash);
                return /* () */0;
              }));
        return /* () */0;
      }));

function onHashChange(_evt) {
  var opts = Options$QueerLoop.currentOptions[0];
  var url = new URL(window.location.href);
  var match = getTimestampAndLocaleString(/* () */0);
  var localeString = match[1];
  var timestamp = match[0];
  Util$QueerLoop.withQuerySelectorDom("title", (function (title) {
          title.innerText = localeString;
          return /* () */0;
        }));
  Util$QueerLoop.withQuerySelectorDom("time", (function (time) {
          time.setAttribute("datetime", timestamp);
          time.innerText = localeString;
          return /* () */0;
        }));
  var match$1 = opts[/* includeDomain */1];
  var match$2 = opts[/* includeQueryString */2];
  var match$3 = opts[/* includeHash */3];
  var urlText = (
    match$1 ? url.origin : ""
  ) + ((
      match$2 ? url.search : ""
    ) + (
      match$3 ? url.hash : ""
    ));
  setCode(urlText);
  return Curry._1(setText, urlText);
}

var frameCount = /* record */[/* contents */0];

var lastFrame = /* record */[/* contents */0.0];

var lastUpdated = /* record */[/* contents */0.0];

function onTick(ts) {
  frameCount[0] = frameCount[0] + 1 | 0;
  requestAnimationFrame(onTick);
  return /* () */0;
}

function maybeUrl(s) {
  var exit = 0;
  var url;
  try {
    url = new URL(s);
    exit = 1;
  }
  catch (raw_e){
    var e = Caml_js_exceptions.internalToOCamlException(raw_e);
    console.error("Could not parse URL", e);
    return undefined;
  }
  if (exit === 1) {
    return Caml_option.some(url);
  }
  
}

function _onInput(param) {
  Util$QueerLoop.withQuerySelectorDom("#codeContents", (function (el) {
          var text = el.innerText;
          return Belt_Option.map(maybeUrl(text), (function (url) {
                        window.location;
                        window.location.hash = url.hash;
                        return /* () */0;
                      }));
        }));
  return /* () */0;
}

var onInput = Debouncer.make(100, _onInput);

function boolParam($$default, param) {
  if (param !== undefined) {
    var s = param;
    if (s === "true" || s === "1" || s === "y") {
      return true;
    } else {
      return s === "";
    }
  } else {
    return $$default;
  }
}

function pick(ary, indices) {
  return $$Array.map((function (i) {
                return Caml_array.caml_array_get(ary, i);
              }), indices);
}

function cycleThroughPast(param) {
  var allIds = Util$QueerLoop.withQuerySelectorAll(".code", (function (param) {
          return Util$QueerLoop.mapMaybe((function (item) {
                        return Caml_option.nullable_to_opt(item.getAttribute("id"));
                      }), param);
        }));
  var currentId = Belt_Option.getWithDefault(Belt_Option.getWithDefault(Util$QueerLoop.withQuerySelectorDom(".animate", (function (live) {
                  SvgScript$QueerLoop.removeClassSvg(live, "animate");
                  SvgScript$QueerLoop.addClassSvg(live, "active");
                  return Caml_option.nullable_to_opt(live.getAttribute("id"));
                })), undefined), "");
  var i = /* record */[/* contents */allIds.indexOf(currentId)];
  return (function (param) {
      Util$QueerLoop.withQuerySelectorDom(".active", (function (live) {
              return SvgScript$QueerLoop.removeClassSvg(live, "active");
            }));
      i[0] = Caml_int32.mod_(i[0] + 1 | 0, allIds.length);
      Util$QueerLoop.withQuerySelectorDom("#" + Caml_array.caml_array_get(allIds, i[0]), (function (live) {
              return SvgScript$QueerLoop.addClassSvg(live, "active");
            }));
      return /* () */0;
    });
}

function init(_evt) {
  Util$QueerLoop.withQuerySelectorDom("#snapshotCanvas", (function (canvas) {
          canvas.width = 480;
          canvas.height = 480;
          return /* () */0;
        }));
  var queryString = Util$QueerLoop.getQueryString(/* () */0);
  if (queryString !== "") {
    var params = new URLSearchParams(queryString);
    var cameraIndices = $$Array.map(Caml_format.caml_int_of_string, params.getAll("c"));
    var match = cameraIndices.length === 0;
    Options$QueerLoop.currentOptions[0] = /* record */[
      /* background */Belt_Option.getWithDefault(Belt_Option.map(Caml_option.nullable_to_opt(params.get("b")), (function (prim) {
                  return decodeURIComponent(prim);
                })), Options$QueerLoop.currentOptions[0][/* background */0]),
      /* includeDomain */boolParam(Options$QueerLoop.currentOptions[0][/* includeDomain */1], Caml_option.nullable_to_opt(params.get("d"))),
      /* includeQueryString */boolParam(Options$QueerLoop.currentOptions[0][/* includeQueryString */2], Caml_option.nullable_to_opt(params.get("q"))),
      /* includeHash */boolParam(Options$QueerLoop.currentOptions[0][/* includeHash */3], Caml_option.nullable_to_opt(params.get("h"))),
      /* invert */boolParam(Options$QueerLoop.currentOptions[0][/* invert */4], Caml_option.nullable_to_opt(params.get("i"))),
      /* animate */boolParam(Options$QueerLoop.currentOptions[0][/* animate */5], Caml_option.nullable_to_opt(params.get("a"))),
      /* opacity */Belt_Option.getWithDefault(Belt_Option.map(Caml_option.nullable_to_opt(params.get("o")), (function (prim) {
                  return Number(prim);
                })), Options$QueerLoop.currentOptions[0][/* opacity */6]),
      /* url */Caml_option.nullable_to_opt(params.get("u")),
      /* youtubeVideo */Caml_option.nullable_to_opt(params.get("v")),
      /* cameraIndices */match ? /* array */[0] : cameraIndices
    ];
  }
  if (Options$QueerLoop.currentOptions[0][/* background */0] !== "") {
    setBackground(".background", Options$QueerLoop.currentOptions[0][/* background */0]);
  }
  var match$1 = Options$QueerLoop.currentOptions[0][/* url */7];
  if (match$1 !== undefined) {
    Util$QueerLoop.withQuerySelectorDom("#iframeContainer", (function (iframeContainer) {
            var iframe = document.createElementNS(Util$QueerLoop.htmlNs, "iframe");
            iframe.setAttribute("width", String(window.innerWidth));
            iframe.setAttribute("height", String(window.innerHeight));
            iframe.setAttribute("allow", "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; microphone; camera");
            iframeContainer.appendChild(iframe);
            return /* () */0;
          }));
  }
  var match$2 = Options$QueerLoop.currentOptions[0][/* youtubeVideo */8];
  if (match$2 !== undefined) {
    var ytId = match$2;
    Util$QueerLoop.withQuerySelectorDom("#iframeContainer", (function (iframeContainer) {
            var iframe = document.createElementNS(Util$QueerLoop.htmlNs, "iframe");
            iframe.setAttribute("width", String(window.innerWidth));
            iframe.setAttribute("frameborder", "0");
            iframe.setAttribute("allow", "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture");
            iframe.setAttribute("height", String(window.innerHeight));
            var url = "https://www.youtube-nocookie.com/embed/" + (String(ytId) + "");
            iframe.setAttribute("src", url);
            iframeContainer.appendChild(iframe);
            return /* () */0;
          }));
  }
  initialHash[0] = Util$QueerLoop.getHash(/* () */0).slice(1);
  if (initialHash[0] === "") {
    initialHash[0] = new Date().toISOString();
    Util$QueerLoop.setHash(initialHash[0]);
  } else {
    onHashChange(/* () */0);
  }
  if (!Curry._1(hasBody, /* () */0)) {
    Util$QueerLoop.withQuerySelectorDom("svg.root", (function (svg) {
            svg.addEventListener("click", cycleThroughPast(/* () */0));
            return /* () */0;
          }));
  }
  Util$QueerLoop.withQuerySelectorDom("#codeContents", (function (el) {
          el.addEventListener("blur", (function (_evt) {
                  return Curry._1(onInput, /* () */0);
                }));
          return /* () */0;
        }));
  var response = function (srcCanvas, inputCode) {
    var input = inputCode.data;
    if (input !== "") {
      Hash$QueerLoop.hexDigest("SHA-1", input).then((function (hexHash) {
              var match = getTimestampAndLocaleString(/* () */0);
              if (!hasChanged[0]) {
                hasChanged[0] = true;
              }
              var alreadySeen = Belt_Option.isSome(Js_dict.get(dataSeen, hexHash));
              var isSelf = hexHash === currentSignature[0];
              if (isSelf || !alreadySeen) {
                dataSeen[hexHash] = input;
                Curry._1(writeLogEntry, /* tuple */[
                      match[0],
                      match[1],
                      isSelf ? "queer-loop" : input,
                      hexHash
                    ]);
                Util$QueerLoop.withQuerySelectorDom("#inputCanvas", (function (destCanvas) {
                        var $$location = inputCode.location;
                        var rect = JsQr$QueerLoop.extractAABB($$location);
                        var dw = rect[/* w */2];
                        var dh = rect[/* h */3];
                        if (destCanvas.width !== dw) {
                          destCanvas.width = dw;
                          destCanvas.height = dh;
                        }
                        var ctx = destCanvas.getContext("2d");
                        ctx.drawImage(srcCanvas, rect[/* x */0], rect[/* y */1], rect[/* w */2], rect[/* h */3], 0, 0, dw, dh);
                        return /* () */0;
                      }));
                Util$QueerLoop.setHash(new Date().toISOString());
              }
              return Promise.resolve(/* () */0);
            }));
      return /* () */0;
    } else {
      return 0;
    }
  };
  UserMedia$QueerLoop.getCameras(/* () */0).then((function (cameras) {
              camerasRef[0] = cameras;
              console.log("Cameras found:", cameras);
              return Promise.all($$Array.map((function (camera) {
                                var videoEl = document.createElementNS(Util$QueerLoop.htmlNs, "video");
                                return Scanner$QueerLoop.scanUsingDeviceId(videoEl, camera.deviceId, Options$QueerLoop.currentOptions, response);
                              }), pick(cameras, Options$QueerLoop.currentOptions[0][/* cameraIndices */9])));
            })).then((function (canvases) {
            canvasesRef[0] = canvases;
            requestAnimationFrame(onTick);
            console.log("Initalization complete.");
            queerLoopState[0] = /* Awake */2;
            return Promise.resolve(/* () */0);
          })).catch((function (err) {
          console.log("Camera input disabled.");
          console.log("Initalization complete.");
          Util$QueerLoop.withQuerySelectorDom("#welcome", (function (welcome) {
                  welcome.setAttribute("style", "display: block;");
                  return /* () */0;
                }));
          return Promise.resolve(/* () */0);
        }));
  return /* () */0;
}

function activateQueerLoop (){window.queerLoop = true;};

if (!window.queerLoop) {
  console.log("Initializing queer-loop...");
  Curry._1(activateQueerLoop, /* () */0);
  window.addEventListener("load", init);
  window.addEventListener("hashchange", onHashChange);
}

var defaultHash = "fff";

export {
  domain ,
  setBackground ,
  codeRegex ,
  defaultCode ,
  defaultHash ,
  initialHash ,
  camerasRef ,
  setSrc ,
  dataSeen ,
  currentSignature ,
  canvasesRef ,
  getTimestamp ,
  getTimestampAndLocaleString ,
  asOfNow ,
  setHashToNow ,
  hasChanged ,
  queerLoopState ,
  simulateSelfRecognition ,
  onClick ,
  _writeLogEntry ,
  writeLogEntry ,
  takeSnapshot ,
  copySnapshotToIcon ,
  hasBody ,
  withRootSvg ,
  setCode ,
  setText ,
  onHashChange ,
  frameCount ,
  lastFrame ,
  lastUpdated ,
  onTick ,
  maybeUrl ,
  _onInput ,
  onInput ,
  boolParam ,
  pick ,
  cycleThroughPast ,
  init ,
  activateQueerLoop ,
  
}
/* codeRegex Not a pure module */
