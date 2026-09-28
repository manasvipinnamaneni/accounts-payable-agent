const fs = require("fs");
const path = require("path");

const {
    remember,
    recall
} = require("./hindsight");

const {
    analyzeWithLLM
} = require("./llm");

const {
    saveInvoiceDecision
} = require("./services/invoiceService");

const vendorsPath = path.join(
    __dirname,
    "data",
    "vendors.json"
);

const vendors = JSON.parse(
    fs.readFileSync(vendorsPath, "utf8")
);


function findVendor(vendorName) {

    return vendors.find(
        vendor =>
            vendor.vendor_name.toLowerCase() ===
            vendorName.toLowerCase()
    );
}


/*
 * Remove duplicate memories.
 */
function removeDuplicateMemories(memories) {

    const seen = new Set();

    return memories.filter(memory => {

        const text = String(memory.text || "")
            .trim()
            .toLowerCase();

        if (!text || seen.has(text)) {
            return false;
        }

        seen.add(text);

        return true;
    });
}


/*
 * Give human feedback memories higher priority.
 */
function prioritizeMemories(memories) {

    return [...memories].sort((a, b) => {

        const aText = String(a.text || "").toLowerCase();
        const bText = String(b.text || "").toLowerCase();

        const aType = String(a.type || "").toLowerCase();
        const bType = String(b.type || "").toLowerCase();

        const aIsFeedback =
            aType.includes("feedback") ||
            aText.includes("human feedback") ||
            aText.includes("human decision") ||
            aText.includes("purchase order") ||
            aText.includes("po verification");

        const bIsFeedback =
            bType.includes("feedback") ||
            bText.includes("human feedback") ||
            bText.includes("human decision") ||
            bText.includes("purchase order") ||
            bText.includes("po verification");

        if (aIsFeedback && !bIsFeedback) {
            return -1;
        }

        if (!aIsFeedback && bIsFeedback) {
            return 1;
        }

        return 0;
    });
}


async function analyzeInvoice(invoice) {

    const vendor = findVendor(invoice.vendor_name);

    if (!vendor) {
        throw new Error(
            `Vendor '${invoice.vendor_name}' was not found.`
        );
    }


    /*
     * ---------------------------------------------------------
     * 1. GENERAL VENDOR MEMORY
     * ---------------------------------------------------------
     */

    const vendorMemoryQuery = `
    Analyze invoice from ${invoice.vendor_name}.

    Find important historical information about:
    vendor invoice ranges,
    shipping patterns,
    previous discrepancies,
    previous invoice resolutions,
    and previous approval decisions.

    Focus only on information relevant to this vendor.
    `;


    const vendorMemories = await recall(
        vendorMemoryQuery
    );


    /*
     * ---------------------------------------------------------
     * 2. HUMAN FEEDBACK MEMORY
     * ---------------------------------------------------------
     */

    const feedbackMemoryQuery = `
    Find previous human feedback and human decisions
    involving ${invoice.vendor_name}.

    Look specifically for:
    human approval decisions,
    human review decisions,
    purchase order verification,
    supporting document verification,
    previous invoice exceptions,
    previous resolutions,
    and instructions given by human reviewers.

    Return memories that can help decide how to handle
    the current invoice.
    `;


    const feedbackMemories = await recall(
        feedbackMemoryQuery
    );


    /*
     * ---------------------------------------------------------
     * 3. COMBINE THE MEMORIES
     * ---------------------------------------------------------
     */

    const combinedMemories = [
        ...feedbackMemories,
        ...vendorMemories
    ];


    /*
     * Remove duplicates and prioritize human feedback.
     */

    const uniqueMemories =
        removeDuplicateMemories(
            combinedMemories
        );


    const prioritizedMemories =
        prioritizeMemories(
            uniqueMemories
        );


    /*
     * ---------------------------------------------------------
     * 4. KEEP ONLY A SMALL NUMBER OF MEMORIES
     * ---------------------------------------------------------
     */

    const compactMemories =
        prioritizedMemories
            .slice(0, 4)
            .map(memory => ({
                type: memory.type,
                text: String(
                    memory.text || ""
                ).slice(0, 500)
            }));


    /*
     * ---------------------------------------------------------
     * 5. ASK GROQ TO MAKE THE DECISION
     * ---------------------------------------------------------
     */

    const decision = await analyzeWithLLM(
        invoice,
        vendor,
        compactMemories
    );


    /*
     * ---------------------------------------------------------
     * 6. REMEMBER THIS INVOICE ANALYSIS IN HINDSIGHT
     * ---------------------------------------------------------
     */

    await remember(
        `
        Invoice analysis:

        Vendor: ${invoice.vendor_name}

        Invoice amount: ₹${invoice.amount}

        Shipping: ₹${invoice.shipping}

        Total amount: ₹${invoice.total_amount}

        Agent decision:
        ${decision.decision}

        Confidence:
        ${decision.confidence}

        Reason:
        ${decision.reason}

        Recommendation:
        ${decision.recommendation}
        `,
        {
            type: "invoice_analysis",
            vendor: invoice.vendor_name
        }
    );


    /*
     * ---------------------------------------------------------
     * 7. SAVE DECISION TO MYSQL
     * ---------------------------------------------------------
     */

    const databaseId = await saveInvoiceDecision({

        invoice_number:
            invoice.invoice_number || null,

        vendor_name:
            invoice.vendor_name,

        amount:
            invoice.amount,

        shipping:
            invoice.shipping,

        total_amount:
            invoice.total_amount,

        decision:
            decision.decision,

        confidence:
            decision.confidence,

        reason:
            decision.reason,

        recommendation:
            decision.recommendation
    });


    /*
     * ---------------------------------------------------------
     * 8. RETURN EVERYTHING TO THE FRONTEND
     * ---------------------------------------------------------
     */

    return {

        invoice,

        vendor,

        memories:
            compactMemories,

        decision,

        database_id:
            databaseId
    };
}


/*
 * -------------------------------------------------------------
 * HUMAN FEEDBACK
 * -------------------------------------------------------------
 */

async function saveFeedback(feedback) {

    await remember(
        `
        Human feedback for ${feedback.vendor_name}.

        Invoice amount:
        ₹${feedback.total_amount}

        Agent decision:
        ${feedback.agent_decision}

        Human decision:
        ${feedback.human_decision}

        Human feedback:
        ${feedback.feedback}

        This human decision should be considered
        when analyzing future invoices from this vendor.

        Important learning:
        Future invoices should consider this human
        decision and the reasoning behind it.
        `,
        {
            type: "human_feedback",
            vendor: feedback.vendor_name,
            importance: "high"
        }
    );


    return {

        success: true,

        message:
            "Human feedback saved to Hindsight."
    };
}


module.exports = {
    analyzeInvoice,
    saveFeedback
};