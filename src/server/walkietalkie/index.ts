import * as alt from "alt-server";

let voiceChannels: alt.VoiceChannel[] = [];

alt.on("server::radio::removePlayerFromVoiceChannel", (player: alt.Player) => {
  if (voiceChannels.length == 0) return;
  voiceChannels.forEach((voiceChannel: alt.VoiceChannel) => {
    if (voiceChannel.isPlayerInChannel(player)) {
      voiceChannel.removePlayer(player);
      alt.log(
        `Removed player from voice channel ${voiceChannel.getMeta("frequency")}`
      );
    }
  });
});

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
          alt.log(
            `Added player to existing voice channel ${voiceChannel.getMeta(
              "frequency"
            )}`
          );
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
    alt.log(
      `Added player to new voice channel ${newVoiceChannel.getMeta(
        "frequency"
      )}`
    );
  }
);

alt.onClient(
  "client::radio::onChannelChange",
  (player: alt.Player, channel: number, subChannel: number) => {
    alt.log(`${player.name} requested voice channel change`);
    alt.emit("server::radio::removePlayerFromVoiceChannel", player);
    alt.emit(
      "server::radio::addPlayerToVoiceChannel",
      player,
      channel,
      subChannel
    );
  }
);

alt.onClient("client::radio::transmissionStarted", (player: alt.Player) => {
  let voiceChannel: alt.VoiceChannel = player.getMeta("voiceChannel");
  voiceChannel.unmutePlayer(player);
  alt.Player.all.forEach((loopedPlayer: alt.Player) => {
    if (loopedPlayer == player) return;
    if (loopedPlayer.getMeta("voiceChannel") != voiceChannel) return;
    alt.emitClient(loopedPlayer, "server::radio::reciveTransmissionStart");
  });
});

alt.onClient("client::radio::transmissionEnded", (player: alt.Player) => {
  let voiceChannel: alt.VoiceChannel = player.getMeta("voiceChannel");
  voiceChannel.mutePlayer(player);
  alt.Player.all.forEach((loopedPlayer: alt.Player) => {
    if (loopedPlayer == player) return;
    if (loopedPlayer.getMeta("voiceChannel") != voiceChannel) return;
    alt.emitClient(loopedPlayer, "server::radio::reciveTransmissionEnd");
  });
});
