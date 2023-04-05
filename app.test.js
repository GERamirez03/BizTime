/** Tests for BizTime app */

// connect to test DB biztime_test
process.env.NODE_ENV = "test";

// import packages
const request = require("supertest");

// import app
const app = require("./app");
const db = require("./db");

let testCompany;

beforeAll(async function() {
    // delete companies (invoices cascade)
    await db.query(`DELETE FROM companies`);
});

beforeEach(async function() {
    // insert test company
    let result = await db.query(`
        INSERT INTO companies (code, name, description)
        VALUES ('test', 'Test Company', 'A fake company for testing.')
        RETURNING code, name, description`);
    testCompany = result.rows[0];
    // console.log(testCompany);
});

afterEach(async function() {
    // clear data from tests
    await db.query(`DELETE FROM companies`);
});

afterAll(async function() {
    // close db connection
    await db.end();
});

describe("GET /companies", function() {
    test("Gets a list of 1 company", async function() {
        const response = await request(app).get(`/companies`);
        expect(response.statusCode).toEqual(200);

        /** test against the testCompany without description
            since this route only fetches company code and name */

        const testCompanyNoDescription = testCompany;
        delete testCompanyNoDescription.description;

        // console.log(response.body);
        expect(response.body).toEqual({
            companies: [testCompanyNoDescription]
        });
    });
});

describe("GET /companies/:code", function() {
    test("Gets a single company with invoices", async function() {
        const response = await request(app).get(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);

        /** test against testCompany with an empty
            invoices array since none have been made */

        const testObject = testCompany;
        testObject.invoices = [];

        expect(response.body).toEqual({
            company: testObject
        });
    });

    test("Responds with 404 if invalid company", async function() {
        const response = await request(app).get(`/companies/00000`);
        expect(response.statusCode).toEqual(404);
    });
});

describe("POST /companies", function() {
    test("Creates a new company", async function() {
        const response = await request(app)
            .post(`/companies`)
            .send({
                code: "intel",
                name: "Intel Corp.",
                description: "Manufactures processors."
            });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            company: {
                code: "intel",
                name: "Intel Corp.",
                description: "Manufactures processors."
            }
        });
    });
});

describe("PUT /companies/:code", function() {
    test("Updates a single company", async function() {
        const response = await request(app)
            .put(`/companies/${testCompany.code}`)
            .send({
                name: "SuperTest Company",
                description: "The Test Company has been upgraded for super-testing!"
            });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: {
                code: 'test',
                name: 'SuperTest Company',
                description: 'The Test Company has been upgraded for super-testing!'
            }
        });
    });

    test("Responds with 404 if invalid company", async function() {
        const response = await request(app)
            .put(`/companies/00000`)
            .send({
                name: "SuperTest Company",
                description: "The Test Company has been upgraded for super-testing!"
            });
        expect(response.statusCode).toEqual(404);
    });
});

describe("DELETE /companies/:code", function() {
    test("Deletes a single company", async function() {
        const response = await request(app)
            .delete(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ status: "deleted" });
    });
});