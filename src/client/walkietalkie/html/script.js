const app = new Vue({
  el: "#app",
  data: function () {
    return {
      poweredOn: false,
      isPowerCycling: false,
      frequency: 0,
      subChannel: 0,
      startupInterval: undefined,
      color: {
        regular: "#1a1a1a",
        white: "white",
        yellow: "yellow",
      },
      isTransmitting: false,
      transmitColor: "#1a1a1a",
      isReciving: false,
      reciveColor: "#1a1a1a",
      menu: {
        active: false,
        index: -1,
      },
      frequencyColor: "#1a1a1a",
      subColor: "#1a1a1a",
      shown: false,
    };
  },
  methods: {
    menuHandler() {
      if (!this.poweredOn) return;
      if (this.isTransmitting) return;
      this.frequencyColor = this.color.regular;
      this.subColor = this.color.regular;
      if (!this.menu.active) {
        this.menu.active = true;
        this.menu.index = 0;
        this.playKeypressSound();
        this.frequencyColor = this.color.yellow;
        alt.emit("webView::radio::disableChannelSet");
      } else {
        if (this.menu.index == 0) {
          this.menu.index = 1;
          this.subColor = this.color.yellow;
          this.playKeypressSound();
          alt.emit("webView::radio::disableChannelSet");
        } else {
          this.menu.active = false;
          this.menu.index = -1;
          this.playKeypressEndSound();
          alt.emit(
            "webView::radio::onChannelChange",
            this.frequency,
            this.subChannel
          );
        }
      }
    },
    lowerFrequency() {
      if (!this.poweredOn) return;
      if (!this.menu.active) return;
      this.playKeypressSound();

      if (this.menu.index == 0) {
        this.frequency--;
        if (this.frequency < 0) this.frequency = 12;
      } else if (this.menu.index == 1) {
        this.subChannel--;
        if (this.subChannel < 0) this.subChannel = 128;
      }
    },
    raiseFrequency() {
      if (!this.poweredOn) return;
      if (!this.menu.active) return;
      this.playKeypressSound();

      if (this.menu.index == 0) {
        this.frequency++;
        if (this.frequency > 12) this.frequency = 0;
      } else if (this.menu.index == 1) {
        this.subChannel++;
        if (this.subChannel > 128) this.subChannel = 0;
      }
    },
    toggleDevicePower() {
      if (this.isPowerCycling) return;
      this.isPowerCycling = true;
      if (this.poweredOn) {
        this.poweredOn = false;
        this.isPowerCycling = false;
        this.subChannel = 0;
        this.frequency = 0;
        this.isTransmitting = false;
        this.transmitColor = this.color.regular;
        this.isReciving = false;
        this.reciveColor = this.color.regular;
        this.menu.active = false;
        this.menu.index = -1;
        alt.emit("webView::radio::powerStatusChanged", false);
      } else {
        const self = this;
        self.subColor = this.color.white;
        self.startupInterval = setInterval(function () {
          self.subChannel++;
          if (self.subChannel == 100) {
            clearInterval(self.startupInterval);
            self.subColor = self.color.regular;
            self.poweredOn = true;
            self.isPowerCycling = false;
            self.subChannel = 0;
            self.menuHandler();
            alt.emit("webView::radio::powerStatusChanged", true);
          }
        }, 10);
      }
    },
    playKeypressSound() {
      new Audio("./audio/key.mp3").play();
    },
    playKeypressEndSound() {
      new Audio("./audio/end_key.mp3").play();
    },

    playNoise() {
      this.noise = new Audio("./audio/incomming_transmission.mp3");
      this.noise.play();
      this.noise.addEventListener("timeupdate", this.repeatNoise);
    },
    repeatNoise() {
      const buffer = 0.44;
      if (this.isTransmitting || this.isReciving)
        if (this.noise.currentTime > this.noise.duration - buffer) {
          this.noise.currentTime = 0;
          this.noise.play();
        }
    },

    startTransmission() {
      if (!this.poweredOn) return;
      this.isTransmitting = true;
      this.transmitColor = this.color.white;
      this.frequencyColor = this.color.white;
      this.subColor = this.color.white;
      this.playNoise();
      if ("alt" in window) alt.emit("webView::radio::transmissionStarted");
    },
    endTransmission() {
      if (!this.poweredOn) return;
      this.isTransmitting = false;
      this.transmitColor = this.color.regular;
      this.frequencyColor = this.color.regular;
      this.subColor = this.color.regular;
      if (this.noise) {
        this.noise.removeEventListener("timeupdate", this.repeatNoise, true);
        this.noise.pause();
        this.noise = undefined;
      }
      new Audio("./audio/transmission_end.mp3").play();
      if ("alt" in window) alt.emit("webView::radio::transmissionEnded");
    },
    reciveTransmissionStart() {
      this.isReciving = true;
      this.reciveColor = this.color.white;
      this.frequencyColor = this.color.white;
      this.subColor = this.color.white;
      this.playNoise();
    },
    reciveTransmissionEnd() {
      this.isReciving = false;
      this.reciveColor = this.color.regular;
      this.frequencyColor = this.color.regular;
      this.subColor = this.color.regular;
      if (this.noise) {
        this.noise.removeEventListener("timeupdate", this.repeatNoise, true);
        this.noise.pause();
        this.noise = undefined;
      }
      new Audio("./audio/transmission_end.mp3").play();
    },
  },
  mounted: function () {
    const self = this;
    this.$nextTick(function () {
      if ("alt" in window) alt.emit("webview::radio:finishedLoading");
      alt.on("webView::radio::toggleRadioDisplay", function () {
        self.shown = !self.shown;
        alt.emit("webView::radio::setFocus", self.shown);
      });
      alt.on("webView::radio::startTransmission", self.startTransmission);
      alt.on("webView::radio::endTransmission", self.endTransmission);
      alt.on(
        "webView::radio::reciveTransmissionStart",
        self.reciveTransmissionStart
      );
      alt.on(
        "webView::radio::reciveTransmissionEnd",
        self.reciveTransmissionEnd
      );
    });
  },
});
