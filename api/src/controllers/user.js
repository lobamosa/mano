const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op } = require("sequelize");

const { catchErrors } = require("../errors");
const { validatePassword } = require("../utils");
const mailservice = require("../utils/mailservice");
const config = require("../config");
const { comparePassword } = require("../utils");

const User = require("../models/user");
const Action = require("../models/action");
const Person = require("../models/person");
const Comment = require("../models/comment");
const RelUserTeam = require("../models/relUserTeam");
const Team = require("../models/team");

const EMAIL_OR_PASSWORD_INVALID = "EMAIL_OR_PASSWORD_INVALID";
const PASSWORD_NOT_VALIDATED = "PASSWORD_NOT_VALIDATED";
const ACOUNT_NOT_ACTIVATED = "ACOUNT_NOT_ACTIVATED";

const passwordCheckError =
  "Le mot de passe n'est pas valide. Il doit comprendre 6 caractères, au moins une lettre, un chiffre et un caractère spécial";

const JWT_MAX_AGE = 60 * 60 * 3; // 3 hours in s
const COOKIE_MAX_AGE = JWT_MAX_AGE * 1000;

function cookieOptions() {
  if (config.ENVIRONMENT === "development") {
    return { maxAge: COOKIE_MAX_AGE, httpOnly: true, secure: true, sameSite: "None" };
  } else {
    return { maxAge: COOKIE_MAX_AGE, httpOnly: true, secure: true, domain: ".fabrique.social.gouv.fr", sameSite: "Lax" };
  }
}

function logoutCookieOptions() {
  return { httpOnly: true, secure: true, sameSite: "None" };
}

router.get(
  "/me",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const user = await User.findOne({ where: { _id: req.user._id } });
    const teams = await user.getTeams();
    const organisation = await user.getOrganisation();
    return res.status(200).send({ ok: true, user: { ...user.toJSON(), teams, organisation } });
  })
);

router.post(
  "/logout",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    res.clearCookie("jwt", logoutCookieOptions());
    return res.status(200).send({ ok: true });
  })
);

router.post(
  "/signin",
  catchErrors(async (req, res) => {
    let { password, email } = req.body;
    if (!password || !email) return res.status(400).send({ ok: false, error: "Missing password" });
    email = (email || "").trim().toLowerCase();
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(403).send({ ok: false, error: "E-mail ou mot de passe incorrect", code: EMAIL_OR_PASSWORD_INVALID });

    const { password: expectedPassword } = await User.scope("withPassword").findOne({ where: { email }, attributes: ["password"] });

    const match = await comparePassword(password, expectedPassword);
    if (!match) return res.status(403).send({ ok: false, error: "E-mail ou mot de passe incorrect", code: EMAIL_OR_PASSWORD_INVALID });
    user.lastLoginAt = new Date();

    await user.save();

    const organisation = await user.getOrganisation();
    const orgTeams = await Team.findAll({ where: { organisation: organisation._id } });
    const userTeams = await RelUserTeam.findAll({ where: { user: user._id, team: { [Op.in]: orgTeams.map((t) => t._id) } } });
    const teams = userTeams.map((rel) => orgTeams.find((t) => t._id === rel.team));

    const token = jwt.sign({ _id: user._id }, config.SECRET, { expiresIn: JWT_MAX_AGE });
    res.cookie("jwt", token, cookieOptions());

    return res.status(200).send({ ok: true, token, user: { ...user.toJSON(), teams, organisation } });
  })
);

router.get(
  "/signin-token",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const token = req.cookies.jwt;
    const user = await User.findOne({ where: { _id: req.user._id } });

    const organisation = await user.getOrganisation();
    const orgTeams = await Team.findAll({ where: { organisation: organisation._id } });
    const userTeams = await RelUserTeam.findAll({ where: { user: user._id, team: { [Op.in]: orgTeams.map((t) => t._id) } } });
    const teams = userTeams.map((rel) => orgTeams.find((t) => t._id === rel.team));

    return res.status(200).send({ ok: true, token, user: { ...user.toJSON(), teams, organisation } });
  })
);

