const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");
const { catchErrors } = require("../errors");
const validateOrganisationEncryption = require("../middleware/validateOrganisationEncryption");
const validateUser = require("../middleware/validateUser");
const RelPersonPlace = require("../models/relPersonPlace");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  validateOrganisationEncryption,
  catchErrors(async (req, res, next) => {
    const { person, place } = req.body;
    if (!person || !place) return res.status(400).send({ ok: false, error: "Missing place or person" });

    const newRelPersonPlace = {};

    newRelPersonPlace.organisation = req.user.organisation;

    if (!req.body.hasOwnProperty("encrypted") || !req.body.hasOwnProperty("encryptedEntityKey")) {
      return next("No encrypted field in relPersonPlace create");
    }

    if (req.body.hasOwnProperty("encrypted")) newRelPersonPlace.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) newRelPersonPlace.encryptedEntityKey = req.body.encryptedEntityKey || null;

    const data = await RelPersonPlace.create(newRelPersonPlace, { returning: true });

    return res.status(200).send({ ok: true, data });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res) => {
    const query = {
      where: {
        organisation: req.user.organisation,
      },
      order: [["createdAt", "DESC"]],
    };
    if (req.query.lastRefresh) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(req.query.lastRefresh)) };
    }

    const total = await RelPersonPlace.count(query);
    const limit = parseInt(req.query.limit, 10);
    if (!!req.query.limit) query.limit = limit;
    if (req.query.page) query.offset = parseInt(req.query.page, 10) * limit;

    const data = await RelPersonPlace.findAll({
      ...query,
      attributes: [
        // Generic fields
        "_id",
        "encrypted",
        "encryptedEntityKey",
        "organisation",
        "createdAt",
        "updatedAt",
      ],
    });
    return res.status(200).send({ ok: true, data, hasMore: data.length === limit, total });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res) => {
    const { _id } = req.params;
    await RelPersonPlace.destroy({ where: { _id } });
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
