import {
  Router,
} from "express";

import {
  formularioTradicional,
  registrarTradicional,
  consultarTradicional,
  verSolicitudTradicional,
} from "../controllers/tradicional.controller.js";

const router =
  Router();

router.get(
  "/",
  formularioTradicional,
);

router.post(
  "/solicitudes",
  registrarTradicional,
);

router.get(
  "/consultar",
  consultarTradicional,
);

router.get(
  "/solicitudes/:id",
  verSolicitudTradicional,
);

export default router;