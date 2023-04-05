/** Company routes for BizTime. */

const express = require('express');
const router = new express.Router();
const ExpressError = require('../expressError');
const db = require('../db');

const slugify = require('slugify');

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
        const { name, description } = req.body;
        if ( !name || !description ) throw new ExpressError(`Company object must have 'name' and 'description' keys.`, 400);
        const code = slugify(name, {
            remove: /[\s*+~.()'"!:@]/g,
            lower: true,
            strict: true
        })
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
        // grab the company and industry information in one query
        const industryResult = await db.query(`
            SELECT c.code, c.name, c.description, i.industry 
                FROM companies AS c 
            LEFT JOIN industries_companies AS ic 
                ON ic.comp_code = c.code 
            LEFT JOIN industries AS i 
                ON ic.ind_code = i.code 
            WHERE c.code=$1`, 
            [req.params.code]
        );

        // grab the invoice information in another parallel query
        const invoiceResult = await db.query(`
            SELECT id 
            FROM invoices 
            WHERE comp_code=$1`, 
            [req.params.code]
        );

        // if industryResult.rows is of length 0, then the company is invalid
        if (industryResult.rows.length === 0) throw new ExpressError(`Company with code '${req.params.code}' could not be found`, 404);

        // parse the data from the queries
        const { code, name, description } = industryResult.rows[0];
        const industries = industryResult.rows.map( row => row.industry );
        const invoices = invoiceResult.rows.map( invoice => invoice.id );

        // assemble the response object
        const response_object = { code, name, description, industries, invoices };

        // return the response object as json
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