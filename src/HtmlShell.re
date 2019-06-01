/** Add in the basic structure/style of the HTML page. **/
open Webapi.Dom;
open Util;

let styleText = {|
h1 { display: none; }

body { margin: 0; font-family: "courier new", monospace; }
canvas {
  display: none;
  pointer-events: none;
}

iframe, video {
  position: fixed;
  min-width: 100vw;
  min-height: 100vh;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  mix-blend-mode: screen;
}

.invert iframe, .invert video {
  mix-blend-mode: multiply;
}

video {
  pointer-events: none;
}

#welcome {
  display: none;
}

#download {
  position: fixed;
  z-index: 100;
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 0%);
  font-size: 12.5vmin;
  text-decoration: none;
  color: white;
}

#download:visited {
  color: white;
}

#htmlcontainer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 95vw;
  height: 95vh;
}

@media (orientation: landscape) {
  #htmlcontainer {
      flex-direction: row;
  }
}

@media (orientation: portrait) {
  #htmlcontainer {
      flex-direction: column;
  }
}

#codes {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: flex-start;
  z-index: 100;
  flex-basis: 20%;
}

#focus {
  flex-basis: 45%;
}

#queer-loop {
  z-index: 100;
  margin: auto;
  position: fixed;
  width: 480px;
  height: 480px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

#log {
  flex-basis: 20%;
  flex-wrap: wrap;
  z-index: 100;
}

.log-entry {
  display: inline-flex;
  flex-direction: column;
  padding: 1em;
  text-decoration: none;
  color: white;
}

.log-entry:active, .log-entry:visited {
  color: white;
}

.log-entry div {
  display: flex;
}

.codelink.active {
  position: relative;
}

.codelink.active:after {
  position: absolute;
  content: '';
  display: block;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 6px solid rgba(255, 255, 255, 0.5);
}
#codetext {
  display: none;
}

#codecontents {
  color: white;
  mix-blend-mode: difference;
}

|};

let createStyle = () : Dom.element => {
  let style = DocumentRe.createElementNS(htmlNs, "style", document);
  ElementRe.setAttribute("type", "text/css", style);

  ElementRe.setTextContent(style, styleText);
  style;
};

let createStructureOn = (htmlContainer: Dom.element) : unit => {
  let snapshotCanvas = createElementWithId("canvas", "snapshotCanvas");
  let iconCanvas = createElementWithId("canvas", "iconCanvas");

  let sources = createElementWithId("div", "sources");

  let videoContainer = createElementWithId("div", "videoContainer");
  let iframeContainer = createElementWithId("div", "iframeContainer");
  ElementRe.appendChild(videoContainer, sources);
  ElementRe.appendChild(iframeContainer, sources);

  let codes = createElementWithId("div", "codes");
  let focus = createElementWithId("div", "focus");
  let queerLoop = createElementWithId("div", "queer-loop");
  ElementRe.appendChild(queerLoop, focus);

  let download = createElementWithId("div", "download");
  ElementRe.setTextContent(download, "save");
  ElementRe.appendChild(download, focus);

  let log = createElementWithId("div", "log");

  ElementRe.appendChild(snapshotCanvas, htmlContainer);
  ElementRe.appendChild(iconCanvas, htmlContainer);
  ElementRe.appendChild(sources, htmlContainer);
  ElementRe.appendChild(codes, htmlContainer);
  ElementRe.appendChild(focus, htmlContainer);
  ElementRe.appendChild(log, htmlContainer);
  ();
};

let setup = () => {
  let style = createStyle();
  withQuerySelectorDom("head", head => ElementRe.appendChild(style, head));
  withQuerySelectorDom("#htmlContainer", createStructureOn);
};