//@todo
router.post(
  "/forgot_password",
  catchErrors(async ({ body: { email } }, res, cta) => {
    if (!email) return res.status(403).send({ ok: false, error: "Veuillez fournir un email", code: EMAIL_OR_PASSWORD_INVALID });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(403).send({ ok: false, error: "E-mail ou mot de passe incorrect", code: EMAIL_OR_PASSWORD_INVALID });

    const { password } = await User.scope("withPassword").findOne({ where: { email }, attributes: ["password"] });
    if (!password)
      return res.status(403).send({ ok: false, error: "Compte inactif, veuillez contacter l'administrateur", code: ACOUNT_NOT_ACTIVATED });

    const token = crypto.randomBytes(20).toString("hex");
    user.forgotPasswordResetToken = token;
    user.forgotPasswordResetExpires = new Date(Date.now() + JWT_MAX_AGE * 1000);

    const link = `https://dashboard-mano.fabrique.social.gouv.fr/auth/reset?token=${token}`;

    await user.save();

    const subject = "Réinitialiser votre mot de passe";
    const body = `Une requête pour réinitialiser votre mot de passe a été effectuée.
Si elle ne vient pas de vous, veuillez avertir l'administrateur.
Si vous en êtes à l'origine, vous pouvez cliquer sur ce lien: ${link}`;
    await mailservice.sendEmail(user.email, subject, body);

    return res.status(200).send({ ok: true });
  })
);

//@todo
router.post(
  "/forgot_password_reset",
  catchErrors(async ({ body: { token, password } }, res) => {
    if (!validatePassword(password)) return res.status(400).send({ ok: false, error: passwordCheckError, code: PASSWORD_NOT_VALIDATED });
    const user = await User.findOne({ where: { forgotPasswordResetToken: token, forgotPasswordResetExpires: { [Op.gte]: new Date() } } });

    if (!user) return res.status(400).send({ ok: false, error: "Le lien est non valide ou expiré" });
    user.set({
      password: password,
      forgotPasswordResetToken: null,
      forgotPasswordResetExpires: null,
      lastChangePasswordAt: Date.now(),
    });
    await user.save();
    return res.status(200).send({ ok: true });
  })
);

//@todo
router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    if (req.user.role !== "admin") {
      capture("attempt of creating a user with no admin role", { user: req.user });
      return res.status(403).send({ ok: false, error: "Action interdite ! Veuillez contacter un administrateur" });
    }
    if (!req.body.name) return res.status(403).send({ ok: false, error: "A name is required" });
    if (!req.body.email) return res.status(403).send({ ok: false, error: "An email is required" });
    if (!req.body.password) return res.status(403).send({ ok: false, error: "A password is required" });
    if (!req.body.organisation) return res.status(403).send({ ok: false, error: "An organisation is required" });
    if (!req.body.role) return res.status(403).send({ ok: false, error: "A role is required" });
    const newUser = {};
    newUser.name = req.body.name;
    newUser.email = req.body.email.trim().toLowerCase();
    newUser.password = req.body.password;
    newUser.organisation = req.body.organisation;
    newUser.role = req.body.role;

    const prevUser = await User.findOne({ where: { email: newUser.email } });
    if (!!prevUser) return res.status(400).send({ ok: false, error: "A user already exists with this email" });

    const data = await User.create(newUser, { returning: true });

    if (req.body.hasOwnProperty("team")) {
      const user = await User.findOne({ where: { _id: data._id } });
      const tx = await User.sequelize.transaction();
      const team = req.body.team;
      if (team && Array.isArray(team)) {
        await RelUserTeam.bulkCreate(
          team.map((teamId) => ({ user: data._id, team: teamId })),
          { transaction: tx }
        );
      }
      await tx.commit();
      await user.save({ transaction: tx });
    }

    return res.status(200).send({ ok: true, data });
  })
);

router.post(
  "/reset_password",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const _id = req.user._id;
    const { password, newPassword, verifyPassword } = req.body;

    if (newPassword !== verifyPassword) return res.status(400).send({ ok: false, error: "Les mots de passe ne sont pas identiques" });
    if (!validatePassword(newPassword)) return res.status(400).send({ ok: false, error: passwordCheckError, code: PASSWORD_NOT_VALIDATED });

    const user = await User.findOne({ where: { _id } });

    const { password: expectedPassword } = await User.scope("withPassword").findOne({ where: { _id }, attributes: ["password"] });

    const auth = await comparePassword(password, expectedPassword);
    if (!auth) return res.status(403).send({ ok: false, error: "Mot de passe incorrect", code: "Mot de passe incorrect" });

    user.set({
      password: newPassword,
      lastChangePasswordAt: Date.now(),
    });
    await user.save();

    const userWithoutPassword = await User.findOne({ where: { _id } });

    return res.status(200).send({ ok: true, user: userWithoutPassword });
  })
);

