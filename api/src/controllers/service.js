const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const { looseUuidRegex } = require("../utils");
const sequelize = require("../db/sequelize");
const { catchErrors } = require("../errors");
const Organisation = require("../models/organisation");
const Report = require("../models/report");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const { capture } = require("../sentry");
const validateUser = require("../middleware/validateUser");

router.put(
  "/",
  passport.authenticate("user", { session: false }),
  validateEncryptionAndMigrations,
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.array(
        z.object({
          _id: z.string().regex(looseUuidRegex),
          encrypted: z.string(),
          encryptedEntityKey: z.string(),
        })
      ).parse(req.body.reports);
      z.array(z.string()).parse(req.body.services);
    } catch (e) {
      const error = new Error(`Invalid request in services put: ${e}`);
      error.status = 400;
      return next(error);
    }

    const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });
    if (!organisation) return res.status(404).send({ ok: false, error: "Not Found" });

    try {
      await sequelize.transaction(async (tx) => {
        const { reports = [] } = req.body;

        for (let { encrypted, encryptedEntityKey, _id } of reports) {
          await Report.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }

        organisation.set({ services: req.body.services });
        await organisation.save({ transaction: tx });
      });
    } catch (e) {
      capture("error updating service", e);
      throw e;
    }
    return res.status(200).send({ ok: true });
  })
);

module.exports = router;
