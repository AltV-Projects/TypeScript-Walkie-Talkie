import * as alt from "alt-client";
import * as natives from "natives";
let radioView: alt.WebView;
let player: alt.Player = alt.Player.local;
let isRadioTunredOn = false;

alt.onServer("server::radio::reciveTransmissionStart", () => {
  radioView.emit("webView::radio::reciveTransmissionStart");
});

alt.onServer("server::radio::reciveTransmissionEnd", () => {
  radioView.emit("webView::radio::reciveTransmissionEnd");
});

alt.on("connectionComplete", () => {
  radioView = new alt.WebView(
    "http://resource/client/walkietalkie/html/index.html"
  );
  radioView.focus();
  radioView.on("webview::radio:finishedLoading", () => {
    radioView.unfocus();
  });
  radioView.on("webView::radio::powerStatusChanged", (tunedOn: boolean) => {
    isRadioTunredOn = tunedOn;
  });
  radioView.on(
    "webView::radio::onChannelChange",
    (channel: number, subChannel: number) => {
      alt.emitServer("client::radio::onChannelChange", channel, subChannel);
    }
  );
  radioView.on("webView::radio::transmissionStarted", () => {
    alt.emitServer("client::radio::transmissionStarted");
  });
  radioView.on("webView::radio::transmissionEnded", () => {
    alt.emitServer("client::radio::transmissionEnded");
  });
  natives.requestAnimDict("random@arrests");
});

alt.on("keydown", (key: number) => {
  if (key !== 107) return;
  radioView.emit("webView::radio::toggleRadioDisplay");
});

alt.on("keydown", (key: number) => {
  if (key !== 17) return;
  alt.showCursor(true);
  natives.freezeEntityPosition(player.scriptID, true);
  alt.toggleGameControls(false);
});

alt.on("keyup", (key: number) => {
  if (key !== 17) return;
  alt.showCursor(false);
  natives.freezeEntityPosition(alt.Player.local.scriptID, false);
  alt.toggleGameControls(true);
});

alt.on("keydown", (key: number) => {
  if (key !== 220) return;
  if (!isRadioTunredOn) return;
  natives.taskPlayAnim(
    player.scriptID,
    "random@arrests",
    "generic_radio_chatter",
    8.0,
    1,
    -1,
    49,
    0,
    false,
    false,
    false
  );
  alt.setTimeout(() => {
    radioView.emit("webView::radio::startTransmission");
  }, 250);
});

alt.on("keyup", (key: number) => {
  if (key !== 220) return;
  natives.clearPedTasks(player.scriptID);
  radioView.emit("webView::radio::endTransmission");
});
