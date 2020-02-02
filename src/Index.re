open Canvas;
open Color;
open Hash;
open QrCodeGen;
open Options;
open SvgScript;
open Time;
open Util;

let domain = "qqq.lu";

let defaultCode = QrCode._encodeText("https://" ++ domain, Ecc.low);

let initialHash: ref(string) = ref("");

let camerasRef: ref(array(UserMedia.mediaDeviceInfo)) = ref([||]);

let setSrc = [%bs.raw (img, src) => {|
     img.src = src;|}];

let dataSeen: Js.Dict.t(string) = Js.Dict.empty();

let currentSignature: ref(string) = ref("");

let canvasesRef: ref(array(Dom.element)) = ref([||]);

let asOfNow = f => Js.Date.make() |> f;

let setHashToNow = _ => setHash(getTimestamp());

let hasChanged = ref(false);

let audioRecording = ref(false);
let maybeFilterBank: ref(option(Audio.filterBank)) = ref(None);

type state =
  | Asleep
  | Dreaming
  | Awake;

let queerLoopState: ref(state) = ref(Dreaming);

let simulateSelfRecognition = _ =>
  switch (queerLoopState^) {
  | Asleep
  | Awake
  | Dreaming =>
    Js.log("Simulating self recognition...");
    withQuerySelectorDom("#snapshotCanvas", snapshotCanvas => {
      let ctx = getContext(snapshotCanvas);
      let size = getWidth(snapshotCanvas);
      withQuerySelectorDom("img", codeImg =>
        Ctx.drawImageDestRect(
          ctx,
          ~image=codeImg,
          ~dx=0,
          ~dy=0,
          ~dw=size,
          ~dh=size,
        )
      );

      Ctx.drawImageDestRect(
        ctx,
        ~image=snapshotCanvas,
        ~dx=1,
        ~dy=1,
        ~dw=size - 1,
        ~dh=size - 1,
      );

      Scanner.runScanFromCanvas(
        snapshotCanvas,
        None,
        (canvas, qrCode) => {
          Js.log("simulating scan");
          Js.log("simulating scan");
        },
      );
    })
    |> ignore;
  };

let onClick = (maybeHash, _) => {
  if (! hasChanged^) {
    hasChanged := true;
  };

  switch (maybeHash) {
  | Some(hash) =>
    let becameActive =
      switch (Js.Dict.get(dataSeen, hash)) {
      | Some(_) => toggleHash(hash)
      | None => false
      };
    ();
  | None => setHashToNow()
  };
};

