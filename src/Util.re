open Webapi.Dom;

let htmlNs = "http://www.w3.org/1999/xhtml";
let svgNs = "http://www.w3.org/2000/svg";

let withQuerySelectorDom = (query, f) =>
  document |> Document.querySelector(query) |. Belt.Option.map(f);

let withQuerySelector = (query, f) =>
  document
  |> Document.querySelector(query)
  |. Belt.Option.flatMap(DomRe.Element.asHtmlElement)
  |. Belt.Option.map(f);

let catMaybes: array(option('a)) => array('a) =
  ary => {
    let newArray = [||];
    Array.iter(
      fun
      | Some(a) => Js.Array.push(a, newArray) |> ignore
      | None => (),
      ary,
    );
    newArray;
  };

let mapMaybe: ('a => option('b), array('a)) => array('b) =
  (f, arrayA) => catMaybes(Array.map(f, arrayA));

let withQuerySelectorAllFrom = (query, element, f) =>
  ElementRe.querySelectorAll(query, element)
  |> DomRe.NodeList.toArray
  |> mapMaybe(ElementRe.ofNode)
  |> f;

let withQuerySelectorAll = (query, f) =>
  document
  |> Document.querySelectorAll(query)
  |> DomRe.NodeList.toArray
  |> mapMaybe(ElementRe.ofNode)
  |> f;

let withQuerySelectorSub = (query, childQuery, f) =>
  document
  |> Document.querySelector(query)
  |. Belt.Option.flatMap(ElementRe.querySelector(childQuery))
  |. Belt.Option.map(f);

let removeFromParentNode = node =>
  switch (NodeRe.parentNode(node)) {
  | Some(parent) => NodeRe.removeChild(node, parent) |> ignore
  | None => ()
  };

let removeFromParent = element =>
  switch (ElementRe.parentElement(element)) {
  | Some(parent) => ElementRe.removeChild(element, parent) |> ignore
  | None => ()
  };

[@bs.val]
external encodeURIComponent : string => string = "encodeURIComponent";

[@bs.val]
external decodeURIComponent : string => string = "decodeURIComponent";

let getHash = _ => DomRe.Location.hash(WindowRe.location(window));

let setHash = hash =>
  DomRe.Location.setHash(WindowRe.location(window), hash);

let getQueryString = _ => DomRe.Location.search(WindowRe.location(window));

let setQueryString = search =>
  DomRe.Location.setSearch(WindowRe.location(window), search);
