[@bs.deriving abstract]
type keyAlgorithm = {
  name: string,
  [@bs.optional]
  hash: string,
  [@bs.optional]
  length: string,
};

let defaultHmac = keyAlgorithm(~name="HMAC", ~hash="SHA-256", ());

type cryptoKey;

[@bs.val] [@bs.scope ("window", "crypto")]
external getRandomValues : Js.Typed_array.Uint8Array.t => unit = "";

[@bs.val] [@bs.scope ("window", "crypto", "subtle")]
external generateKey :
  (keyAlgorithm, bool, array(string)) => Js.Promise.t(cryptoKey) =
  "";

type jsonWebKey = Js.Json.t;

[@bs.val] [@bs.scope ("window", "crypto", "subtle")]
external _exportKey : (string, cryptoKey) => Js.Promise.t(jsonWebKey) =
  "exportKey";

let exportKeyJWK = key =>
  _exportKey("jwk", key)
  |> Js.Promise.then_(t => Js.Promise.resolve(Js.Json.stringify(t)));

[@bs.val] [@bs.scope ("window", "crypto", "subtle")]
external _importKey :
  (string, jsonWebKey, keyAlgorithm, bool, array(string)) =>
  Js.Promise.t(cryptoKey) =
  "importKey";

let importKeyJWK = json => {
  let parsed = Js.Json.parseExn(json);
  _importKey("jwk", parsed, defaultHmac, true, [|"sign", "verify"|]);
};

let generateHmac = _ => generateKey(defaultHmac, true, [|"sign", "verify"|]);

let defaultHmacKeyJSON = {|{"alg":"HS256","ext":true,"k":"A-cS_q7opsDHm5vusaNtzSbaJcI153rl-2VVPXyliu2G5nKicquFkf-rcFNCyQkC50CDjzFdDhIh9WzzWSXXHw","key_ops":["sign","verify"],"kty":"oct"}|};

let defaultHmacKey = importKeyJWK(defaultHmacKeyJSON);

[@bs.val] [@bs.scope ("window", "crypto", "subtle")]
external sign :
  (keyAlgorithm, cryptoKey, Js.Typed_array.ArrayBuffer.t) =>
  Js.Promise.t(Js.Typed_array.ArrayBuffer.t) =
  "";

/* const result = crypto.subtle.verify(algorithm, key, signature, data); */

[@bs.val] [@bs.scope ("window", "crypto", "subtle")]
external verify :
  (
    keyAlgorithm,
    cryptoKey,
    Js.Typed_array.ArrayBuffer.t,
    Js.Typed_array.ArrayBuffer.t
  ) =>
  Js.Promise.t(bool) =
  "";
