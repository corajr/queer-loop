// Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

import * as $$Array from "../node_modules/bs-platform/lib/es6/array.js";
import * as ElementRe from "../node_modules/bs-webapi/src/dom/nodes/ElementRe.js";
import * as Belt_Option from "../node_modules/bs-platform/lib/es6/belt_Option.js";
import * as Caml_option from "../node_modules/bs-platform/lib/es6/caml_option.js";

function withQuerySelectorDom(query, f) {
  return Belt_Option.map(Caml_option.nullable_to_opt(document.querySelector(query)), f);
}

function withQuerySelector(query, f) {
  return Belt_Option.map(Belt_Option.flatMap(Caml_option.nullable_to_opt(document.querySelector(query)), ElementRe.asHtmlElement), f);
}

function withQuerySelectorAll(query, f) {
  return $$Array.map(f, Array.prototype.slice.call(document.querySelectorAll(query)));
}

function withQuerySelectorSub(query, childQuery, f) {
  return Belt_Option.map(Belt_Option.flatMap(Caml_option.nullable_to_opt(document.querySelector(query)), (function (param) {
                    return Caml_option.nullable_to_opt(param.querySelector(childQuery));
                  })), f);
}

function getHash(param) {
  return window.location.hash;
}

function setHash(hash) {
  window.location.hash = hash;
  return /* () */0;
}

function getQueryString(param) {
  return window.location.search;
}

function setQueryString(search) {
  window.location.search = search;
  return /* () */0;
}

var htmlNs = "http://www.w3.org/1999/xhtml";

var svgNs = "http://www.w3.org/2000/svg";

export {
  htmlNs ,
  svgNs ,
  withQuerySelectorDom ,
  withQuerySelector ,
  withQuerySelectorAll ,
  withQuerySelectorSub ,
  getHash ,
  setHash ,
  getQueryString ,
  setQueryString ,
  
}
/* ElementRe Not a pure module */
