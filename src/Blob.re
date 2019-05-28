type t;

[@bs.deriving abstract]
type opts = {
  [@bs.as "type"]
  mimeType: string,
};

[@bs.new]
external make : (array(Js.Typed_array.ArrayBuffer.t), opts) => t = "Blob";

let toArrayBuffer: t => Js.Promise.t(Js.Typed_array.ArrayBuffer.t) = [%bs.raw
  blob => {|
     return new Promise((resolve, reject) => {
     const reader = new FileReader();
     reader.addEventListener('loadend', (e) => {
     resolve(reader.result);
     });
     reader.addEventListener('error', reject);
     reader.readAsArrayBuffer(blob);
     });
     |}
];
