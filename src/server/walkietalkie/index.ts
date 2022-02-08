import {emit, emitClient, on, onClient, Player, VoiceChannel} from "alt-server";

let voiceChannels: VoiceChannel[] = [];

/**
 * Serverside call,
 * removes the player from his current voice channel
 * @param {Player} player - Handle to the calling player
 */
on("server::radio::removePlayerFromVoiceChannel", (player: Player) => {
  if (voiceChannels.length == 0) return;
  voiceChannels.forEach((voiceChannel: VoiceChannel) => {
    if (voiceChannel.isPlayerInChannel(player)) {
      voiceChannel.removePlayer(player);
    }
  });
});

/**
 * Serverside call,
 * adds a player to the given voice channel
 * @param {Player} player - Handle to the calling player
 * @param {number} channel - New channel/frequency
 * @param {number} subChannel - Subchannel to prevent interference
 */
on(
  "server::radio::addPlayerToVoiceChannel",
  (player: Player, channel: number, subChannel: number) => {
    let found = false;
    if (voiceChannels.length > 0) {
      voiceChannels.forEach((voiceChannel: VoiceChannel) => {
        if (voiceChannel.getMeta("frequency") == `${channel}-${subChannel}`) {
          found = true;
          voiceChannel.addPlayer(player);
          voiceChannel.mutePlayer(player);
          player.setMeta("voiceChannel", voiceChannel);
        }
      });
    }
    if (found) return;

    let newVoiceChannel: VoiceChannel = new VoiceChannel(
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
 * @param {Player} player - Handle to the calling player
 * @param {number} channel - New channel/frequency
 * @param {number} subChannel - Subchannel to prevent interference
 */
onClient(
  "client::radio::onChannelChange",
  (player: Player, channel: number, subChannel: number) => {
    emit("server::radio::removePlayerFromVoiceChannel", player);
    emit(
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
 * @param {Player} player - Handle to the calling player
 */
onClient("client::radio:removePlayer", (player: Player) =>
  emit("server::radio::removePlayerFromVoiceChannel", player)
);

/**
 * Clientside call,
 * informs all player in the same channel that a transmission has been started
 * @param {Player} player - Handle to the calling player
 */
onClient("client::radio::transmissionStarted", (player: Player) => {
  let voiceChannel: VoiceChannel = player.getMeta("voiceChannel");
  voiceChannel.unmutePlayer(player);
  Player.all.forEach((loopedPlayer: Player) => {
    if (loopedPlayer == player) return;
    if (loopedPlayer.getMeta("voiceChannel") != voiceChannel) return;
    emitClient(loopedPlayer, "server::radio::receiveTransmissionStart");
  });
});

/**
 * Clientside call,
 * informs all player in the same channel that a transmission has been ended
 * @param {Player} player - Handle to the calling player
 */
onClient("client::radio::transmissionEnded", (player: Player) => {
  let voiceChannel: VoiceChannel = player.getMeta("voiceChannel");
  voiceChannel.mutePlayer(player);
  Player.all.forEach((loopedPlayer: Player) => {
    if (loopedPlayer == player) return;
    if (loopedPlayer.getMeta("voiceChannel") != voiceChannel) return;
    emitClient(loopedPlayer, "server::radio::receiveTransmissionEnd");
  });
});
