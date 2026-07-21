import {
  Router,
} from "express";

import {
  crearSolicitud,
  listarSolicitudes,
  obtenerSolicitud,
  obtenerSolicitudPublica,
  actualizarInformacionTecnico,
  cambiarEstado,
  confirmarRecepcion,
  cancelarSolicitud,
  confirmarSolucion,
  agregarInformacion,
  guardarEvaluacion,
  obtenerHistorial,
  obtenerMensajes,
  obtenerNotificaciones,
} from "../controllers/solicitud.controller.js";

const router =
  Router();

router.get(
  "/",
  listarSolicitudes,
);

router.post(
  "/",
  crearSolicitud,
);

router.get(
  "/:id/publica",
  obtenerSolicitudPublica,
);

router.get(
  "/:id/historial",
  obtenerHistorial,
);

router.get(
  "/:id/mensajes",
  obtenerMensajes,
);

router.get(
  "/:id/notificaciones",
  obtenerNotificaciones,
);

router.patch(
  "/:id/estado",
  cambiarEstado,
);

router.post(
  "/:id/confirmar-recepcion",
  confirmarRecepcion,
);

router.post(
  "/:id/cancelar",
  cancelarSolicitud,
);

router.post(
  "/:id/confirmar-solucion",
  confirmarSolucion,
);

router.post(
  "/:id/informacion",
  agregarInformacion,
);

router.post(
  "/:id/evaluacion",
  guardarEvaluacion,
);

router.put(
  "/:id",
  actualizarInformacionTecnico,
);

router.get(
  "/:id",
  obtenerSolicitud,
);

export default router;