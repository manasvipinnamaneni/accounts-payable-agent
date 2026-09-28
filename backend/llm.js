const OpenAI = require("openai");

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

async function analyzeWithLLM(invoice, vendor, memories) {

    const prompt = `
You are an Accounts Payable AI Agent.

Analyze this invoice using:
1. The current invoice
2. The vendor profile
3. Historical memories retrieved from Hindsight

CURRENT INVOICE:
${JSON.stringify(invoice, null, 2)}

VENDOR PROFILE:
${JSON.stringify(vendor, null, 2)}

HINDSIGHT MEMORIES:
${JSON.stringify(memories, null, 2)}

Decide:

APPROVE
REVIEW
HOLD

Rules:
- APPROVE when the invoice is consistent with historical patterns.
- REVIEW when there are unusual amounts, shipping charges,
  or previous discrepancies.
- HOLD when there is a serious potential problem.

Return ONLY valid JSON:

{
  "decision": "APPROVE",
  "confidence": 90,
  "reason": "Short explanation",
  "memory_used": [
    "Important historical memory"
  ],
  "recommendation": "Next action for AP team"
}
`;

    const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
            {
                role: "system",
                content: "You are a careful Accounts Payable agent."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.2,
        response_format: {
            type: "json_object"
        }
    });

    const content = response.choices[0].message.content;

    try {
        return JSON.parse(content);
    } catch (error) {

        console.error("Invalid JSON from Groq:", content);

        return {
            decision: "REVIEW",
            confidence: 50,
            reason: "AI response could not be safely parsed.",
            memory_used: [],
            recommendation: "Send invoice for human review."
        };
    }
}

module.exports = {
    analyzeWithLLM
};