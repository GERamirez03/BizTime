/** BizTime express application. */


const express = require("express");

const app = express();
const ExpressError = require("./expressError")

const companyRoutes = require("./routes/companies");
const invoiceRoutes = require("./routes/invoices");
const industryRoutes = require("./routes/industries");

/** Parse incoming request bodies with JSON */

app.use(express.json());

/** Use companies, invoices, and industries routers */

app.use("/companies", companyRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/industries", industryRoutes);

/** 404 handler */

app.use(function(req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500);

  return res.json({
    error: err,
    // message: err.message <-- Commented out to avoid printing error message twice
  });
});


module.exports = app;