//@checked
router.get(
  "/:id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const query = { where: { _id: req.params.id } };
    query.where.organisation = req.user.organisation;
    const user = await User.findOne(query);
    const team = await user.getTeams({ raw: true, attributes: ["_id"] });
    let data = user.toJSON();
    data.team = team.map((t) => t._id);
    return res.status(200).send({ ok: true, data });
  })
);

//@checked
router.get(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const where = {};
    where.organisation = req.user.organisation;

    const users = await User.findAll({ where });
    const data = [];

    if (req.user.role !== "admin" || req.query.minimal === "true") {
      for (let user of users) {
        data.push({ name: user.name, _id: user._id });
      }
      return res.status(200).send({ ok: true, data });
    }

    for (let user of users) {
      const teams = await user.getTeams();
      data.push({ ...user.toJSON(), teams });
    }
    return res.status(200).send({ ok: true, data });
  })
);

//@checked
router.put(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const _id = req.user._id;
    const { name, email, password, team, termsAccepted } = req.body;

    const user = await User.findOne({ where: { _id } });
    if (!user) return res.status(404).send({ ok: false, error: "Utilisateur non trouvé" });
    const tx = await User.sequelize.transaction();

    if (name) user.name = name;
    if (email) user.email = email;
    if (termsAccepted) user.termsAccepted = termsAccepted;
    if (password) user.password = password;
    if (team && Array.isArray(team)) {
      await RelUserTeam.destroy({ where: { user: _id }, transaction: tx });
      await RelUserTeam.bulkCreate(
        team.map((teamId) => ({ user: _id, team: teamId })),
        { transaction: tx }
      );
    }

    await user.save({ transaction: tx });

    await tx.commit();
    return res.status(200).send({ ok: true, user });
  })
);

//@checked
router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const _id = req.params._id;

    if (req.user.role !== "admin") {
      capture("attempt of updating a user with no admin role", { user: req.user });
      return res.status(403).send({ ok: false, error: "Action interdite ! Veuillez contacter un administrateur" });
    }
    const { name, email, team, role } = req.body;

    const user = await User.findOne({ where: { _id, organisation: req.user.organisation } });
    if (!user) return res.status(404).send({ ok: false, error: "Not Found" });
    const tx = await User.sequelize.transaction();

    if (name) user.name = name;
    if (email) user.email = email.trim().toLowerCase();
    if (role) user.role = role;

    if (team && Array.isArray(team)) {
      await RelUserTeam.destroy({ where: { user: _id }, transaction: tx });
      await RelUserTeam.bulkCreate(
        team.map((teamId) => ({ user: _id, team: teamId })),
        { transaction: tx }
      );
    }

    await user.save({ transaction: tx });

    await tx.commit();

    return res.status(200).send({ ok: true, user });
  })
);

//@checked
router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    if (req.user.role !== "admin") {
      capture("attempt of deleting a user with no admin role", { user: req.user });
      return res.status(403).send({ ok: false, error: "Action interdite ! Veuillez contacter un administrateur" });
    }

    const userId = req.params._id;

    const fkQuery = { where: { user: userId } };
    await Comment.update({ user: null }, fkQuery);
    await Action.update({ user: null }, fkQuery);
    await Person.update({ user: null }, fkQuery);

    const query = { where: { _id: userId } };
    query.where.organisation = req.user.organisation;

    let user = await User.findOne(query);
    if (!user) return res.status(404).send({ ok: false, error: "Not Found" });

    let tx = await User.sequelize.transaction();

    await Promise.all([User.destroy({ ...query, transaction: tx }), RelUserTeam.destroy({ where: { user: userId }, transaction: tx })]);
    await user.destroy({ transaction: tx });
    await tx.commit();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
