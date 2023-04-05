/** Invoice routes for BizTime. */

const express = require('express');
const router = new express.Router();
const ExpressError = require('../expressError');
const db = require('../db');

router.get("/", async (req, res, next) => {
    try {
        const results = await db.query(
            `SELECT id, comp_code FROM invoices`
        );
        return res.json({ invoices: results.rows });
    } catch (err) {
        return next(err);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        if ( !comp_code || !amt ) throw new ExpressError(`Invoice must have 'comp_code' and 'amt' keys.`, 400);
        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt)
             VALUES ($1, $2)
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]
        );
        return res.status(201).json({ invoice: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.get("/:id", async (req, res, next) => {
    try {
        const result = await db.query(`SELECT id, amt, paid, add_date, paid_date, comp_code FROM invoices WHERE id=$1`, [req.params.id]);

        if (result.rows.length === 0) throw new ExpressError(`Invoice with ID '${req.params.id}' could not be found.`, 404);

        const company = await db.query(`SELECT code, name, description FROM companies WHERE code=$1`, [result.rows[0].comp_code]);

        // console.log(result.rows[0], company.rows[0]);

        const response_object = result.rows[0];
        delete response_object.comp_code;
        response_object.company = company.rows[0];

        return res.json({ invoice: response_object });
    } catch (err) {
        return next(err);
    }
});

router.put("/:id", async (req, res, next) => {
    try {
        const { amt, paid } = req.body;

        if ( !amt || !paid ) throw new ExpressError(`Update request body must have invoice 'amt' and 'paid' keys.`, 400);

        const currentInvoice = await db.query(
            `SELECT paid_date
             FROM invoices
             WHERE id=$1`,
            [req.params.id]);

        if (currentInvoice.rows.length === 0) throw new ExpressError(`Invoice with ID '${req.params.id}' could not be found.`, 404);

        let paidDate;
        const currentPaidDate = currentInvoice.rows[0].paid_date;

        if (!currentPaidDate && paid) paidDate = new Date();
        else if (!paid) paidDate = null;
        else paidDate = currentPaidDate;

        const result = await db.query(
            `UPDATE invoices
             SET amt=$1, paid=$2, paid_date=$3
             WHERE id=$4
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, paid, paidDate, req.params.id]);
    
        return res.json({ invoice: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.delete("/:id", async (req, res, next) => {
    try {
        const result = await db.query(
            `DELETE FROM invoices WHERE id=$1
             RETURNING id, comp_code, amt`,
            [req.params.id]
        );

        if (result.rows.length === 0) throw new ExpressError(`Invoice with ID '${req.params.id}' could not be found`, 404);

        return res.json({ status: "deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;