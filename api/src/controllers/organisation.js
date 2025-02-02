const express = require("express");
const router = express.Router();
const passport = require("passport");
const { fn } = require("sequelize");
const crypto = require("crypto");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const Organisation = require("../models/organisation");
const User = require("../models/user");
const Action = require("../models/action");
const Person = require("../models/person");
const Territory = require("../models/territory");
const Report = require("../models/report");
const Comment = require("../models/comment");
const Passage = require("../models/passage");
const mailservice = require("../utils/mailservice");
const validateUser = require("../middleware/validateUser");
const { looseUuidRegex, customFieldSchema } = require("../utils");
const { capture } = require("../sentry");

const JWT_MAX_AGE = 60 * 60 * 3; // 3 hours in s

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser("superadmin"),
  catchErrors(async (req, res, next) => {
    try {
      z.string().min(1).parse(req.body.orgName);
      z.string().min(1).parse(req.body.name);
      z.string().email().parse(req.body.email);
    } catch (e) {
      const error = new Error(`Invalid request in organisation post: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { orgName, name, email } = req.body;
    const organisation = await Organisation.create({ name: orgName }, { returning: true });
    const token = crypto.randomBytes(20).toString("hex");
    const adminUser = await User.create(
      {
        name: name,
        email: email.trim().toLowerCase(),
        password: crypto.randomBytes(60).toString("hex"), // A useless password.,
        role: "admin",
        organisation: organisation._id,
        forgotPasswordResetToken: token,
        forgotPasswordResetExpires: new Date(Date.now() + JWT_MAX_AGE * 1000),
      },
      { returning: true }
    );

    const subject = "Bienvenue dans Mano 👋";
    const body = `Bonjour ${adminUser.name} !

Un compte Mano pour votre organisation ${organisation.name} vient d'être créé.

Votre identifiant pour vous connecter à Mano est ${adminUser.email}.
Vous pouvez dès à présent vous connecter pour choisir votre mot de passe ici:
https://dashboard-mano.fabrique.social.gouv.fr/auth/reset?token=${token}

Vous pourrez ensuite paramétrer votre organisation et commencer à utiliser Mano en suivant ce lien:
https://dashboard-mano.fabrique.social.gouv.fr/

Toute l'équipe Mano vous souhaite la bienvenue !

Si vous avez des questions n'hésitez pas à nous contacter:

Nathan Fradin, chargé de déploiement: nathan.fradin.mano@gmail.com - +33 6 29 54 94 26
Guillaume Demirhan, porteur du projet: g.demirhan@aurore.asso.fr - +33 7 66 56 19 96
`;
    await mailservice.sendEmail(adminUser.email, subject, body);

    return res.status(200).send({ ok: true });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser("superadmin"),
  catchErrors(async (req, res, next) => {
    try {
      z.optional(z.string()).parse(req.query.withCounters);
    } catch (e) {
      const error = new Error(`Invalid request in organisation get: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { withCounters } = req.query;
    const data = await Organisation.findAll();
    if (withCounters !== "true") return res.status(200).send({ ok: true, data });

    const countQuery = {
      group: ["organisation"],
      attributes: ["organisation", [fn("COUNT", "TagName"), "countByOrg"]],
    };
    const actions = (await Action.findAll(countQuery)).map((item) => item.toJSON());
    const persons = (await Person.findAll(countQuery)).map((item) => item.toJSON());
    const territories = (await Territory.findAll(countQuery)).map((item) => item.toJSON());
    const reports = (await Report.findAll(countQuery)).map((item) => item.toJSON());
    const comments = (await Comment.findAll(countQuery)).map((item) => item.toJSON());
    const passages = (await Passage.findAll(countQuery)).map((item) => item.toJSON());

    return res.status(200).send({
      ok: true,
      data: data
        .map((org) => org.toJSON())
        .map((org) => {
          const counters = {
            actions: actions.find((a) => a.organisation === org._id) ? Number(actions.find((a) => a.organisation === org._id).countByOrg) : 0,
            persons: persons.find((p) => p.organisation === org._id) ? Number(persons.find((p) => p.organisation === org._id).countByOrg) : 0,
            territories: territories.find((t) => t.organisation === org._id)
              ? Number(territories.find((t) => t.organisation === org._id).countByOrg)
              : 0,
            reports: reports.find((r) => r.organisation === org._id) ? Number(reports.find((r) => r.organisation === org._id).countByOrg) : 0,
            comments: comments.find((r) => r.organisation === org._id) ? Number(comments.find((r) => r.organisation === org._id).countByOrg) : 0,
            passages: passages.find((r) => r.organisation === org._id) ? Number(passages.find((r) => r.organisation === org._id).countByOrg) : 0,
          };
          return {
            ...org,
            counters,
            countersTotal: Object.keys(counters).reduce((total, key) => total + (counters[key] || 0), 0),
          };
        }),
    });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
      if (req.user.role !== "admin") {
        z.array(z.string()).parse(req.body.collaborations);
      } else {
        z.optional(z.string().min(1)).parse(req.body.name);
        z.optional(z.array(z.string().min(1))).parse(req.body.categories);
        z.optional(z.array(z.string().min(1))).parse(req.body.collaborations);
        z.optional(z.array(customFieldSchema)).parse(req.body.customFieldsObs);
        z.optional(z.array(customFieldSchema)).parse(req.body.customFieldsPersonsSocial);
        z.optional(z.array(customFieldSchema)).parse(req.body.customFieldsPersonsMedical);
        z.optional(
          z.array(
            z.object({
              name: z.string().min(1),
              fields: z.array(customFieldSchema),
            })
          )
        ).parse(req.body.consultations);

        z.optional(z.string().min(1)).parse(req.body.encryptedVerificationKey);
        z.optional(z.boolean()).parse(req.body.encryptionEnabled);
        if (req.body.encryptionLastUpdateAt) z.preprocess((input) => new Date(input), z.date()).parse(req.body.encryptionLastUpdateAt);
        z.optional(z.boolean()).parse(req.body.receptionEnabled);
        z.optional(z.array(z.string().min(1))).parse(req.body.services);
      }
    } catch (e) {
      const error = new Error(`Invalid request in organisation put: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { _id } = req.params;

    const canUpdate = req.user.organisation === _id;
    if (!canUpdate) return res.status(403).send({ ok: false, error: "Forbidden" });

    const organisation = await Organisation.findOne({ where: { _id } });
    if (!organisation) return res.status(404).send({ ok: false, error: "Not Found" });

    if (req.user.role !== "admin") {
      await organisation.update({ collaborations: req.body.collaborations });
      return res.status(200).send({ ok: true, data: organisation });
    }

    const updateOrg = {};
    if (req.body.hasOwnProperty("name")) updateOrg.name = req.body.name;
    if (req.body.hasOwnProperty("categories")) updateOrg.categories = req.body.categories;
    if (req.body.hasOwnProperty("collaborations")) updateOrg.collaborations = req.body.collaborations;
    if (req.body.hasOwnProperty("customFieldsObs"))
      updateOrg.customFieldsObs = typeof req.body.customFieldsObs === "string" ? JSON.parse(req.body.customFieldsObs) : req.body.customFieldsObs;
    if (req.body.hasOwnProperty("customFieldsPersonsSocial"))
      updateOrg.customFieldsPersonsSocial =
        typeof req.body.customFieldsPersonsSocial === "string" ? JSON.parse(req.body.customFieldsPersonsSocial) : req.body.customFieldsPersonsSocial;
    if (req.body.hasOwnProperty("customFieldsPersonsMedical"))
      updateOrg.customFieldsPersonsMedical =
        typeof req.body.customFieldsPersonsMedical === "string"
          ? JSON.parse(req.body.customFieldsPersonsMedical)
          : req.body.customFieldsPersonsMedical;
    if (req.body.hasOwnProperty("consultations"))
      updateOrg.consultations = typeof req.body.consultations === "string" ? JSON.parse(req.body.consultations) : req.body.consultations;
    if (req.body.hasOwnProperty("encryptedVerificationKey")) updateOrg.encryptedVerificationKey = req.body.encryptedVerificationKey;
    if (req.body.hasOwnProperty("encryptionEnabled")) updateOrg.encryptionEnabled = req.body.encryptionEnabled;
    if (req.body.hasOwnProperty("encryptionLastUpdateAt")) updateOrg.encryptionLastUpdateAt = req.body.encryptionLastUpdateAt;
    if (req.body.hasOwnProperty("receptionEnabled")) updateOrg.receptionEnabled = req.body.receptionEnabled;
    if (req.body.hasOwnProperty("services")) updateOrg.services = req.body.services;

    await organisation.update(updateOrg);

    return res.status(200).send({ ok: true, data: organisation });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["superadmin", "admin"]),
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
    } catch (e) {
      const error = new Error(`Invalid request in organisation delete: ${e}`);
      error.status = 400;
      return next(error);
    }
    // Super admin can delete any organisation. Admin can delete only their organisation.
    const canDelete = req.user.role === "superadmin" || (req.user.role === "admin" && req.user.organisation === req.params._id);
    if (!canDelete) return res.status(403).send({ ok: false, error: "Forbidden" });

    const result = await Organisation.destroy({ where: { _id: req.params._id } });
    if (result === 0) return res.status(404).send({ ok: false, error: "Not Found" });
    return res.status(200).send({ ok: true });
  })
);

module.exports = router;
