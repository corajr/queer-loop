// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE

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
import * as Time$QueerLoop from "./Time.bs.js";
import * as Util$QueerLoop from "./Util.bs.js";
import * as Audio$QueerLoop from "./Audio.bs.js";
import * as Options$QueerLoop from "./Options.bs.js";
import * as Scanner$QueerLoop from "./Scanner.bs.js";
import * as Caml_js_exceptions from "../node_modules/bs-platform/lib/es6/caml_js_exceptions.js";
import * as HtmlShell$QueerLoop from "./HtmlShell.bs.js";
import * as QrCodeGen$QueerLoop from "./QrCodeGen.bs.js";
import * as QueerCode$QueerLoop from "./QueerCode.bs.js";
import * as SvgScript$QueerLoop from "./SvgScript.bs.js";
import * as UserMedia$QueerLoop from "./UserMedia.bs.js";
import * as AudioFilter$QueerLoop from "./AudioFilter.bs.js";

var domain = "qqq.lu";

var defaultCode = QrCodeGen$QueerLoop.QrCode._encodeText("https://qqq.lu", QrCodeGen$QueerLoop.Ecc.low);

var initialHash = {
  contents: ""
};

var camerasRef = {
  contents: /* array */[]
};

function setSrc (img,src){
     img.src = src;};

var dataSeen = { };

var currentSignature = {
  contents: ""
};

var canvasesRef = {
  contents: /* array */[]
};

function asOfNow(f) {
  return Curry._1(f, new Date());
}

function setHashToNow(param) {
  return Util$QueerLoop.setHash(Time$QueerLoop.getTimestamp(/* () */0));
}

var hasChanged = {
  contents: false
};

var audioRecording = {
  contents: false
};

var maybeFilterBank = {
  contents: undefined
};

var queerLoopState = {
  contents: /* Dreaming */1
};

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
  if (!hasChanged.contents) {
    hasChanged.contents = true;
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
    return Util$QueerLoop.setHash(Time$QueerLoop.getTimestamp(/* () */0));
  }
}

