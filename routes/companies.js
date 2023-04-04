/** Company routes for BizTime. */

const express = require('express');
const router = new express.Router();
const ExpressError = require('../expressError');
const db = require('../db');

router.get("/", async (req, res, next) => {
    try {
        const results = await db.query(
            `SELECT code, name FROM companies`
        );
        return res.json({ companies: results.rows });
    } catch (err) {
        return next(err);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const { code, name, description } = req.body;
        if ( !code || !name || !description ) throw new ExpressError(`Company must have 'code', 'name', and 'description' keys.`, 400);
        const result = await db.query(
                `INSERT INTO companies (code, name, description)
                VALUES ($1, $2, $3)
                RETURNING code, name, description`,
            [code, name, description]
        );
        return res.status(201).json({ company: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.get("/:code", async (req, res, next) => {
    try {
        const result = await db.query(`SELECT code, name, description FROM companies WHERE code=$1`, [req.params.code]);

        if (result.rows.length === 0) throw new ExpressError(`Company with code '${req.params.code}' could not be found`, 404);
        
        const invoices = await db.query(`SELECT id FROM invoices WHERE comp_code=$1`, [result.rows[0].code]);
        
        const invoiceIds = invoices.rows.map( invoice => invoice.id );

        const response_object = result.rows[0];
        response_object.invoices = invoiceIds;

        return res.json({ company: response_object });
        
    } catch (err) {
        return next(err);
    }
});

router.put("/:code", async (req, res, next) => {
    try {
        const { name, description } = req.body;
        if ( !name || !description ) throw new ExpressError(`Update request body must have company 'name' and 'description' keys.`, 400);

        const result = await db.query(
            `UPDATE companies SET name=$1, description=$2
             WHERE code=$3
             RETURNING code, name, description`,
            [name, description, req.params.code]);

        if (result.rows.length === 0) throw new ExpressError(`Company with code '${req.params.code}' could not be found`, 404);
        
        return res.json({ company: result.rows[0] });    
    } catch (err) {
        return next(err);
    }
});

router.delete("/:code", async (req, res, next) => {
    try {

        const result = await db.query(
            `DELETE FROM companies WHERE code=$1
             RETURNING code, name, description`,
            [req.params.code]
        );

        if (result.rows.length === 0) throw new ExpressError(`Company with code '${req.params.code}' could not be found`, 404);

        return res.json({ status: "deleted" });
    } catch(err) {
        return next(err);
    }
});

module.exports = router;