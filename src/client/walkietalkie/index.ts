import * as alt from "alt-client";
import * as natives from "natives";
let radioView: alt.WebView;
let player: alt.Player = alt.Player.local;

let isRadioTurnedOn = false;
let isChannelSet = false;

/**
 * Clientside/alt:V internal call,
 * called when clienthandshake is complete
 */
alt.on("connectionComplete", () => {
  radioView = new alt.WebView(
    "http://resource/client/walkietalkie/html/index.html"
  );
  radioView.focus();

  /**
   * WebView call,
   * notification when DOM has finished loading
   */
  radioView.on("webview::radio:finishedLoading", () => {
    radioView.unfocus();
  });

  /**
   * WebView call,
   * fired when the user clicks on the power button
   * @param {boolean} tunedOn - Current state
   */
  radioView.on("webView::radio::powerStatusChanged", (tunedOn: boolean) => {
    isRadioTurnedOn = tunedOn;
  });

  /**
   * WebView call,
   * fired when the user changed the current (sub)channel
   * @param {number} channel - New channel
   * @param {number} subChannel - New subChannel
   */
  radioView.on(
    "webView::radio::onChannelChange",
    (channel: number, subChannel: number) => {
      isChannelSet = true;
      alt.emitServer("client::radio::onChannelChange", channel, subChannel);
    }
  );

  radioView.on("webView::radio::disableChannelSet", () => {
    isChannelSet = false;
  });

  /**
   * WebView call,
   * fired when the user is starting a transmission
   */
  radioView.on("webView::radio::transmissionStarted", () => {
    alt.emitServer("client::radio::transmissionStarted");
  });

  /**
   * WebView call,
   * fired when the user stopped the current transmission
   */
  radioView.on("webView::radio::transmissionEnded", () => {
    alt.emitServer("client::radio::transmissionEnded");
  });

  /**
   * WebView call,
   * fired when the user shows/hides the walkie talkie
   */
  radioView.on("webView::radio::setFocus", (focus: boolean) => {
    if (focus) radioView.focus();
    else radioView.unfocus();
  });

  natives.requestAnimDict("random@arrests");
});

/**
 * Serverside call,
 * server info when a foreign transmission started
 */
alt.onServer("server::radio::receiveTransmissionStart", () => {
  radioView.emit("webView::radio::receiveTransmissionStart");
});

/**
 * Serverside call,
 * server info when a foreign transmission ended
 */
alt.onServer("server::radio::receiveTransmissionEnd", () => {
  radioView.emit("webView::radio::receiveTransmissionEnd");
});

/**
 * Clientside/alt:V internal call,
 * when player disconnects (quits on purpose or game crashes)
 * @param {alt.Player} player - Handle to the calling player
 */
alt.on("disconnect", (player: alt.Player) => {
  alt.emitServer("client::radio:removePlayer");
});

/**
 * Clientside/alt:V internal call,
 * when the player is pressing down "Numpad +", this event is fired
 * @param {number} key - ID of the key
 */
alt.on("keydown", (key: number) => {
  if (key !== 107) return;
  radioView.emit("webView::radio::toggleRadioDisplay");
});

/**
 * Clientside/alt:V internal call,
 * when the player is pressing down "CTRL", this event is fired
 * @param {number} key - ID of the key
 */
alt.on("keydown", (key: number) => {
  if (key !== 17) return;
  alt.showCursor(true);
  natives.freezeEntityPosition(player.scriptID, true);
  alt.toggleGameControls(false);
});

/**
 * Clientside/alt:V internal call,
 * when the player is pressing up "CTRL", this event is fired
 * @param {number} key - ID of the key
 */
alt.on("keyup", (key: number) => {
  if (key !== 17) return;
  alt.showCursor(false);
  natives.freezeEntityPosition(alt.Player.local.scriptID, false);
  alt.toggleGameControls(true);
});

/**
 * Clientside/alt:V internal call,
 * when the player is pressing down "Tilde", this event is fired
 * @param {number} key - ID of the key
 */
alt.on("keydown", (key: number) => {
  if (key !== 220) return;
  if (!isRadioTurnedOn) return;
  if (!isChannelSet) return;
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

/**
 * Clientside/alt:V internal call,
 * when the player is pressing down "Tilde", this event is fired
 * @param {number} key - ID of the key
 */
alt.on("keyup", (key: number) => {
  if (key !== 220) return;
  if (!isRadioTurnedOn) return;
  if (!isChannelSet) return;
  natives.clearPedTasks(player.scriptID);
  radioView.emit("webView::radio::endTransmission");
});
