const axios = require("axios");

class ArkaneAPI {
  constructor(apiKey, baseUrl) {
    console.log("Constructing API");
    this.api = axios.create({
      baseURL: baseUrl,
      timeout: 1000,
      headers: {'authToken': apiKey}
    });
  }

  async getWallets() {
    return this.api.get('/api/wallets');
  }

  async sign(ethereumTransactionSignatureRequest) {
    return this.api.post('/api/signatures', ethereumTransactionSignatureRequest);
  }
}

module.exports = ArkaneAPI;