function _writeLogEntry(param) {
  var hash = param[3];
  var text = param[2];
  var localeString = param[1];
  var isoformat = param[0];
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
          time.setAttribute("datetime", isoformat);
          time.textContent = localeString;
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

function setOnClick (el,handler){el.onclick = handler;};

function simulateClick (el){el.click();};

function save(timestamp) {
  return withRootSvg("", (function (rootSvg) {
                var downloadLink = document.createElementNS(Util$QueerLoop.htmlNs, "a");
                downloadLink.setAttribute("download", timestamp + ".svg");
                Util$QueerLoop.withQuerySelectorDom("#htmlContainer", (function (htmlContainer) {
                        var blobObjectUrl = QueerCode$QueerLoop.svgToBlobObjectURL(rootSvg);
                        downloadLink.setAttribute("href", blobObjectUrl);
                        htmlContainer.appendChild(downloadLink);
                        simulateClick(downloadLink);
                        return setTimeout((function (param) {
                                      console.log("Freeing memory from " + (String(timestamp) + "."));
                                      URL.revokeObjectURL(blobObjectUrl);
                                      htmlContainer.removeChild(downloadLink);
                                      return /* () */0;
                                    }), 0);
                      }));
                return /* () */0;
              }));
}

var hashCache = { };

function maybeCachedHexDigest(text) {
  var match = Js_dict.get(hashCache, text);
  if (match !== undefined) {
    return Promise.resolve(match);
  } else {
    return Hash$QueerLoop.hexDigest("SHA-1", text).then((function (hash) {
                  hashCache[text] = hash;
                  return Promise.resolve(hash);
                }));
  }
}

function toggleInversion(param) {
  Util$QueerLoop.withQuerySelectorDom("#htmlContainer", (function (htmlContainer) {
          var currentInversion = Options$QueerLoop.currentOptions.contents.invert;
          var init = Options$QueerLoop.currentOptions.contents;
          Options$QueerLoop.currentOptions.contents = {
            background: init.background,
            includeDomain: init.includeDomain,
            includeQueryString: init.includeQueryString,
            includeHash: init.includeHash,
            invert: !currentInversion,
            animate: init.animate,
            opacity: init.opacity,
            title: init.title,
            url: init.url,
            poem: init.poem,
            wiki: init.wiki,
            youtubeVideo: init.youtubeVideo,
            cameraIndices: init.cameraIndices
          };
          var classList = htmlContainer.classList;
          if (Options$QueerLoop.currentOptions.contents.invert) {
            classList.add("invert");
          } else {
            classList.remove("invert");
          }
          return withRootSvg("", (function (rootSvg) {
                        var classList = rootSvg.classList;
                        if (Options$QueerLoop.currentOptions.contents.invert) {
                          classList.add("invert");
                          return /* () */0;
                        } else {
                          classList.remove("invert");
                          return /* () */0;
                        }
                      }));
        }));
  return /* () */0;
}

function setCode(text, date) {
  maybeCachedHexDigest(text).then((function (hash) {
          withRootSvg(hash, (function (rootSvg) {
                  var alreadySeen = Belt_Option.isSome(Js_dict.get(dataSeen, hash));
                  if (alreadySeen) {
                    return 0;
                  } else {
                    dataSeen[hash] = text;
                    var match = maybeFilterBank.contents;
                    if (match !== undefined) {
                      Audio$QueerLoop.updateFilterBank(undefined, undefined, match, AudioFilter$QueerLoop.hashToChroma(hash), /* () */0);
                    }
                    var code = Belt_Option.getWithDefault(QrCodeGen$QueerLoop.QrCode.encodeText(text, QrCodeGen$QueerLoop.Ecc.medium), defaultCode);
                    var sizeWithBorder = code.size + 12 | 0;
                    var isoformat = date.toISOString();
                    var localeString = date.toLocaleString();
                    var codeSvg = QueerCode$QueerLoop.createCodeSvg(text, code, hash, localeString, isoformat, 6);
                    var codeImg = QueerCode$QueerLoop.svgToImg(codeSvg);
                    codeImg.addEventListener("load", (function (param) {
                            Util$QueerLoop.withQuerySelectorDom("#centralGroup", (function (centralGroup) {
                                    var match = takeSnapshot(/* () */0);
                                    if (match !== undefined) {
                                      if (hasChanged.contents) {
                                        QueerCode$QueerLoop.addBackground(codeSvg, sizeWithBorder, match);
                                      }
                                      centralGroup.appendChild(codeSvg);
                                      if (Options$QueerLoop.currentOptions.contents.animate) {
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
                                      Util$QueerLoop.withQuerySelectorDom("#download", (function (a) {
                                              var downloadOnClickHandler = function (evt) {
                                                return save(isoformat);
                                              };
                                              return setOnClick(a, downloadOnClickHandler);
                                            }));
                                      currentSignature.contents = hash;
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
  var opts = Options$QueerLoop.currentOptions.contents;
  var url = new URL(window.location.href);
  var match = Time$QueerLoop.maybeDeserializeTime(url.hash.slice(1));
  var date = match !== undefined ? Caml_option.valFromOption(match) : new Date();
  var isoformat = date.toISOString();
  var localeString = date.toLocaleString();
  Util$QueerLoop.withQuerySelectorDom("title", (function (title) {
          var match = Options$QueerLoop.currentOptions.contents.title;
          title.innerText = match !== undefined ? match : localeString;
          return /* () */0;
        }));
  Util$QueerLoop.withQuerySelectorDom("time", (function (time) {
          time.setAttribute("datetime", isoformat);
          time.innerText = localeString;
          return /* () */0;
        }));
  var match$1 = opts.includeDomain;
  var match$2 = opts.includeQueryString;
  var match$3 = opts.includeHash;
  var urlText = (
    match$1 ? url.origin : ""
  ) + ((
      match$2 ? url.search : ""
    ) + (
      match$3 ? url.hash : ""
    ));
  setCode(urlText, date);
  return Curry._1(setText, urlText);
}

var frameCount = {
  contents: 0
};

var lastFrame = {
  contents: 0.0
};

var lastUpdated = {
  contents: 0.0
};

function onTick(ts) {
  frameCount.contents = frameCount.contents + 1 | 0;
  requestAnimationFrame(onTick);
  return /* () */0;
}

function maybeUrl(s) {
  var url;
  try {
    url = new URL(s);
  }
  catch (raw_e){
    var e = Caml_js_exceptions.internalToOCamlException(raw_e);
    console.error("Could not parse URL", e);
    return ;
  }
  return Caml_option.some(url);
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
  var i = {
    contents: allIds.indexOf(currentId)
  };
  return (function (param) {
      Util$QueerLoop.withQuerySelectorDom(".active", (function (live) {
              return SvgScript$QueerLoop.removeClassSvg(live, "active");
            }));
      i.contents = Caml_int32.mod_(i.contents + 1 | 0, allIds.length);
      Util$QueerLoop.withQuerySelectorDom("#" + Caml_array.caml_array_get(allIds, i.contents), (function (live) {
              return SvgScript$QueerLoop.addClassSvg(live, "active");
            }));
      return /* () */0;
    });
}

var maybeAudioContext = {
  contents: undefined
};

var maybeAudioInputNode = {
  contents: undefined
};

var maybeDelay = {
  contents: undefined
};

function featuresCallback(features) {
  var rms = features.rms;
  var rmsS = Math.sqrt(rms).toString();
  Util$QueerLoop.withQuerySelectorDom("#chromaBackdrop", (function (chromaBackdrop) {
          chromaBackdrop.setAttribute("style", "opacity: " + (String(rmsS) + ""));
          return /* () */0;
        }));
  var chroma = features.chroma;
  return $$Array.iteri((function (i, v) {
                Util$QueerLoop.withQuerySelectorDom("#pc" + String((i + 5 | 0) % 12), (function (pc) {
                        var vStr = v.toString();
                        pc.setAttribute("style", "opacity: " + (String(vStr) + ""));
                        return /* () */0;
                      }));
                return /* () */0;
              }), chroma);
}

function enableAudio(param) {
  var match = maybeAudioContext.contents;
  var audioContext;
  if (match !== undefined) {
    audioContext = Caml_option.valFromOption(match);
  } else {
    var ctx = new (window.AudioContext)();
    maybeAudioContext.contents = Caml_option.some(ctx);
    audioContext = ctx;
  }
  Audio$QueerLoop.getAudioSource(audioContext).then((function (maybeSource) {
          maybeAudioInputNode.contents = maybeSource;
          if (maybeSource !== undefined) {
            var sourceNode = maybeSource;
            if (audioRecording.contents) {
              maybeFilterBank.contents = AudioFilter$QueerLoop.init(audioContext, sourceNode, audioContext.destination, /* () */0);
            }
            var opts = {
              audioContext: audioContext,
              source: sourceNode,
              bufferSize: 4096,
              featureExtractors: /* array */[
                "rms",
                "chroma",
                "buffer"
              ],
              callback: featuresCallback
            };
            var analyzer = Meyda.createMeydaAnalyzer(opts);
            analyzer.start();
          }
          return Promise.resolve(/* () */0);
        }));
  return /* () */0;
}

function showHide(_evt) {
  Util$QueerLoop.withQuerySelectorDom("#queer-loop", (function (loop) {
          var classes = loop.classList;
          classes.toggle("hidden");
          return /* () */0;
        }));
  return /* () */0;
}

function makeIframe(url) {
  Util$QueerLoop.withQuerySelectorDom("#iframeContainer", (function (iframeContainer) {
          var iframe = document.createElementNS(Util$QueerLoop.htmlNs, "iframe");
          iframe.setAttribute("width", String(window.innerWidth));
          iframe.setAttribute("height", String(window.innerHeight));
          iframe.setAttribute("allow", "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; microphone; camera");
          iframe.setAttribute("src", url);
          iframeContainer.appendChild(iframe);
          return /* () */0;
        }));
  return /* () */0;
}

function init(_evt) {
  HtmlShell$QueerLoop.setup(/* () */0);
  HtmlShell$QueerLoop.createIconButtonWithCallback("#toolbar", "mic", (function (_evt) {
          return enableAudio(/* () */0);
        }));
  HtmlShell$QueerLoop.createIconButtonWithCallback("#toolbar", "hide", showHide);
  HtmlShell$QueerLoop.createIconButtonWithCallback("#toolbar", "invert", (function (_evt) {
          return toggleInversion(/* () */0);
        }));
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
    Options$QueerLoop.currentOptions.contents = {
      background: Belt_Option.getWithDefault(Belt_Option.map(Caml_option.nullable_to_opt(params.get("b")), (function (prim) {
                  return decodeURIComponent(prim);
                })), Options$QueerLoop.currentOptions.contents.background),
      includeDomain: boolParam(Options$QueerLoop.currentOptions.contents.includeDomain, Caml_option.nullable_to_opt(params.get("d"))),
      includeQueryString: boolParam(Options$QueerLoop.currentOptions.contents.includeQueryString, Caml_option.nullable_to_opt(params.get("q"))),
      includeHash: boolParam(Options$QueerLoop.currentOptions.contents.includeHash, Caml_option.nullable_to_opt(params.get("h"))),
      invert: boolParam(Options$QueerLoop.currentOptions.contents.invert, Caml_option.nullable_to_opt(params.get("i"))),
      animate: boolParam(Options$QueerLoop.currentOptions.contents.animate, Caml_option.nullable_to_opt(params.get("a"))),
      opacity: Belt_Option.getWithDefault(Belt_Option.map(Caml_option.nullable_to_opt(params.get("o")), (function (prim) {
                  return Number(prim);
                })), Options$QueerLoop.currentOptions.contents.opacity),
      title: Caml_option.nullable_to_opt(params.get("t")),
      url: Caml_option.nullable_to_opt(params.get("u")),
      poem: Caml_option.nullable_to_opt(params.get("p")),
      wiki: Caml_option.nullable_to_opt(params.get("w")),
      youtubeVideo: Caml_option.nullable_to_opt(params.get("v")),
      cameraIndices: match ? /* array */[0] : cameraIndices
    };
  }
  if (Options$QueerLoop.currentOptions.contents.background !== "") {
    Util$QueerLoop.setBackground(".background", Options$QueerLoop.currentOptions.contents.background);
  }
  var match$1 = Options$QueerLoop.currentOptions.contents.url;
  if (match$1 !== undefined) {
    makeIframe(match$1);
  }
  var match$2 = Options$QueerLoop.currentOptions.contents.youtubeVideo;
  if (match$2 !== undefined) {
    makeIframe("https://www.youtube-nocookie.com/embed/" + (String(match$2) + "?cc_load_policy=1&autoplay=1"));
  }
  var match$3 = Options$QueerLoop.currentOptions.contents.poem;
  if (match$3 !== undefined) {
    makeIframe("https://poets.org/poem/" + (String(match$3) + "?mbd=1"));
  }
  var match$4 = Options$QueerLoop.currentOptions.contents.wiki;
  if (match$4 !== undefined) {
    makeIframe("https://en.m.wikipedia.org/wiki/" + (String(match$4) + ""));
  }
  initialHash.contents = Util$QueerLoop.getHash(/* () */0).slice(1);
  if (initialHash.contents === "") {
    initialHash.contents = Time$QueerLoop.getTimestamp(/* () */0);
    Util$QueerLoop.setHash(initialHash.contents);
  } else {
    onHashChange(/* () */0);
  }
  if (!Curry._1(hasBody, /* () */0)) {
    var stepFn = cycleThroughPast(/* () */0);
    var lastUpdated = {
      contents: 0.0
    };
    var onTick$1 = function (ts) {
      if (ts - lastUpdated.contents >= 500.0) {
        Curry._1(stepFn, /* () */0);
        lastUpdated.contents = ts;
      }
      requestAnimationFrame(onTick$1);
      return /* () */0;
    };
    requestAnimationFrame(onTick$1);
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
      maybeCachedHexDigest(input).then((function (hexHash) {
              var date = new Date();
              var isoformat = date.toISOString();
              var localeString = date.toLocaleString();
              if (!hasChanged.contents) {
                hasChanged.contents = true;
              }
              Util$QueerLoop.withQuerySelectorDom("#inputCanvas", (function (destCanvas) {
                      var $$location = inputCode.location;
                      var rect = JsQr$QueerLoop.extractAABB($$location);
                      var dw = rect.w;
                      var dh = rect.h;
                      if (destCanvas.width !== dw) {
                        destCanvas.width = dw;
                        destCanvas.height = dh;
                      }
                      var ctx = destCanvas.getContext("2d");
                      ctx.drawImage(srcCanvas, rect.x, rect.y, rect.w, rect.h, 0, 0, dw, dh);
                      return /* () */0;
                    }));
              var alreadySeen = Belt_Option.isSome(Js_dict.get(dataSeen, hexHash));
              var isSelf = hexHash === currentSignature.contents;
              if (isSelf || !alreadySeen) {
                dataSeen[hexHash] = input;
                Curry._1(writeLogEntry, /* tuple */[
                      isoformat,
                      localeString,
                      isSelf ? "queer-loop" : input,
                      hexHash
                    ]);
                Util$QueerLoop.setHash(Time$QueerLoop.getTimestamp(/* () */0));
              }
              return Promise.resolve(/* () */0);
            }));
      return /* () */0;
    } else {
      return 0;
    }
  };
  UserMedia$QueerLoop.getCameras(/* () */0).then((function (cameras) {
              camerasRef.contents = cameras;
              console.log("Cameras found:", cameras);
              return Promise.all($$Array.map((function (camera) {
                                var videoEl = document.createElementNS(Util$QueerLoop.htmlNs, "video");
                                return Scanner$QueerLoop.scanUsingDeviceId(videoEl, camera.deviceId, Options$QueerLoop.currentOptions, response);
                              }), pick(cameras, $$Array.map((function (x) {
                                        return Caml_int32.mod_(x, cameras.length);
                                      }), Options$QueerLoop.currentOptions.contents.cameraIndices))));
            })).then((function (canvases) {
            canvasesRef.contents = canvases;
            requestAnimationFrame(onTick);
            console.log("Initalization complete.");
            queerLoopState.contents = /* Awake */2;
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

export {
  domain ,
  defaultCode ,
  initialHash ,
  camerasRef ,
  setSrc ,
  dataSeen ,
  currentSignature ,
  canvasesRef ,
  asOfNow ,
  setHashToNow ,
  hasChanged ,
  audioRecording ,
  maybeFilterBank ,
  queerLoopState ,
  simulateSelfRecognition ,
  onClick ,
  _writeLogEntry ,
  writeLogEntry ,
  takeSnapshot ,
  copySnapshotToIcon ,
  hasBody ,
  withRootSvg ,
  setOnClick ,
  simulateClick ,
  save ,
  hashCache ,
  maybeCachedHexDigest ,
  toggleInversion ,
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
  maybeAudioContext ,
  maybeAudioInputNode ,
  maybeDelay ,
  featuresCallback ,
  enableAudio ,
  showHide ,
  makeIframe ,
  init ,
  activateQueerLoop ,
  
}
/* defaultCode Not a pure module */
