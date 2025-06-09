!function(){"use strict";var s=require("./JsQr.bs.js");self.onmessage=function(e){var r=e.data,t=s.jsQR(r[0],r[1],r[2],r[3]);return postMessage(t),0}}();
//# sourceMappingURL=worker.js.map
