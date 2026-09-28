import { useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000";

const vendorProfiles = {
  "ABC Industrial Supplies": {
    initials: "AI",
    range: "₹60K – ₹80K",
    shipping: "₹3K – ₹5K",
    terms: "Net 30",
    threshold: "₹75K",
  },
  "Global Office Solutions": {
    initials: "GO",
    range: "₹20K – ₹45K",
    shipping: "₹1K – ₹3K",
    terms: "Net 45",
    threshold: "₹50K",
  },
};

function App() {
  const [vendor, setVendor] = useState("ABC Industrial Supplies");
  const [amount, setAmount] = useState("");
  const [shipping, setShipping] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [history, setHistory] = useState([]);

  const profile = vendorProfiles[vendor];

  const analyzeInvoice = async () => {
  if (!amount || !shipping) {
    alert("Please enter invoice amount and shipping.");
    return;
  }

  const invoiceAmount = Number(amount);
  const shippingAmount = Number(shipping);
  const totalAmount = invoiceAmount + shippingAmount;

  setLoading(true);
  setFeedbackSent(false);

  try {
    const response = await axios.post(
      `${API}/api/invoices/analyze`,
      {
        vendor_name: vendor,

        // Keep these fields for the existing backend logic
        amount: invoiceAmount,
        shipping: shippingAmount,

        // Backend requires this field
        total_amount: totalAmount,
      }
    );

    setResult(response.data);

    const decision =
      response.data.decision?.decision?.toUpperCase() || "REVIEW";

    const confidence =
      Number(response.data.decision?.confidence) || 0;

    setHistory((previous) => [
      {
        id: Date.now(),
        vendor,
        amount: invoiceAmount,
        decision,
        confidence,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      ...previous,
    ]);
  } catch (error) {
    console.error("Invoice analysis error:", error);

    alert(
      error.response?.data?.error ||
        "Unable to analyze invoice. Make sure the backend is running."
    );
  } finally {
    setLoading(false);
  }
};

  const sendFeedback = async (humanDecision) => {
    if (!result) return;

    try {
      await axios.post(`${API}/api/feedback`, {
        vendor_name: result.invoice.vendor_name,
        amount: result.invoice.amount,
        shipping: result.invoice.shipping,
        agent_decision: result.decision?.decision,
        human_decision: humanDecision,
        feedback:
          humanDecision === "APPROVE"
            ? "Human reviewer approved the invoice after verification."
            : "Human reviewer requested additional review.",
      });

      setFeedbackSent(true);
    } catch (error) {
      console.error(error);
      alert("Unable to save feedback.");
    }
  };

  const decision =
    result?.decision?.decision?.toUpperCase() || null;

  const confidence =
    Number(result?.decision?.confidence) || 0;

  const memories = result?.memories || [];

  return (
    <div className="app">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="nav-left">
          <div className="logo">
            <span>✦</span>
          </div>

          <div>
            <div className="logo-title">AP Intelligence</div>
            <div className="logo-subtitle">
              Accounts Payable AI
            </div>
          </div>
        </div>

        <nav>
          <button className="nav-link active">Dashboard</button>
          <button className="nav-link">Vendors</button>
          <button className="nav-link">Decisions</button>
        </nav>

        <div className="nav-right">
          <div className="memory-indicator">
            <span></span>
            Hindsight active
          </div>

          <div className="avatar">M</div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="hero-section">
          <div>
            <div className="welcome">
              AI-POWERED AP OPERATIONS
            </div>

            <h1>
              Make every invoice
              <br />
              <span>decision smarter.</span>
            </h1>

            <p>
              Your accounts payable agent analyzes invoices,
              remembers vendor history, and learns from every
              human decision.
            </p>
          </div>

          <div className="hero-status">
            <div className="status-icon">🧠</div>

            <div>
              <span>AGENT MEMORY</span>
              <strong>Hindsight</strong>
              <small>Learning continuously</small>
            </div>
          </div>
        </section>

        {/* ANALYSIS AREA */}
        <section className="analysis-layout">
          {/* LEFT - INVOICE */}
          <div className="card invoice-card">
            <div className="card-top">
              <div>
                <span className="eyebrow">NEW ANALYSIS</span>
                <h2>Invoice details</h2>
              </div>

              <div className="secure-label">
                <span>●</span> SECURE
              </div>
            </div>

            <div className="invoice-paper">
              <div className="invoice-header">
                <div className="invoice-brand">
                  <div className="mini-logo">AP</div>

                  <div>
                    <strong>AP Intelligence</strong>
                    <span>Invoice analysis</span>
                  </div>
                </div>

                <div className="invoice-id">
                  <span>INVOICE</span>
                  <strong>AP-2026</strong>
                </div>
              </div>

              <div className="paper-line"></div>

              <label>Vendor</label>

              <select
                value={vendor}
                onChange={(e) => {
                  setVendor(e.target.value);
                  setResult(null);
                }}
              >
                <option>ABC Industrial Supplies</option>
                <option>Global Office Solutions</option>
              </select>

              <div className="two-fields">
                <div>
                  <label>Invoice amount</label>

                  <div className="money-input">
                    <span>₹</span>

                    <input
                      type="number"
                      placeholder="72,000"
                      value={amount}
                      onChange={(e) =>
                        setAmount(e.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <label>Shipping</label>

                  <div className="money-input">
                    <span>₹</span>

                    <input
                      type="number"
                      placeholder="4,000"
                      value={shipping}
                      onChange={(e) =>
                        setShipping(e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <button
                className="analyze-btn"
                onClick={analyzeInvoice}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loader"></span>
                    Checking memory...
                  </>
                ) : (
                  <>
                    Analyze invoice
                    <span>→</span>
                  </>
                )}
              </button>
            </div>

            <div className="invoice-note">
              <span>✦</span>
              Analysis uses current invoice data + historical
              vendor memory.
            </div>
          </div>

          {/* RIGHT - VENDOR */}
          <div className="card vendor-card">
            <div className="card-top">
              <div>
                <span className="eyebrow">VENDOR INTELLIGENCE</span>
                <h2>Historical profile</h2>
              </div>

              <div className="verified">✓ Verified</div>
            </div>

            <div className="vendor-profile">
              <div className="vendor-avatar">
                {profile.initials}
              </div>

              <div>
                <h3>{vendor}</h3>
                <p>Known vendor profile</p>
              </div>
            </div>

            <div className="stats-grid">
              <Stat
                label="Typical invoices"
                value={profile.range}
              />

              <Stat
                label="Typical shipping"
                value={profile.shipping}
              />

              <Stat
                label="Payment terms"
                value={profile.terms}
              />

              <Stat
                label="Approval threshold"
                value={profile.threshold}
              />
            </div>

            <div className="memory-summary">
              <div className="memory-symbol">🧠</div>

              <div className="memory-summary-text">
                <strong>Persistent memory</strong>

                <p>
                  Previous invoices, exceptions and human
                  feedback can influence this decision.
                </p>
              </div>

              <div className="memory-number">
                {memories.length}
                <small>recalled</small>
              </div>
            </div>
          </div>
        </section>

        {/* DECISION */}
        <section className="decision-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">AI ANALYSIS</span>
              <h2>Decision center</h2>
            </div>

            {decision && (
              <DecisionBadge decision={decision} />
            )}
          </div>

          {!result ? (
            <div className="waiting-card">
              <div className="waiting-icon">
                ✦
              </div>

              <h3>Ready when you are</h3>

              <p>
                Submit an invoice to see the agent's decision,
                reasoning, and recalled Hindsight memories.
              </p>
            </div>
          ) : (
            <>
              <div className="decision-grid">
                {/* DECISION CARD */}
                <div
                  className={`card main-decision ${decision.toLowerCase()}`}
                >
                  <div className="decision-card-header">
                    <div>
                      <span className="eyebrow">
                        AGENT RECOMMENDATION
                      </span>

                      <div className="decision-title">
                        {decision === "APPROVE" && "✓"}
                        {decision === "REVIEW" && "!"}
                        {decision === "HOLD" && "×"}

                        <span>{decision}</span>
                      </div>
                    </div>

                    <div className="confidence">
                      <strong>{confidence}%</strong>
                      <span>confidence</span>
                    </div>
                  </div>

                  <div className="decision-reason">
                    <span>WHY?</span>

                    <p>
                      {result.decision?.reason ||
                        "The agent evaluated the invoice using vendor history and current invoice information."}
                    </p>
                  </div>

                  <div className="recommendation-box">
                    <span>RECOMMENDED ACTION</span>

                    <strong>
                      {result.decision?.recommendation ||
                        "Review invoice against the purchase order."}
                    </strong>
                  </div>
                </div>

                {/* INVOICE SNAPSHOT */}
                <div className="card snapshot-card">
                  <div className="snapshot-title">
                    Invoice snapshot
                  </div>

                  <div className="snapshot-row">
                    <span>Vendor</span>
                    <strong>{result.invoice.vendor_name}</strong>
                  </div>

                  <div className="snapshot-row">
                    <span>Invoice</span>
                    <strong>
                      ₹
                      {Number(
                        result.invoice.amount
                      ).toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div className="snapshot-row">
                    <span>Shipping</span>
                    <strong>
                      ₹
                      {Number(
                        result.invoice.shipping
                      ).toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div className="snapshot-row total">
                    <span>Total exposure</span>
                    <strong>
                      ₹
                      {(
                        Number(result.invoice.amount) +
                        Number(result.invoice.shipping)
                      ).toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div className="risk-meter">
                    <div className="risk-meter-top">
                      <span>AI confidence</span>
                      <strong>{confidence}%</strong>
                    </div>

                    <div className="meter">
                      <div
                        style={{
                          width: `${Math.min(
                            confidence,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* HINDSIGHT */}
              <div className="card hindsight">
                <div className="hindsight-top">
                  <div>
                    <div className="hindsight-brand">
                      <div>🧠</div>

                      <div>
                        <span>HINDSIGHT MEMORY</span>
                        <h2>What the agent remembers</h2>
                      </div>
                    </div>
                  </div>

                  <div className="memory-used">
                    <span></span>
                    {memories.length} memories recalled
                  </div>
                </div>

                {memories.length > 0 ? (
                  <div className="memory-list">
                    {memories.map((memory, index) => (
                      <div
                        className="memory-item"
                        key={index}
                      >
                        <div className="memory-index">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="memory-item-content">
                          <div className="memory-item-type">
                            {memory.type ||
                              "Historical memory"}
                          </div>

                          <p>
                            {memory.text ||
                              "Historical vendor information recalled by Hindsight."}
                          </p>
                        </div>

                        <div className="memory-arrow">
                          ↗
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-memory">
                    <div>○</div>

                    <div>
                      <strong>
                        No previous memory matched this invoice.
                      </strong>

                      <p>
                        The agent is evaluating this invoice
                        primarily from the current vendor profile.
                      </p>
                    </div>
                  </div>
                )}

                <div className="memory-effect">
                  <div className="effect-icon">✦</div>

                  <div>
                    <span>MEMORY → DECISION</span>

                    <p>
                      Historical context is supplied to the AI
                      before it makes the recommendation.
                    </p>
                  </div>
                </div>
              </div>

              {/* HUMAN FEEDBACK */}
              <div className="feedback-card">
                <div>
                  <span className="eyebrow">
                    HUMAN-IN-THE-LOOP
                  </span>

                  <h3>
                    Teach the agent what happened.
                  </h3>

                  <p>
                    Your decision is stored as persistent memory
                    for future invoices from this vendor.
                  </p>
                </div>

                <div className="feedback-buttons">
                  <button
                    onClick={() =>
                      sendFeedback("APPROVE")
                    }
                    className="approve-btn"
                  >
                    ✓ Approve
                  </button>

                  <button
                    onClick={() =>
                      sendFeedback("REVIEW")
                    }
                    className="review-btn"
                  >
                    Request review
                  </button>
                </div>
              </div>

              {feedbackSent && (
                <div className="feedback-success">
                  <span>✓</span>

                  <div>
                    <strong>
                      Learning saved to Hindsight
                    </strong>

                    <p>
                      This human decision can now influence
                      future vendor analysis.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* HISTORY */}
        <section className="history-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ACTIVITY</span>
              <h2>Recent decisions</h2>
            </div>

            <span className="history-total">
              {history.length} total
            </span>
          </div>

          {history.length === 0 ? (
            <div className="empty-history">
              No invoice decisions yet.
            </div>
          ) : (
            <div className="history-card">
              {history.map((item) => (
                <div className="history-row" key={item.id}>
                  <div className="history-vendor">
                    <div>
                      {item.vendor
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>

                    <span>{item.vendor}</span>
                  </div>

                  <div className="history-amount">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </div>

                  <DecisionBadge decision={item.decision} />

                  <div className="history-confidence">
                    {item.confidence}% confidence
                  </div>

                  <div className="history-time">
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer>
        <span>AP Intelligence</span>
        <span>Groq · Hindsight · AI Agent</span>
      </footer>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DecisionBadge({ decision }) {
  const normalized = decision?.toLowerCase();

  return (
    <div className={`decision-badge ${normalized}`}>
      <span></span>
      {decision}
    </div>
  );
}

export default App;