/** Industry routes for BizTime. */

const express = require('express');
const router = new express.Router();
const ExpressError = require('../expressError');
const db = require('../db');

router.get("/", async (req, res, next) => {
    try {

        // const industries = await db.query(`SELECT code, industry FROM industries`);

        const industriesCompanyCodes = await db.query(`SELECT i.code, i.industry, ic.comp_code FROM industries AS i LEFT JOIN industries_companies AS ic ON i.code = ic.ind_code`);
        return res.json({ industries_companies: industriesCompanyCodes.rows });

        // VERY tough to get a nice output for this route...

    } catch (err) {
        return next(err);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const { code, industry } = req.body;
        if ( !code || !industry ) throw new ExpressError(`New industry request body must have 'code' and 'industry' keys.`, 400);
        const result = await db.query(
            `INSERT INTO industries (code, industry)
             VALUES ($1, $2)
             RETURNING code, industry`,
            [code, industry]
        );
        return res.status(201).json({ industry: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.put("/", async (req, res, next) => {
    try {
        const { ind_code, comp_code } = req.body;

        if ( !ind_code || !comp_code ) throw new ExpressError(`New industry-company request body must have 'ind_code' and 'comp_code' keys`, 400);

        // check if the industry and company exist
        const industries = await db.query(`SELECT code FROM industries`);
        const industryCodes = industries.rows.map( industry => industry.code );
        if (industryCodes.indexOf(ind_code) === -1) throw new ExpressError(`Industry with code '${ind_code}' does not exist`, 400);

        const companies = await db.query(`SELECT code FROM companies`);
        const companyCodes = companies.rows.map( company => company.code );
        if (companyCodes.indexOf(comp_code) === -1) throw new ExpressError(`Company with code '${comp_code}' does not exist`, 400);

        // if so, proceed with creation
        const industryCompany = await db.query(`
            INSERT INTO industries_companies 
            (ind_code, comp_code) VALUES ($1, $2)
            RETURNING ind_code, comp_code`, 
            [ind_code, comp_code]
        );
        return res.status(201).json({ industry_company: industryCompany.rows[0] });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;