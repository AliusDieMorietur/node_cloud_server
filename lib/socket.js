const WebSocket = require('ws');

class Transport {
  constructor(
    parsePacket = () => {}, 
    parseBuffer = () => {}, 
    location = window.location.host
  ) {
    this.rebuildStructure = null;
    this.counter = 0;
    this.socket = new WebSocket("ws://" + location);
    this.callId = 0;
    this.calls = new Map();
    this.socket.addEventListener("message", ({ data }) => {
      try {
        if (typeof data === "string") {
          const packet = JSON.parse(data);
          parsePacket(packet);
          const { callId } = packet;
          const promised = this.calls.get(callId);
          if (!promised) return;
          const [resolve, reject] = promised;
          if (packet.error) {
            const { code, message } = packet.error;
            const error = new Error(message);
            error.code = code;
            reject(error);
            return;
          }
          resolve(packet.result);
        } else {
          parseBuffer(data);
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  ready() {
    return new Promise((resolve) => {
      if (this.socket.readyState === WebSocket.OPEN) resolve();
      else this.socket.addEventListener("open", resolve);
    });
  }

  close() {
    this.socket.close();
  }

  async socketCall(msg, args) {
    const callId = ++this.callId;
    await this.ready();
    return new Promise((resolve, reject) => {
      this.calls.set(callId, [resolve, reject]);
      const packet = { callId, msg, args };
      this.socket.send(JSON.stringify(packet));
    });
  }

  bufferCall(buffer) {
    this.socket.send(buffer);
  }
}

module.exports = Transport;
