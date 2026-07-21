import {
  Router,
} from "express";

import {
  longPolling,
  sse,
} from "../controllers/comunicacion.controller.js";

const router =
  Router();

router.get(
  "/long-polling",
  longPolling,
);

router.get(
  "/sse",
  sse,
);

export default router;