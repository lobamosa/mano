const MIN_VER = [2, 3, 11];

module.exports = ({ headers: { version, platform } }, res, next) => {
  if (platform === "dashboard") return next();
  if (platform === "website") return next();
  if (!version) return res.status(403).send({ ok: false, message: "Veuillez mettre à jour votre application!" });

  const appVer = version.split(".").map((d) => parseInt(d));

  for (let i = 0; i < 3; i++) {
    if (appVer[i] > MIN_VER[i]) {
      return next();
    } else if (appVer[i] < MIN_VER[i]) {
      return res.status(403).send({ ok: false, message: "Veuillez mettre à jour votre application!" });
    }
  }

  next();
};