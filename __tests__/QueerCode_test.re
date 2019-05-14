open Jest;
open Expect;

open QueerCode;
open QrCodeGen;

let qrCode = QrCode.encodeText("https://qqq.lu", Ecc.low);

let queerCode = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">
<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 29 29\" stroke=\"none\">
<rect width=\"100%\" height=\"100%\" fill=\"#FFFFFF\"/>
<rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"4\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"5\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"6\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"7\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"8\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"9\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"10\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"4\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"4\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"5\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"6\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"7\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"8\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"9\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"10\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"5\" /> <rect width=\"1\" height=\"1\" fill=\"#f0f\" x=\"4\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#ff0\" x=\"5\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"6\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"7\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"8\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"9\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"10\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"6\" /> <rect width=\"1\" height=\"1\" fill=\"#f0f\" x=\"4\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#ff0\" x=\"5\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"6\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"7\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"8\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"9\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"10\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"7\" /> <rect width=\"1\" height=\"1\" fill=\"#f0f\" x=\"4\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#ff0\" x=\"5\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"6\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"7\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"8\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"9\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"10\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"8\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"4\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"5\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"6\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"7\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"8\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"9\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"10\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"9\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"4\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"5\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"6\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"7\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"8\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"9\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"10\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"10\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"4\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"5\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"6\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"7\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"8\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"9\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"10\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"11\" /> <rect width=\"1\" height=\"1\" fill=\"#f0f\" x=\"4\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#0f0\" x=\"5\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"6\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"7\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"8\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"9\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"10\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"12\" /> <rect width=\"1\" height=\"1\" fill=\"#00f\" x=\"4\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#00f\" x=\"5\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"6\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"7\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"8\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"9\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"10\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"13\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"4\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"5\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"6\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"7\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"8\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"9\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"10\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"14\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"4\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#f0f\" x=\"5\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"6\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"7\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"8\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"9\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"10\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"15\" /> <rect width=\"1\" height=\"1\" fill=\"#0f0\" x=\"4\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#0f0\" x=\"5\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"6\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"7\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"8\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"9\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"10\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"16\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"4\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"5\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"6\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"7\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"8\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"9\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"10\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"17\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"4\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"5\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"6\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"7\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"8\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"9\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"10\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"18\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"4\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"5\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"6\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"7\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"8\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"9\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"10\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"19\" /> <rect width=\"1\" height=\"1\" fill=\"#f0f\" x=\"4\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#ff0\" x=\"5\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"6\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"7\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"8\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"9\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"10\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"20\" /> <rect width=\"1\" height=\"1\" fill=\"#f0f\" x=\"4\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#ff0\" x=\"5\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"6\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"7\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"8\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"9\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"10\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"21\" /> <rect width=\"1\" height=\"1\" fill=\"#f0f\" x=\"4\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#ff0\" x=\"5\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"6\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"7\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"8\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"9\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"10\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"22\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"4\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"5\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"6\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"7\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"8\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"9\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"10\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"23\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"4\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"5\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"6\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"7\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#f00\" x=\"8\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"9\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#000\" x=\"10\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"11\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"12\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"13\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"14\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"15\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"16\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"17\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"18\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"19\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"20\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"21\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"22\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"23\" y=\"24\" /> <rect width=\"1\" height=\"1\" fill=\"#fff\" x=\"24\" y=\"24\" />";

let rgbMatrix = [|
  [|
    "#fff",
    "#f00",
    "#f0f",
    "#f0f",
    "#f0f",
    "#f00",
    "#fff",
    "#000",
    "#f0f",
    "#00f",
    "#fff",
    "#000",
    "#0f0",
    "#000",
    "#fff",
    "#f00",
    "#f0f",
    "#f0f",
    "#f0f",
    "#f00",
    "#fff",
  |],
  [|
    "#fff",
    "#000",
    "#ff0",
    "#ff0",
    "#ff0",
    "#000",
    "#fff",
    "#000",
    "#0f0",
    "#00f",
    "#fff",
    "#f0f",
    "#0f0",
    "#000",
    "#fff",
    "#000",
    "#ff0",
    "#ff0",
    "#ff0",
    "#000",
    "#fff",
  |],
  [|
    "#f00",
    "#f00",
    "#f00",
    "#f00",
    "#f00",
    "#f00",
    "#f00",
    "#000",
    "#f00",
    "#000",
    "#f00",
    "#000",
    "#f00",
    "#000",
    "#f00",
    "#f00",
    "#f00",
    "#f00",
    "#f00",
    "#f00",
    "#f00",
  |],
  [|
    "#000",
    "#000",
    "#f00",
    "#000",
    "#000",
    "#f00",
    "#000",
    "#f00",
    "#f00",
    "#000",
    "#000",
    "#f00",
    "#f00",
    "#f00",
    "#000",
    "#f00",
    "#f00",
    "#000",
    "#000",
    "#f00",
    "#000",
  |],
  [|
    "#000",
    "#f00",
    "#f00",
    "#f00",
    "#f00",
    "#000",
    "#f00",
    "#000",
    "#f00",
    "#f00",
    "#f00",
    "#000",
    "#000",
    "#f00",
    "#f00",
    "#f00",
    "#000",
    "#f00",
    "#f00",
    "#000",
    "#f00",
  |],
  [|
    "#f00",
    "#000",
    "#000",
    "#000",
    "#000",
    "#000",
    "#f00",
    "#000",
    "#000",
    "#f00",
    "#000",
    "#000",
    "#f00",
    "#f00",
    "#000",
    "#f00",
    "#000",
    "#000",
    "#000",
    "#000",
    "#000",
  |],
  [|
    "#f00",
    "#000",
    "#f00",
    "#f00",
    "#f00",
    "#000",
    "#f00",
    "#000",
    "#000",
    "#000",
    "#f00",
    "#000",
    "#000",
    "#000",
    "#f00",
    "#000",
    "#000",
    "#000",
    "#f00",
    "#000",
    "#000",
  |],
  [|
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
  |],
  [|
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
  |],
  [|
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
  |],
  [|
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
  |],
  [|
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
  |],
  [|
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
  |],
  [|
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
  |],
  [|
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
  |],
  [|
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
  |],
  [|
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
  |],
  [|
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
  |],
  [|
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
  |],
  [|
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
  |],
  [|
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
    "#fff",
  |],
|];

describe("QueerCode", () => {
  Only.describe("moduleArrayToRgbHex", () =>
    test("groups QR code into RGB triples", () => {
      let modules = QrCode.getModules(qrCode);
      expect(moduleArrayToRgbHex(modules)) |> toEqual(rgbMatrix);
    })
  );

  describe("rgbModules", () =>
    test("turns modules into SVG", () => {
      let expected = "f";
      let modules = QrCode.getModules(qrCode);
      let rgbModules = moduleArrayToRgbHex(modules);
      expect(rgbModulesToSvgString(rgbModules)) |> toEqual(queerCode);
    })
  );
});
