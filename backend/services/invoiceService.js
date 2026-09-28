const { pool } = require("../config/db");


async function saveInvoiceDecision(data) {

    const query = `
        INSERT INTO invoice_decisions (
            invoice_number,
            vendor_name,
            invoice_amount,
            shipping,
            total_amount,
            ai_decision,
            confidence,
            ai_reason,
            recommendation
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;


    const values = [
        data.invoice_number || null,

        data.vendor_name,

        Number(data.amount) || 0,

        Number(data.shipping) || 0,

        Number(data.total_amount) || 0,

        data.decision,

        Number(data.confidence) || 0,

        data.reason || null,

        data.recommendation || null
    ];


    const [result] = await pool.execute(
        query,
        values
    );


    return result.insertId;
}


async function getInvoiceHistory() {

    const query = `
        SELECT
            id,
            invoice_number,
            vendor_name,
            invoice_amount,
            shipping,
            total_amount,
            ai_decision,
            confidence,
            ai_reason,
            recommendation,
            human_decision,
            feedback,
            duplicate_detected,
            created_at,
            updated_at
        FROM invoice_decisions
        ORDER BY created_at DESC
    `;


    const [rows] = await pool.execute(query);

    return rows;
}


async function getVendorHistory(vendorName) {

    const query = `
        SELECT
            id,
            invoice_number,
            vendor_name,
            invoice_amount,
            shipping,
            total_amount,
            ai_decision,
            confidence,
            human_decision,
            feedback,
            duplicate_detected,
            created_at
        FROM invoice_decisions
        WHERE LOWER(vendor_name) = LOWER(?)
        ORDER BY created_at DESC
    `;


    const [rows] = await pool.execute(
        query,
        [vendorName]
    );


    return rows;
}


async function updateHumanFeedback(data) {

    const query = `
        UPDATE invoice_decisions

        SET
            human_decision = ?,
            feedback = ?

        WHERE id = ?
    `;


    const [result] = await pool.execute(
        query,
        [
            data.human_decision,
            data.feedback || null,
            data.id
        ]
    );


    return result.affectedRows;
}


module.exports = {
    saveInvoiceDecision,
    getInvoiceHistory,
    getVendorHistory,
    updateHumanFeedback
};