let _writeLogEntry = ((isoformat, localeString, text, hash)) =>
  Webapi.Dom.(
    withQuerySelectorDom("#log", log => {
      let entry = Document.createElement("a", document);
      Element.setAttribute("href", "#" ++ hash, entry);
      let linkClasses = Element.classList(entry);
      DomTokenList.addMany(
        [|"log-entry", "codeLink", "code" ++ hash|],
        linkClasses,
      );

      Element.addEventListener(
        "click",
        evt => {
          Event.preventDefault(evt);
          onClick(Some(hash), ());
        },
        entry,
      );

      let timeDiv = Document.createElement("div", document);
      let time = Document.createElement("time", document);
      Element.setAttribute("datetime", isoformat, time);
      Element.setTextContent(time, localeString);

      let textChild = Document.createElement("span", document);
      Element.setInnerText(textChild, text);

      let hashColor = Js.String.slice(~from=0, ~to_=6, hash);

      Element.setAttribute(
        "style",
        {j|background-color: #$(hashColor)66;|j},
        entry,
      );

      /* SpeechSynthesis.(speak(Utterance.make(localeString))); */

      Element.appendChild(time, timeDiv);
      Element.appendChild(timeDiv, entry);
      Element.appendChild(textChild, entry);
      Element.appendChild(entry, log);
    })
  )
  |> ignore;

let writeLogEntry = Debouncer.make(~wait=100, _writeLogEntry);

let takeSnapshot = codeImg =>
  withQuerySelectorDom("#snapshotCanvas", snapshotCanvas => {
    let snapshotCtx = getContext(snapshotCanvas);
    toDataURLjpg(snapshotCanvas, 0.9);
  });

let copySnapshotToIcon = _ =>
  withQuerySelectorDom("#iconCanvas", iconCanvas =>
    withQuerySelectorDom("#snapshotCanvas", snapshotCanvas => {
      let iconCtx = getContext(iconCanvas);

      Ctx.setGlobalAlpha(iconCtx, 1.0);
      Ctx.drawImageSourceRectDestRect(
        iconCtx,
        ~image=snapshotCanvas,
        ~sx=0,
        ~sy=0,
        ~sw=getWidth(snapshotCanvas),
        ~sh=getHeight(snapshotCanvas),
        ~dx=0,
        ~dy=0,
        ~dw=getWidth(iconCanvas),
        ~dh=getHeight(iconCanvas),
      );
    })
  );

type svgOrHtml =
  | Svg
  | Html;

let hasBody = [%bs.raw () => "return !!document.body;"];

let withRootSvg = (hash, f: Dom.element => unit) : unit =>
  Webapi.Dom.(
    if (hasBody()) {
      withQuerySelectorDom("#queer-loop", loopContainer =>
        switch (Element.querySelector("svg", loopContainer)) {
        | Some(svg) => f(svg)
        | None =>
          let svg = QueerCode.createSvgSkeleton(hash);
          Element.addEventListener("click", onClick(None), svg);
          Element.appendChild(svg, loopContainer);
          f(svg);
        }
      )
      |> ignore;
    } else {
      withQuerySelectorDom("svg.root", f) |> ignore;
    }
  );

let setOnClick: (Dom.element, Dom.event => unit) => unit = [%bs.raw
  (el, handler) => {|el.onclick = handler;|}
];

let simulateClick: Dom.element => unit = [%bs.raw el => {|el.click();|}];

let save = timestamp =>
  Webapi.Dom.(
    withRootSvg("", rootSvg => {
      let downloadLink = Document.createElementNS(htmlNs, "a", document);
      Element.setAttribute("download", timestamp ++ ".svg", downloadLink);

      withQuerySelectorDom("#htmlContainer", htmlContainer => {
        let blobObjectUrl = QueerCode.svgToBlobObjectURL(rootSvg);
        Element.setAttribute("href", blobObjectUrl, downloadLink);

        Element.appendChild(downloadLink, htmlContainer);
        simulateClick(downloadLink);

        Js_global.setTimeout(
          _ => {
            Js.log({j|Freeing memory from $timestamp.|j});
            Webapi.Url.revokeObjectURL(blobObjectUrl);
            Element.removeChild(downloadLink, htmlContainer);
            ();
          },
          0,
        );
      });
      ();
    })
  );

let hashCache: Js.Dict.t(string) = Js.Dict.empty();

let maybeCachedHexDigest = text =>
  switch (Js.Dict.get(hashCache, text)) {
  | Some(cachedHash) => Js.Promise.resolve(cachedHash)
  | None =>
    Hash.hexDigest("SHA-1", text)
    |> Js.Promise.then_(hash => {
         Js.Dict.set(hashCache, text, hash);
         Js.Promise.resolve(hash);
       })
  };

let toggleInversion = _ =>
  Webapi.Dom.(
    withQuerySelectorDom("#htmlContainer", htmlContainer => {
      let currentInversion = currentOptions^.invert;
      currentOptions := {...currentOptions^, invert: ! currentInversion};

      let classList = Element.classList(htmlContainer);
      if (currentOptions^.invert) {
        DomTokenList.add("invert", classList);
      } else {
        DomTokenList.remove("invert", classList);
      };
      withRootSvg("", rootSvg => {
        let classList = Element.classList(rootSvg);
        if (currentOptions^.invert) {
          DomTokenList.add("invert", classList);
        } else {
          DomTokenList.remove("invert", classList);
        };
      });
    })
    |> ignore
  );

let setCode = (text, date) =>
  maybeCachedHexDigest(text)
  |> Js.Promise.then_(hash => {
       Webapi.Dom.(
         withRootSvg(
           hash,
           rootSvg => {
             let alreadySeen =
               Belt.Option.isSome(Js.Dict.get(dataSeen, hash));

             if (! alreadySeen) {
               Js.Dict.set(dataSeen, hash, text);

               switch (maybeFilterBank^) {
               | Some(bank) =>
                 Audio.updateFilterBank(
                   ~filterBank=bank,
                   ~filterValues=AudioFilter.hashToChroma(hash),
                   (),
                 )
               | None => ()
               };

               let code =
                 Belt.Option.getWithDefault(
                   QrCode.encodeText(text, Ecc.medium),
                   defaultCode,
                 );
               let border = 6;
               let sizeWithBorder = QrCode.size(code) + border * 2;

               let isoformat = Js.Date.toISOString(date);
               let localeString = Js.Date.toLocaleString(date);

               let codeSvg =
                 QueerCode.createCodeSvg(
                   ~href=text,
                   ~hash,
                   ~code,
                   ~border,
                   ~localeString,
                   ~timestamp=isoformat,
                 );

               let codeImg = QueerCode.svgToImg(codeSvg);

               Element.addEventListener(
                 "load",
                 _ =>
                   withQuerySelectorDom("#centralGroup", centralGroup =>
                     switch (takeSnapshot()) {
                     | Some(snapshotUrl) =>
                       if (hasChanged^) {
                         QueerCode.addBackground(
                           ~codeSvg,
                           ~dataURL=snapshotUrl,
                           ~sizeWithBorder,
                         )
                         |> ignore;
                       };

                       Element.appendChild(codeSvg, centralGroup);

                       if (currentOptions^.animate) {
                         Element.setAttribute(
                           "class",
                           "root animationsEnabled",
                           rootSvg,
                         );
                       };

                       setAnimacy(rootSvg, hash);

                       let iconCodeImg =
                         QueerCode.codeToImage(~code, ~border, ~hash);

                       Element.addEventListener(
                         "load",
                         _evt =>
                           switch (
                             withQuerySelectorDom("#iconCanvas", iconCanvas => {
                               setWidth(iconCanvas, sizeWithBorder);
                               setHeight(iconCanvas, sizeWithBorder);
                               let ctx = getContext(iconCanvas);
                               copySnapshotToIcon();
                               Ctx.setGlobalAlpha(ctx, 0.5);
                               Ctx.drawImage(
                                 ctx,
                                 ~image=iconCodeImg,
                                 ~dx=0,
                                 ~dy=0,
                               );
                               toDataURL(iconCanvas);
                             })
                           ) {
                           | Some(iconUrl) =>
                             withQuerySelectorDom("#codes", container => {
                               let a =
                                 Document.createElementNS(
                                   htmlNs,
                                   "a",
                                   document,
                                 );
                               Element.setAttribute("href", "#" ++ hash, a);
                               let linkClasses = Element.classList(a);
                               DomTokenList.addMany(
                                 [|"codeLink", "code" ++ hash|],
                                 linkClasses,
                               );

                               let img =
                                 Document.createElementNS(
                                   htmlNs,
                                   "img",
                                   document,
                                 );
                               Element.setAttribute("src", iconUrl, img);

                               Element.appendChild(img, a);
                               Element.addEventListener(
                                 "click",
                                 evt => {
                                   Event.preventDefault(evt);
                                   onClick(Some(hash), ());
                                 },
                                 a,
                               );
                               Element.appendChild(a, container);
                             })
                             |> ignore
                           | None => ()
                           },
                         iconCodeImg,
                       );

                       withQuerySelectorDom("#download", a => {
                         let downloadOnClickHandler = evt => save(isoformat);
                         setOnClick(a, downloadOnClickHandler);
                       });

                       currentSignature := hash;
                     | None => ()
                     }
                   )
                   |> ignore,
                 codeImg,
               );
             };
           },
         )
       );

       Js.Promise.resolve();
     })
  |> ignore;

let setText =
  Debouncer.make(~wait=200, hash =>
    withQuerySelectorDom("#codeContents", el =>
      Webapi.Dom.Element.setInnerText(el, decodeURIComponent(hash))
    )
    |> ignore
  );

let onHashChange = _evt => {
  open Webapi.Dom;
  let opts = currentOptions^;

  let url = Webapi.Url.make(Location.href(Window.location(window)));

  let date =
    switch (
      maybeDeserializeTime(
        Js.String.sliceToEnd(~from=1, Webapi.Url.hash(url)),
      )
    ) {
    | Some(date) => date
    | None => Js.Date.make()
    };

  let isoformat = Js.Date.toISOString(date);
  let localeString = Js.Date.toLocaleString(date);

  withQuerySelectorDom("title", title =>
    Element.setInnerText(
      title,
      switch (currentOptions^.title) {
      | Some(titleStr) => titleStr
      | None => localeString
      },
    )
  );

  withQuerySelectorDom("time", time => {
    Element.setAttribute("datetime", isoformat, time);
    Element.setInnerText(time, localeString);
  });
  let urlText =
    (opts.includeDomain ? Webapi.Url.origin(url) : "")
    ++ (opts.includeQueryString ? Webapi.Url.search(url) : "")
    ++ (opts.includeHash ? Webapi.Url.hash(url) : "");

  setCode(urlText, date);
  setText(urlText);
};

let frameCount = ref(0);

let lastFrame = ref(0.0);
let lastUpdated = ref(0.0);

let rec onTick = ts => {
  frameCount := frameCount^ + 1;

  /* if (ts -. lastUpdated^ >= 10000.0) { */
  /*   lastUpdated := ts; */
  /* }; */

  Webapi.requestAnimationFrame(onTick);
};

let maybeUrl: string => option(Webapi.Url.t) =
  s =>
    switch (Webapi.Url.make(s)) {
    | url => Some(url)
    | exception e =>
      Js_console.error2("Could not parse URL", e);
      None;
    };

let _onInput = _ =>
  Webapi.Dom.(
    withQuerySelectorDom("#codeContents", el => {
      let text = Element.innerText(el);
      maybeUrl(text)
      |. Belt.Option.map(url => {
           Location.setSearch(Window.location(window));
           Location.setHash(Window.location(window), Webapi.Url.hash(url));
         });
    })
    |> ignore
  );

let onInput = Debouncer.make(~wait=100, _onInput);

let boolParam: (bool, option(string)) => bool =
  default =>
    fun
    | None => default
    | Some(s) => s === "true" || s === "1" || s === "y" || s === "";

let pick: (array('a), array(int)) => array('a) =
  (ary, indices) => Array.map(i => ary[i], indices);

let cycleThroughPast = _ => {
  open Webapi.Dom;
  let allIds =
    withQuerySelectorAll(
      ".code",
      mapMaybe(item => Element.getAttribute("id", item)),
    );
  let currentId =
    Belt.Option.getWithDefault(
      Belt.Option.getWithDefault(
        withQuerySelectorDom(".animate", live => {
          removeClassSvg(live, "animate");
          addClassSvg(live, "active");
          Element.getAttribute("id", live);
        }),
        None,
      ),
      "",
    );
  let i = ref(Js.Array.indexOf(currentId, allIds));
  let step: unit => unit =
    _ => {
      withQuerySelectorDom(".active", live => removeClassSvg(live, "active"))
      |> ignore;
      i := (i^ + 1) mod Array.length(allIds);
      withQuerySelectorDom("#" ++ allIds[i^], live =>
        addClassSvg(live, "active")
      )
      |> ignore;
    };
  step;
};

let maybeAudioContext: ref(option(Audio.audioContext)) = ref(None);
let maybeAudioInputNode: ref(option(Audio.audioNode)) = ref(None);
let maybeDelay: ref(option(AudioDelay.t)) = ref(None);

[@bs.deriving abstract]
type complexSpectrum = {
  [@bs.as "real"]
  floatReal: array(float),
  [@bs.as "imag"]
  floatImag: array(float),
};

let featuresCallback:
  {
    .
    "rms": float,
    "chroma": array(float),
  } =>
  unit =
  features => {
    open Audio;
    open Webapi.Dom;
    let rms = features##rms;
    let rmsS = Js.Float.toString(sqrt(rms));
    withQuerySelectorDom("#chromaBackdrop", chromaBackdrop =>
      Element.setAttribute("style", {j|opacity: $rmsS|j}, chromaBackdrop)
    )
    |> ignore;

    let chroma = features##chroma;
    Array.iteri(
      (i, v) =>
        withQuerySelectorDom(
          "#pc" ++ string_of_int((i + 5) mod 12),
          pc => {
            let vStr = Js.Float.toString(v);
            Element.setAttribute("style", {j|opacity: $vStr|j}, pc);
          },
        )
        |> ignore,
      chroma,
    );
  };

let enableAudio = _ => {
  let audioContext: Audio.audioContext =
    switch (maybeAudioContext^) {
    | Some(ctx) => ctx
    | None =>
      let ctx = Audio.make();
      maybeAudioContext := Some(ctx);
      ctx;
    };

  Audio.getAudioSource(audioContext)
  |> Js.Promise.then_(maybeSource => {
       maybeAudioInputNode := maybeSource;
       switch (maybeSource) {
       | Some(sourceNode) =>
         if (audioRecording^) {
           maybeFilterBank :=
             AudioFilter.init(
               ~audioContext,
               ~sourceNode,
               ~output=Audio.defaultSink(audioContext),
               (),
             );
         };
         let opts =
           Meyda.analyzerOpts(
             ~audioContext,
             ~source=sourceNode,
             ~bufferSize=4096,
             ~featureExtractors=[|"rms", "chroma", "buffer"|],
             ~callback=featuresCallback,
           );
         let analyzer = Meyda.createMeydaAnalyzer(opts);
         Meyda.start(analyzer);
       | None => ()
       };
       Js.Promise.resolve();
     });
  ();
};

let showHide = _evt =>
  withQuerySelectorDom("#queer-loop", loop => {
    open Webapi.Dom;
    let classes = Element.classList(loop);
    DomTokenList.toggle("hidden", classes);
    ();
  })
  |> ignore;

let makeIframe = url =>
  Webapi.Dom.(
    withQuerySelectorDom("#iframeContainer", iframeContainer => {
      let iframe = Document.createElementNS(htmlNs, "iframe", document);
      Element.setAttribute(
        "width",
        string_of_int(Window.innerWidth(window)),
        iframe,
      );
      Element.setAttribute(
        "height",
        string_of_int(Window.innerHeight(window)),
        iframe,
      );
      Element.setAttribute(
        "allow",
        "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; microphone; camera",
        iframe,
      );

      Element.setAttribute("src", url, iframe);

      Element.appendChild(iframe, iframeContainer);
    })
  )
  |> ignore;

let init = _evt => {
  open HtmlShell;
  open Webapi.Dom;
  module URLSearchParams = Webapi.Url.URLSearchParams;
  setup();
  createIconButtonWithCallback("#toolbar", "mic", _evt => enableAudio());
  createIconButtonWithCallback("#toolbar", "hide", showHide);
  createIconButtonWithCallback("#toolbar", "invert", _evt =>
    toggleInversion()
  );

  withQuerySelectorDom("#snapshotCanvas", canvas => {
    setWidth(canvas, 480);
    setHeight(canvas, 480);
  });

  let queryString = getQueryString();
  if (queryString !== "") {
    let params = URLSearchParams.make(queryString);

    let cameraIndices =
      Array.map(int_of_string, URLSearchParams.getAll("c", params));

    currentOptions :=
      {
        includeDomain:
          boolParam(
            currentOptions^.includeDomain,
            URLSearchParams.get("d", params),
          ),
        includeQueryString:
          boolParam(
            currentOptions^.includeQueryString,
            URLSearchParams.get("q", params),
          ),
        includeHash:
          boolParam(
            currentOptions^.includeHash,
            URLSearchParams.get("h", params),
          ),
        invert:
          boolParam(
            currentOptions^.invert,
            URLSearchParams.get("i", params),
          ),
        animate:
          boolParam(
            currentOptions^.animate,
            URLSearchParams.get("a", params),
          ),
        opacity:
          Belt.Option.getWithDefault(
            Belt.Option.map(
              URLSearchParams.get("o", params),
              Js.Float.fromString,
            ),
            currentOptions^.opacity,
          ),
        background:
          Belt.Option.getWithDefault(
            Belt.Option.map(
              URLSearchParams.get("b", params),
              decodeURIComponent,
            ),
            currentOptions^.background,
          ),
        cameraIndices:
          Array.length(cameraIndices) == 0 ? [|0|] : cameraIndices,
        url: URLSearchParams.get("u", params),
        title: URLSearchParams.get("t", params),
        poem: URLSearchParams.get("p", params),
        wiki: URLSearchParams.get("w", params),
        youtubeVideo: URLSearchParams.get("v", params),
      };
  };

  if (currentOptions^.background != "") {
    setBackground(".background", currentOptions^.background) |> ignore;
  };

  switch (currentOptions^.url) {
  | Some(url) => makeIframe(url)
  | None => ()
  };

  switch (currentOptions^.youtubeVideo) {
  | Some(ytId) =>
    let url = {j|https://www.youtube-nocookie.com/embed/$ytId?cc_load_policy=1&autoplay=1|j};
    makeIframe(url);
  | None => ()
  };

  switch (currentOptions^.poem) {
  | Some(poem) =>
    let url = {j|https://poets.org/poem/$poem?mbd=1|j};
    makeIframe(url);
  | None => ()
  };

  switch (currentOptions^.wiki) {
  | Some(wiki) =>
    let url = {j|https://en.m.wikipedia.org/wiki/$wiki|j};
    makeIframe(url);
  | None => ()
  };

  initialHash := Js.String.sliceToEnd(~from=1, getHash());
  if (initialHash^ == "") {
    initialHash := getTimestamp();
    setHash(initialHash^);
  } else {
    onHashChange();
  };

  if (! hasBody()) {
    /* Element.addEventListener("click", onClick(None), svg) */
    let stepFn = cycleThroughPast();
    let lastUpdated = ref(0.0);
    let rec onTick = ts => {
      if (ts -. lastUpdated^ >= 500.0) {
        stepFn();
        lastUpdated := ts;
      };
      Webapi.requestAnimationFrame(onTick);
    };
    Webapi.requestAnimationFrame(onTick);
  };

  withQuerySelectorDom("#codeContents", el =>
    Element.addEventListener("blur", _evt => onInput(), el)
  );

  let response = (srcCanvas, inputCode) => {
    let input = JsQr.textDataGet(inputCode);
    if (input !== "") {
      maybeCachedHexDigest(input)
      |> Js.Promise.then_(hexHash => {
           let date = Js.Date.make();
           let isoformat = Js.Date.toISOString(date);
           let localeString = Js.Date.toLocaleString(date);

           if (! hasChanged^) {
             hasChanged := true;
           };
           withQuerySelectorDom("#inputCanvas", destCanvas => {
             open JsQr;
             let location = locationGet(inputCode);
             let rect = extractAABB(location);
             let dw = rect.w;
             let dh = rect.h;
             if (getWidth(destCanvas) !== dw) {
               setWidth(destCanvas, dw);
               setHeight(destCanvas, dh);
             };
             let ctx = getContext(destCanvas);

             Ctx.drawImageSourceRectDestRect(
               ctx,
               ~image=srcCanvas,
               ~sx=rect.x,
               ~sy=rect.y,
               ~sw=rect.w,
               ~sh=rect.h,
               ~dx=0,
               ~dy=0,
               ~dw,
               ~dh,
             );
           });

           let alreadySeen =
             Belt.Option.isSome(Js.Dict.get(dataSeen, hexHash));
           let isSelf = hexHash === currentSignature^;

           if (isSelf || ! alreadySeen) {
             Js.Dict.set(dataSeen, hexHash, input);

             writeLogEntry((
               isoformat,
               localeString,
               isSelf ? "queer-loop" : input,
               hexHash,
             ));

             setHashToNow();
           };
           Js.Promise.resolve();
         })
      |> ignore;
    };
  };

  UserMedia.getCameras()
  |> Js.Promise.then_(cameras => {
       camerasRef := cameras;
       Js.log2("Cameras found:", cameras);

       Js.Promise.all(
         Array.map(
           camera => {
             let videoEl =
               Document.createElementNS(htmlNs, "video", document);

             Scanner.scanUsingDeviceId(
               videoEl,
               UserMedia.deviceIdGet(camera),
               currentOptions,
               response,
             );
           },
           pick(
             cameras,
             Array.map(
               x => x mod Array.length(cameras),
               currentOptions^.cameraIndices,
             ),
           ),
         ),
       );
     })
  |> Js.Promise.then_(canvases => {
       canvasesRef := canvases;

       Webapi.requestAnimationFrame(onTick);

       Js.log("Initalization complete.");
       queerLoopState := Awake;

       Js.Promise.resolve();
     })
  |> Js.Promise.catch(err => {
       Js.Console.log("Camera input disabled.");
       Js.log("Initalization complete.");
       withQuerySelectorDom("#welcome", welcome =>
         Element.setAttribute("style", "display: block;", welcome)
       );
       Js.Promise.resolve();
     })
  |> ignore;

  ();
};

[@bs.val] [@bs.scope "window"] external queerLoop : bool = "";

let activateQueerLoop: unit => unit = [%bs.raw
  () => "window.queerLoop = true;"
];

if (! queerLoop) {
  open Webapi.Dom;
  Js.log("Initializing queer-loop...");
  activateQueerLoop();

  /* let db = IndexedDB.DB.open_(~name="queer-loop", ~version=1, ()); */
  /* db; */
  Window.addEventListener("load", init, Webapi.Dom.window);
  Window.addEventListener("hashchange", onHashChange, Webapi.Dom.window);
};
