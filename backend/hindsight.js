const { HindsightClient } = require("@vectorize-io/hindsight-client");

const hindsight = new HindsightClient({
    baseUrl: "https://api.hindsight.vectorize.io",
    apiKey: process.env.HINDSIGHT_API_KEY
});

const BANK_ID = "accounts-payable-agent";

async function initializeMemory() {
    try {
        await hindsight.createBank(BANK_ID, {
            name: "Accounts Payable Agent Memory",
            mission:
                "Remember vendor patterns, payment terms, invoice discrepancies, approval decisions, and human feedback to improve accounts payable decisions."
        });

        console.log("Hindsight memory initialized");
    } catch (error) {
        console.log("Hindsight bank already exists or initialization skipped");
    }
}

async function remember(content, metadata = {}) {
    return await hindsight.retain(
        BANK_ID,
        content,
        {
            metadata
        }
    );
}

async function recall(query) {
    const result = await hindsight.recall(
        BANK_ID,
        query,
        {
    budget: "low",
    maxTokens: 1500
}
    );

    return result.results || [];
}

module.exports = {
    hindsight,
    BANK_ID,
    initializeMemory,
    remember,
    recall
};