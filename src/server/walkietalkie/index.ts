import * as alt from "alt-server";

let voiceChannels: alt.VoiceChannel[] = [];

/**
 * Serverside call,
 * removes the player from his current voice channel
 * @param {alt.Player} player - Handle to the calling player
 */
alt.on("server::radio::removePlayerFromVoiceChannel", (player: alt.Player) => {
  if (voiceChannels.length == 0) return;
  voiceChannels.forEach((voiceChannel: alt.VoiceChannel) => {
    if (voiceChannel.isPlayerInChannel(player)) {
      voiceChannel.removePlayer(player);
    }
  });
});

/**
 * Serverside call,
 * adds a player to the given voice channel
 * @param {alt.Player} player - Handle to the calling player
 * @param {number} channel - New channel/frequency
 * @param {number} subChannel - Subchannel to prevent interference
 */
alt.on(
  "server::radio::addPlayerToVoiceChannel",
  (player: alt.Player, channel: number, subChannel: number) => {
    let found = false;
    if (voiceChannels.length > 0) {
      voiceChannels.forEach((voiceChannel: alt.VoiceChannel) => {
        if (voiceChannel.getMeta("frequency") == `${channel}-${subChannel}`) {
          found = true;
          voiceChannel.addPlayer(player);
          player.setMeta("voiceChannel", voiceChannel);
        }
      });
    }
    if (found) return;

    let newVoiceChannel: alt.VoiceChannel = new alt.VoiceChannel(
      false,
      9999999
    );
    newVoiceChannel.setMeta("frequency", `${channel}-${subChannel}`);
    newVoiceChannel.addPlayer(player);
    player.setMeta("voiceChannel", newVoiceChannel);
    voiceChannels.push(newVoiceChannel);
  }
);

/**
 * Clientside call,
 * changes the (sub)channel of the given player
 * @param {alt.Player} player - Handle to the calling player
 * @param {number} channel - New channel/frequency
 * @param {number} subChannel - Subchannel to prevent interference
 */
alt.onClient(
  "client::radio::onChannelChange",
  (player: alt.Player, channel: number, subChannel: number) => {
    alt.emit("server::radio::removePlayerFromVoiceChannel", player);
    alt.emit(
      "server::radio::addPlayerToVoiceChannel",
      player,
      channel,
      subChannel
    );
  }
);

/**
 * Clientside call,
 * removing the player from his (sub)current channel
 * @param {alt.Player} player - Handle to the calling player
 */
alt.onClient("client::radio:removePlayer", (player: alt.Player) =>
  alt.emit("server::radio::removePlayerFromVoiceChannel", player)
);

/**
 * Clientside call,
 * informs all player in the same channel that a transmission has been started
 * @param {alt.Player} player - Handle to the calling player
 */
alt.onClient("client::radio::transmissionStarted", (player: alt.Player) => {
  let voiceChannel: alt.VoiceChannel = player.getMeta("voiceChannel");
  voiceChannel.unmutePlayer(player);
  alt.Player.all.forEach((loopedPlayer: alt.Player) => {
    if (loopedPlayer == player) return;
    if (loopedPlayer.getMeta("voiceChannel") != voiceChannel) return;
    alt.emitClient(loopedPlayer, "server::radio::reciveTransmissionStart");
  });
});

/**
 * Clientside call,
 * informs all player in the same channel that a transmission has been ended
 * @param {alt.Player} player - Handle to the calling player
 */
alt.onClient("client::radio::transmissionEnded", (player: alt.Player) => {
  let voiceChannel: alt.VoiceChannel = player.getMeta("voiceChannel");
  voiceChannel.mutePlayer(player);
  alt.Player.all.forEach((loopedPlayer: alt.Player) => {
    if (loopedPlayer == player) return;
    if (loopedPlayer.getMeta("voiceChannel") != voiceChannel) return;
    alt.emitClient(loopedPlayer, "server::radio::reciveTransmissionEnd");
  });
});
