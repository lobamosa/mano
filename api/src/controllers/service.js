const express = require("express");
const router = express.Router();
const passport = require("passport");
const sequelize = require("../db/sequelize");
const { catchErrors } = require("../errors");
const Organisation = require("../models/organisation");
const Report = require("../models/report");
const validateOrganisationEncryption = require("../middleware/validateOrganisationEncryption");
const { capture } = require("../sentry");
const validateUser = require("../middleware/validateUser");

router.put(
  "/",
  passport.authenticate("user", { session: false }),
  validateOrganisationEncryption,
  validateUser("admin"),
  catchErrors(async (req, res) => {
    const query = { where: { _id: req.user.organisation } };
    const organisation = await Organisation.findOne(query);
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