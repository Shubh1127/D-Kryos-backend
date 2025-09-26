import axios from "axios";

export class KryosService {
    apiKey: string;
    baseUrl: string;

    constructor(apiKey: string, baseUrl: string = "http://localhost:8000") {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    /**
     * Send hash to Kryos main backend
     * @param hash - SHA256 hash
     * @param referenceId - UserID or media reference
     */
    async sendHash(hash: string, referenceId: string) {
        try {
            await axios.post(`${this.baseUrl}/api/hashes`, {
                hash,
                referenceId
            }, {
                headers: { "Authorization": `Bearer ${this.apiKey}` }
            });
        } catch (err) {
            console.error("Error sending hash to Kryos backend:", err);
        }
    }
}
