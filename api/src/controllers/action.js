const express = require("express");
const router = express.Router();
const passport = require("passport");

const { catchErrors } = require("../errors");

const Action = require("../models/action");
const encryptedTransaction = require("../utils/encryptedTransaction");

//@checked
router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const newAction = {};

    newAction.organisation = req.user.organisation;
    newAction.user = req.user._id;
    newAction.team = req.body.team;

    if (!req.body.team) return res.status(400).send({ ok: false, error: "Team is required" });
    if (req.user.role !== "admin" && !req.user.teams.map((t) => t._id).includes(req.body.team)) {
      throw new Error("No team while creating action");
    }

    if (req.body.hasOwnProperty("name")) newAction.name = req.body.name || null;
    if (req.body.hasOwnProperty("person")) newAction.person = req.body.person || null;
    if (req.body.hasOwnProperty("status")) newAction.status = req.body.status || null;
    if (req.body.hasOwnProperty("dueAt")) newAction.dueAt = req.body.dueAt || null;
    if (req.body.hasOwnProperty("withTime")) newAction.withTime = req.body.withTime || null;
    if (req.body.hasOwnProperty("completedAt")) newAction.completedAt = req.body.completedAt || null;
    if (req.body.hasOwnProperty("structure")) newAction.structure = req.body.structure || null;

    if (req.body.hasOwnProperty("encrypted")) newAction.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) newAction.encryptedEntityKey = req.body.encryptedEntityKey || null;

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      const data = await Action.create(newAction, { returning: true, transaction: tx });
      return data;
    });

    return res.status(status).send({ ok, data, error });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const TODO = "A FAIRE";
    const DONE = "FAIT";
    const CANCEL = "ANNULEE";

    const query = {
      where: {
        organisation: req.user.organisation,
      },
      order: [
        ["status", "ASC"],
        ["dueAt", "ASC"],
        ["createdAt", "ASC"],
      ],
    };
    const total = await Action.count(query);
    const limit = parseInt(req.query.limit, 10);
    if (!!req.query.limit) query.limit = limit;
    if (req.query.page) query.offset = parseInt(req.query.page, 10) * limit;

    // const data = await Comment.findAll(query);
    // return res.status(200).send({ ok: true, data, hasMore: data.length === limit });

    const actions = await Action.findAll(query);

    const todo = actions.filter((a) => a.status === TODO);

    const sortDoneOrCancel = (a, b) => {
      if (!a.dueAt) return -1;
      if (!b.dueAt) return 1;
      if (a.dueAt > b.dueAt) return -1;
      return 1;
    };

    const done = actions.filter((a) => a.status === DONE).sort(sortDoneOrCancel);

    const cancel = actions.filter((a) => a.status === CANCEL).sort(sortDoneOrCancel);

    const data = [...todo, ...done, ...cancel];
    return res.status(200).send({ ok: true, data, hasMore: data.length === limit, total });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const where = { _id: req.params._id };
    where.organisation = req.user.organisation;
    if (req.user.role !== "admin") where.team = req.user.teams.map((e) => e._id);

    let action = await Action.findOne({ where });
    if (!action) return res.status(404).send({ ok: false, error: "Not Found" });

    const updateAction = {};

    if (req.body.hasOwnProperty("status")) updateAction.status = req.body.status || null;
    if (req.body.hasOwnProperty("withTime")) updateAction.withTime = req.body.withTime || null;
    if (req.body.hasOwnProperty("dueAt")) updateAction.dueAt = req.body.dueAt || null;
    if (req.body.hasOwnProperty("completedAt")) updateAction.completedAt = req.body.completedAt || null;

    if (req.body.hasOwnProperty("category")) updateAction.category = req.body.category || null;
    if (req.body.hasOwnProperty("categories")) updateAction.categories = req.body.categories || null;
    if (req.body.hasOwnProperty("person")) updateAction.person = req.body.person || null;
    if (req.body.hasOwnProperty("structure")) updateAction.structure = req.body.structure || null;
    if (req.body.hasOwnProperty("name")) updateAction.name = req.body.name || null;
    if (req.body.hasOwnProperty("description")) updateAction.description = req.body.description || null;

    if (req.body.hasOwnProperty("encrypted")) updateAction.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) updateAction.encryptedEntityKey = req.body.encryptedEntityKey || null;

    await action.update(updateAction);

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      action.set(updateAction);
      await action.save({ transaction: tx });
      return action;
    });

    return res.status(status).send({ ok, data, error });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const query = {
      where: {
        _id: req.params._id,
        organisation: req.user.organisation,
      },
    };

    if (req.user.role !== "admin") query.where.team = req.user.teams.map((e) => e._id);
    let action = await Action.findOne(query);
    if (!action) return res.status(404).send({ ok: false, error: "Not Found" });

    await action.destroy();

    await action.destroy();

    res.status(200).send({ ok: true });
  })
);

module.exports = router;