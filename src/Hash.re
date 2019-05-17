open SubtleCrypto;

let abToStr: Js.Typed_array.ArrayBuffer.t => string = [%bs.raw
  buf => {|
  return String.fromCharCode.apply(null, new Uint8Array(buf));
     |}
];

[@bs.val] external btoa : string => string = "";
[@bs.val] external atob : string => string = "";

let abToHexAndBase64Str: Js.Typed_array.ArrayBuffer.t => (string, string) = [%bs.raw
  buf => {|
     var uint8 = new Uint8Array(buf);
     var b64 = window.btoa(String.fromCharCode.apply(null, uint8));
     var hex = Array.prototype.map.call(uint8, x => ('00' + x.toString(16)).slice(-2)).join('');
     return [hex, b64];
     |}
];

let abToHexStr: Js.Typed_array.ArrayBuffer.t => string = [%bs.raw
  buf => {|
     return Array.prototype.map.call(new Uint8Array(buf), x => ('00' + x.toString(16)).slice(-2)).join('');
     |}
];

let str2ab: string => Js.Typed_array.ArrayBuffer.t = [%bs.raw
  str => {|
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
      return buf;
     |}
];

let b64ToAB: string => Js.Typed_array.ArrayBuffer.t = s => str2ab(atob(s));

let abToB64: Js.Typed_array.ArrayBuffer.t => string =
  ab => btoa(abToStr(ab));

[@bs.val] [@bs.scope ("window", "crypto", "subtle")]
external _digest :
  (string, Js.Typed_array.ArrayBuffer.t) =>
  Js.Promise.t(Js.Typed_array.ArrayBuffer.t) =
  "digest";

let digest: (string, string) => Js.Promise.t(string) =
  (algorithm, input) =>
    _digest(algorithm, str2ab(input))
    |> Js.Promise.then_(output => Js.Promise.resolve(abToStr(output)));

let hexDigest: (string, string) => Js.Promise.t(string) =
  (algorithm, input) =>
    _digest(algorithm, str2ab(input))
    |> Js.Promise.then_(output => Js.Promise.resolve(abToHexStr(output)));

let hexAndBase64Digest: (string, string) => Js.Promise.t((string, string)) =
  (algorithm, input) =>
    _digest(algorithm, str2ab(input))
    |> Js.Promise.then_(output =>
         Js.Promise.resolve(abToHexAndBase64Str(output))
       );

let hmacSign: string => Js.Promise.t(string) =
  data =>
    defaultHmacKey
    |> Js.Promise.then_(key => {
         let buf = str2ab(data);
         Js.Promise.all2((
           sign(defaultHmac, key, buf),
           Js.Promise.resolve(buf),
         ));
       })
    |> Js.Promise.then_(((signature, data)) =>
         Js.Promise.resolve(abToB64(signature) ++ "|" ++ abToB64(data))
       );

let hmacVerify: string => Js.Promise.t((string, string)) =
  input =>
    defaultHmacKey
    |> Js.Promise.then_(key => {
         let parts = Js.String.split("|", input);
         if (Array.length(parts) != 2) {
           Js.Promise.reject(Invalid_argument(input)) |> ignore;
         };
         switch (b64ToAB(parts[0]), b64ToAB(parts[1])) {
         | (signatureBuf, dataBuf) =>
           Js.Promise.all3((
             verify(defaultHmac, key, signatureBuf, dataBuf),
             Js.Promise.resolve(abToHexStr(signatureBuf)),
             Js.Promise.resolve(abToStr(dataBuf)),
           ))
         | exception e =>
           Js.log(parts);
           Js.Promise.reject(e);
         };
       })
    |> Js.Promise.then_(((valid, hex, data)) =>
         if (valid) {
           Js.Promise.resolve((hex, data));
         } else {
           Js.Promise.reject(Invalid_argument(input));
         }
       );
