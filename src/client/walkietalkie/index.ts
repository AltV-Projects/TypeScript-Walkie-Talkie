import {emitServer, on, onServer, Player, showCursor, toggleGameControls, WebView, setTimeout} from 'alt-client';
import {clearPedTasks, freezeEntityPosition, requestAnimDict, taskPlayAnim} from 'natives';

let radioView: WebView;
let player: Player = Player.local;

let isRadioTurnedOn = false;
let isChannelSet = false;

/**
 * Clientside/alt:V internal call,
 * called when client handshake is complete
 */
on("connectionComplete", () => {
  radioView = new WebView(
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
      emitServer("client::radio::onChannelChange", channel, subChannel);
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
    emitServer("client::radio::transmissionStarted");
  });

  /**
   * WebView call,
   * fired when the user stopped the current transmission
   */
  radioView.on("webView::radio::transmissionEnded", () => {
    emitServer("client::radio::transmissionEnded");
  });

  /**
   * WebView call,
   * fired when the user shows/hides the walkie talkie
   */
  radioView.on("webView::radio::setFocus", (focus: boolean) => {
    if (focus) radioView.focus();
    else radioView.unfocus();
  });

  requestAnimDict("random@arrests");
});

/**
 * Serverside call,
 * server info when a foreign transmission started
 */
onServer("server::radio::receiveTransmissionStart", () => {
  radioView.emit("webView::radio::receiveTransmissionStart");
});

/**
 * Serverside call,
 * server info when a foreign transmission ended
 */
onServer("server::radio::receiveTransmissionEnd", () => {
  radioView.emit("webView::radio::receiveTransmissionEnd");
});

/**
 * Clientside/alt:V internal call,
 * when player disconnects (quits on purpose or game crashes)
 * @param {Player} player - Handle to the calling player
 */
on("disconnect", (player: Player) => {
  emitServer("client::radio:removePlayer");
});

/**
 * Clientside/alt:V internal call,
 * when the player is pressing down "Numpad +", this event is fired
 * @param {number} key - ID of the key
 */
on("keydown", (key: number) => {
  if (key !== 107) return;
  radioView.emit("webView::radio::toggleRadioDisplay");
});

/**
 * Clientside/alt:V internal call,
 * when the player is pressing down "CTRL", this event is fired
 * @param {number} key - ID of the key
 */
on("keydown", (key: number) => {
  if (key !== 17) return;
  showCursor(true);
  freezeEntityPosition(player.scriptID, true);
  toggleGameControls(false);
});

/**
 * Clientside/alt:V internal call,
 * when the player is pressing up "CTRL", this event is fired
 * @param {number} key - ID of the key
 */
on("keyup", (key: number) => {
  if (key !== 17) return;
  showCursor(false);
  freezeEntityPosition(Player.local.scriptID, false);
  toggleGameControls(true);
});

/**
 * Clientside/alt:V internal call,
 * when the player is pressing down "Tilde", this event is fired
 * @param {number} key - ID of the key
 */
on("keydown", (key: number) => {
  if (key !== 220) return;
  if (!isRadioTurnedOn) return;
  if (!isChannelSet) return;
  taskPlayAnim(
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
  setTimeout(() => {
    radioView.emit("webView::radio::startTransmission");
  }, 250);
});

/**
 * Clientside/alt:V internal call,
 * when the player is pressing down "Tilde", this event is fired
 * @param {number} key - ID of the key
 */
on("keyup", (key: number) => {
  if (key !== 220) return;
  if (!isRadioTurnedOn) return;
  if (!isChannelSet) return;
  clearPedTasks(player.scriptID);
  radioView.emit("webView::radio::endTransmission");
});
