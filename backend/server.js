require("dotenv").config();

const express = require("express");
const cors = require("cors");

const {
    initializeMemory,
    remember
} = require("./hindsight");

const {
    analyzeInvoice,
    saveFeedback
} = require("./agent");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;


// Health check
app.get("/", (req, res) => {
    res.json({
        message: "Accounts Payable AI Agent is running"
    });
});


// Analyze invoice
app.post("/api/invoices/analyze", async (req, res) => {

    try {

        const invoice = req.body;

        if (!invoice.vendor_name) {
            return res.status(400).json({
                error: "vendor_name is required"
            });
        }

        if (!invoice.total_amount) {
            return res.status(400).json({
                error: "total_amount is required"
            });
        }

        const result = await analyzeInvoice(invoice);

        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});


// Save human feedback
app.post("/api/feedback", async (req, res) => {

    try {

        const result = await saveFeedback(req.body);

        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});


// Seed historical vendor memory
app.post("/api/memory/seed", async (req, res) => {

    try {

        await remember(
            `
            Historical vendor record:

            Vendor: ABC Industrial Supplies

            This vendor normally submits invoices between ₹60,000 and ₹80,000.

            Standard payment terms are Net 30.

            Normal shipping charges are between ₹3,000 and ₹5,000.

            Previous invoice issue:
            An invoice from ABC Industrial Supplies contained a duplicate
            shipping charge.

            The AP team rejected the invoice and requested a corrected invoice.

            Future invoices from this vendor should be checked carefully
            for duplicate or unusually high shipping charges.

            This discrepancy was resolved by requesting a corrected invoice.
            `,
            {
                type: "vendor_history",
                vendor: "ABC Industrial Supplies",
                importance: "high"
            }
        );

        res.json({
            success: true,
            message: "Historical vendor memory saved to Hindsight."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});

app.post("/api/memory/seed", async (req, res) => {
  try {
    // YOUR EXISTING SEED CODE
  } catch (error) {
    // YOUR EXISTING ERROR HANDLING
  }
});


// 👇 PASTE THE NEW LEARNING ENDPOINT HERE

app.post("/api/memory/seed-learning", async (req, res) => {
  try {
    const learningMemories = [
      {
        text: `
Historical interaction with ABC Industrial Supplies.

Invoice amount: ₹68,000
Shipping: ₹3,500

The invoice was within the vendor's normal historical range.
The invoice was approved after standard verification.

Learning:
ABC Industrial Supplies commonly submits invoices between ₹60,000 and ₹80,000.
Shipping around ₹3,000–₹5,000 is considered normal.
        `,
        metadata: {
          type: "vendor_interaction",
          vendor: "ABC Industrial Supplies",
          outcome: "approved",
          importance: "high",
        },
      },

      {
        text: `
Historical interaction with ABC Industrial Supplies.

Invoice amount: ₹74,000
Shipping: ₹4,200

The invoice was approved.
The amount and shipping were consistent with the vendor's normal pattern.

Learning:
Invoices around ₹70,000–₹75,000 can normally be approved when other checks pass.
        `,
        metadata: {
          type: "vendor_interaction",
          vendor: "ABC Industrial Supplies",
          outcome: "approved",
          importance: "high",
        },
      },

      {
        text: `
Historical exception involving ABC Industrial Supplies.

Invoice amount: ₹91,000
Shipping: ₹7,200

The invoice exceeded the vendor's usual invoice and shipping patterns.
It was sent for human review.

Learning:
Higher-value invoices from this vendor require additional verification.
Unusually high shipping should also trigger review.
        `,
        metadata: {
          type: "vendor_exception",
          vendor: "ABC Industrial Supplies",
          outcome: "review",
          importance: "high",
        },
      },

      {
        text: `
Historical discrepancy involving ABC Industrial Supplies.

A previous invoice contained a duplicate shipping charge.

The duplicate charge was rejected and corrected before payment.

Learning:
Future invoices from ABC Industrial Supplies should be checked carefully for duplicate shipping charges.
        `,
        metadata: {
          type: "vendor_discrepancy",
          vendor: "ABC Industrial Supplies",
          outcome: "corrected",
          importance: "high",
        },
      },

      {
        text: `
Human feedback for ABC Industrial Supplies.

A previous invoice was initially flagged for review because it exceeded the normal amount threshold.

A human reviewer approved the invoice after verifying the purchase order and supporting documents.

Learning:
When a high-value ABC Industrial Supplies invoice is flagged, purchase-order verification should be considered before rejecting the invoice.
        `,
        metadata: {
          type: "human_feedback",
          vendor: "ABC Industrial Supplies",
          outcome: "approved_after_verification",
          importance: "high",
        },
      },
    ];

    let saved = 0;

    for (const memory of learningMemories) {
      await remember(memory.text, memory.metadata);
      saved++;
    }

    res.json({
      success: true,
      message: "Learning history seeded into Hindsight.",
      memories_saved: saved,
    });
  } catch (error) {
    console.error("Learning seed error:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Start server
async function startServer() {

    await initializeMemory();

    app.listen(PORT, () => {

        console.log("");
        console.log("====================================");
        console.log(" Accounts Payable AI Agent");
        console.log("====================================");
        console.log(` Server: http://localhost:${PORT}`);
        console.log("");
    });
}

startServer();