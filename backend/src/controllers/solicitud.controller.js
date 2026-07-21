import crypto
  from "crypto";

import pool
  from "../../config/db.js";

import {
  notificarCambio,
} from "../services/realtime.service.js";

import {
  enviarCorreoSinBloquear,
} from "../services/correo.service.js";

const ESTADOS = [
  "Pendiente",
  "Asignada",
  "En proceso",
  "Finalizada",
  "Cancelada",
];

function serializar(
  solicitud,
) {
  if (!solicitud) {
    return null;
  }

  return {
    ...solicitud,

    recepcionConfirmada:
      Boolean(
        solicitud.recepcionConfirmada,
      ),

    solucionConfirmada:
      Boolean(
        solicitud.solucionConfirmada,
      ),
  };
}

async function buscarSolicitud(
  id,
) {
  const [rows] =
    await pool.execute(
      `SELECT *
       FROM solicitudes
       WHERE id = ?`,
      [
        id,
      ],
    );

  return serializar(
    rows[0],
  );
}

async function historial({
  solicitudId,
  tipo,
  detalle,
  estadoAnterior = null,
  estadoNuevo = null,
}) {
  await pool.execute(
    `INSERT INTO historial
    (
      solicitudId,
      tipo,
      detalle,
      estadoAnterior,
      estadoNuevo
    )
    VALUES (?, ?, ?, ?, ?)`,
    [
      solicitudId,
      tipo,
      detalle,
      estadoAnterior,
      estadoNuevo,
    ],
  );
}

function tokenValido(
  solicitud,
  token,
) {
  return Boolean(
    solicitud &&
    token &&
    solicitud.token === token,
  );
}

export async function crearSolicitud(
  req,
  res,
) {
  try {
    const {
      nombreCliente,
      correo,
      asunto,
      descripcion,
    } = req.body;

    if (
      !nombreCliente?.trim() ||
      !correo?.trim() ||
      !asunto?.trim() ||
      !descripcion?.trim()
    ) {
      return res
        .status(400)
        .json({
          error:
            "Todos los campos son obligatorios",
        });
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(
        correo.trim(),
      )
    ) {
      return res
        .status(400)
        .json({
          error:
            "El correo no tiene un formato válido",
        });
    }

    const token =
      crypto
        .randomBytes(24)
        .toString("hex");

    const [result] =
      await pool.execute(
        `INSERT INTO solicitudes
        (
          token,
          nombreCliente,
          correo,
          asunto,
          descripcion
        )
        VALUES (?, ?, ?, ?, ?)`,
        [
          token,
          nombreCliente.trim(),
          correo.trim(),
          asunto.trim(),
          descripcion.trim(),
        ],
      );

    await historial({
      solicitudId:
        result.insertId,

      tipo:
        "CREACION",

      detalle:
        "Solicitud creada mediante Fetch API",

      estadoNuevo:
        "Pendiente",
    });

    const solicitud =
      await buscarSolicitud(
        result.insertId,
      );

    notificarCambio(
      "SOLICITUD_CREADA",
      solicitud,
    );

    enviarCorreoSinBloquear(
      solicitud,
      "Solicitud creada",
      "Su solicitud fue registrada correctamente.",
    );

    return res
      .status(201)
      .json({
        mensaje:
          "Solicitud registrada correctamente",

        solicitud,
      });
  } catch (error) {
    console.error(error);

    return res
      .status(500)
      .json({
        error:
          "No se pudo registrar la solicitud",

        detalle:
          error.message,
      });
  }
}

export async function listarSolicitudes(
  req,
  res,
) {
  try {
    const [rows] =
      await pool.execute(
        `SELECT *
         FROM solicitudes
         ORDER BY
           fechaActualizacion DESC,
           id DESC`,
      );

    return res.json(
      rows.map(
        serializar,
      ),
    );
  } catch (error) {
    return res
      .status(500)
      .json({
        error:
          "No se pudieron consultar las solicitudes",

        detalle:
          error.message,
      });
  }
}

export async function obtenerSolicitud(
  req,
  res,
) {
  try {
    const solicitud =
      await buscarSolicitud(
        req.params.id,
      );

    if (!solicitud) {
      return res
        .status(404)
        .json({
          error:
            "Solicitud no encontrada",
        });
    }

    return res.json(
      solicitud,
    );
  } catch (error) {
    return res
      .status(500)
      .json({
        error:
          error.message,
      });
  }
}

export async function obtenerSolicitudPublica(
  req,
  res,
) {
  try {
    const solicitud =
      await buscarSolicitud(
        req.params.id,
      );

    if (
      !tokenValido(
        solicitud,
        req.query.token,
      )
    ) {
      return res
        .status(403)
        .json({
          error:
            "Enlace inválido",
        });
    }

    const {
      token,
      ...datosPublicos
    } = solicitud;

    return res.json(
      datosPublicos,
    );
  } catch (error) {
    return res
      .status(500)
      .json({
        error:
          error.message,
      });
  }
}

export async function actualizarInformacionTecnico(
  req,
  res,
) {
  try {
    const actual =
      await buscarSolicitud(
        req.params.id,
      );

    if (!actual) {
      return res
        .status(404)
        .json({
          error:
            "Solicitud no encontrada",
        });
    }

    const asunto =
      req.body.asunto ??
      actual.asunto;

    const descripcion =
      req.body.descripcion ??
      actual.descripcion;

    const informacionAdicional =
      req.body.informacionAdicional ??
      actual.informacionAdicional;

    await pool.execute(
      `UPDATE solicitudes
       SET
         asunto = ?,
         descripcion = ?,
         informacionAdicional = ?
       WHERE id = ?`,
      [
        String(asunto).trim(),

        String(
          descripcion,
        ).trim(),

        informacionAdicional,

        req.params.id,
      ],
    );

    await historial({
      solicitudId:
        req.params.id,

      tipo:
        "ACTUALIZACION",

      detalle:
        "Se actualizó la información de la solicitud",
    });

    const solicitud =
      await buscarSolicitud(
        req.params.id,
      );

    notificarCambio(
      "SOLICITUD_ACTUALIZADA",
      solicitud,
    );

    return res.json({
      mensaje:
        "Información actualizada",

      solicitud,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        error:
          error.message,
      });
  }
}

export async function cambiarEstado(
  req,
  res,
) {
  try {
    const {
      estado,
    } = req.body;

    if (
      !ESTADOS.includes(
        estado,
      )
    ) {
      return res
        .status(400)
        .json({
          error:
            "Estado no permitido",
        });
    }

    const anterior =
      await buscarSolicitud(
        req.params.id,
      );

    if (!anterior) {
      return res
        .status(404)
        .json({
          error:
            "Solicitud no encontrada",
        });
    }

    await pool.execute(
      `UPDATE solicitudes
       SET estado = ?
       WHERE id = ?`,
      [
        estado,
        req.params.id,
      ],
    );

    await historial({
      solicitudId:
        req.params.id,

      tipo:
        "CAMBIO_ESTADO",

      detalle:
        `Estado cambiado de ${anterior.estado} a ${estado}`,

      estadoAnterior:
        anterior.estado,

      estadoNuevo:
        estado,
    });

    const solicitud =
      await buscarSolicitud(
        req.params.id,
      );

    notificarCambio(
      "ESTADO_ACTUALIZADO",
      solicitud,
    );

    const titulos = {
      Pendiente:
        "Solicitud pendiente",

      Asignada:
        "Solicitud asignada",

      "En proceso":
        "Solicitud en proceso",

      Finalizada:
        "Solicitud finalizada",

      Cancelada:
        "Solicitud cancelada",
    };

    enviarCorreoSinBloquear(
      solicitud,
      titulos[estado],

      `El estado actual de su solicitud es
      <strong>${estado}</strong>.`,
    );

    return res.json({
      mensaje:
        "Estado actualizado correctamente",

      solicitud,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        error:
          error.message,
      });
  }
}

export async function confirmarRecepcion(
  req,
  res,
) {
  try {
    const solicitud =
      await buscarSolicitud(
        req.params.id,
      );

    if (
      !tokenValido(
        solicitud,
        req.body.token,
      )
    ) {
      return res
        .status(403)
        .json({
          error:
            "Enlace inválido",
        });
    }

    await pool.execute(
      `UPDATE solicitudes
       SET recepcionConfirmada = TRUE
       WHERE id = ?`,
      [
        req.params.id,
      ],
    );

    await historial({
      solicitudId:
        req.params.id,

      tipo:
        "RECEPCION_CONFIRMADA",

      detalle:
        "El cliente confirmó la recepción desde el correo",
    });

    const actualizada =
      await buscarSolicitud(
        req.params.id,
      );

    notificarCambio(
      "RECEPCION_CONFIRMADA",
      actualizada,
    );

    return res.json({
      mensaje:
        "Recepción confirmada correctamente",

      solicitud:
        actualizada,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        error:
          error.message,
      });
  }
}

export async function cancelarSolicitud(
  req,
  res,
) {
  try {
    const solicitud =
      await buscarSolicitud(
        req.params.id,
      );

    if (
      !tokenValido(
        solicitud,
        req.body.token,
      )
    ) {
      return res
        .status(403)
        .json({
          error:
            "Enlace inválido",
        });
    }

    if (
      solicitud.estado ===
      "Finalizada"
    ) {
      return res
        .status(409)
        .json({
          error:
            "Una solicitud finalizada no puede cancelarse",
        });
    }

    await pool.execute(
      `UPDATE solicitudes
       SET estado = 'Cancelada'
       WHERE id = ?`,
      [
        req.params.id,
      ],
    );

    await historial({
      solicitudId:
        req.params.id,

      tipo:
        "CANCELACION",

      detalle:
        "El cliente canceló la solicitud desde el correo",

      estadoAnterior:
        solicitud.estado,

      estadoNuevo:
        "Cancelada",
    });

    const actualizada =
      await buscarSolicitud(
        req.params.id,
      );

    notificarCambio(
      "SOLICITUD_CANCELADA",
      actualizada,
    );

    enviarCorreoSinBloquear(
      actualizada,
      "Solicitud cancelada",
      "Su solicitud fue cancelada.",
    );

    return res.json({
      mensaje:
        "Solicitud cancelada correctamente",

      solicitud:
        actualizada,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        error:
          error.message,
      });
  }
}

export async function confirmarSolucion(
  req,
  res,
) {
  try {
    const solicitud =
      await buscarSolicitud(
        req.params.id,
      );

    if (
      !tokenValido(
        solicitud,
        req.body.token,
      )
    ) {
      return res
        .status(403)
        .json({
          error:
            "Enlace inválido",
        });
    }

    await pool.execute(
      `UPDATE solicitudes
       SET
         solucionConfirmada = TRUE,
         estado = 'Finalizada'
       WHERE id = ?`,
      [
        req.params.id,
      ],
    );

    await historial({
      solicitudId:
        req.params.id,

      tipo:
        "SOLUCION_CONFIRMADA",

      detalle:
        "El cliente confirmó que el problema fue resuelto",

      estadoAnterior:
        solicitud.estado,

      estadoNuevo:
        "Finalizada",
    });

    const actualizada =
      await buscarSolicitud(
        req.params.id,
      );

    notificarCambio(
      "SOLUCION_CONFIRMADA",
      actualizada,
    );

    enviarCorreoSinBloquear(
      actualizada,
      "Solución confirmada",
      "Gracias por confirmar que el problema fue resuelto.",
    );

    return res.json({
      mensaje:
        "Solución confirmada correctamente",

      solicitud:
        actualizada,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        error:
          error.message,
      });
  }
}

export async function agregarInformacion(
  req,
  res,
) {
  try {
    const {
      token,
      informacion,
    } = req.body;

    const solicitud =
      await buscarSolicitud(
        req.params.id,
      );

    if (
      !tokenValido(
        solicitud,
        token,
      )
    ) {
      return res
        .status(403)
        .json({
          error:
            "Enlace inválido",
        });
    }

    if (
      !informacion?.trim()
    ) {
      return res
        .status(400)
        .json({
          error:
            "Debe escribir información adicional",
        });
    }

    const texto =
      solicitud.informacionAdicional
        ? `${solicitud.informacionAdicional}\n\n${informacion.trim()}`
        : informacion.trim();

    await pool.execute(
      `UPDATE solicitudes
       SET informacionAdicional = ?
       WHERE id = ?`,
      [
        texto,
        req.params.id,
      ],
    );

    await historial({
      solicitudId:
        req.params.id,

      tipo:
        "INFORMACION_ADICIONAL",

      detalle:
        "El cliente agregó información desde un formulario del correo",
    });

    const actualizada =
      await buscarSolicitud(
        req.params.id,
      );

    notificarCambio(
      "INFORMACION_AGREGADA",
      actualizada,
    );

    return res.json({
      mensaje:
        "Información agregada correctamente",

      solicitud:
        actualizada,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        error:
          error.message,
      });
  }
}

export async function guardarEvaluacion(
  req,
  res,
) {
  try {
    const {
      token,
      calificacion,
      comentario = "",
    } = req.body;

    const solicitud =
      await buscarSolicitud(
        req.params.id,
      );

    if (
      !tokenValido(
        solicitud,
        token,
      )
    ) {
      return res
        .status(403)
        .json({
          error:
            "Enlace inválido",
        });
    }

    const nota =
      Number(calificacion);

    if (
      !Number.isInteger(nota) ||
      nota < 1 ||
      nota > 5
    ) {
      return res
        .status(400)
        .json({
          error:
            "La calificación debe estar entre 1 y 5",
        });
    }

    await pool.execute(
      `INSERT INTO evaluaciones
      (
        solicitudId,
        calificacion,
        comentario
      )
      VALUES (?, ?, ?)

      ON DUPLICATE KEY UPDATE
        calificacion =
          VALUES(calificacion),

        comentario =
          VALUES(comentario),

        fecha =
          CURRENT_TIMESTAMP`,
      [
        req.params.id,
        nota,
        comentario.trim(),
      ],
    );

    await historial({
      solicitudId:
        req.params.id,

      tipo:
        "EVALUACION",

      detalle:
        `El cliente calificó el servicio con ${nota}/5`,
    });

    notificarCambio(
      "EVALUACION_REGISTRADA",
      {
        solicitudId:
          Number(
            req.params.id,
          ),

        calificacion:
          nota,
      },
    );

    return res
      .status(201)
      .json({
        mensaje:
          "Evaluación registrada correctamente",
      });
  } catch (error) {
    return res
      .status(500)
      .json({
        error:
          error.message,
      });
  }
}

export async function obtenerHistorial(
  req,
  res,
) {
  try {
    const [rows] =
      await pool.execute(
        `SELECT *
         FROM historial
         WHERE solicitudId = ?
         ORDER BY
           fecha DESC,
           id DESC`,
        [
          req.params.id,
        ],
      );

    return res.json(rows);
  } catch (error) {
    return res
      .status(500)
      .json({
        error:
          error.message,
      });
  }
}

export async function obtenerMensajes(
  req,
  res,
) {
  try {
    const [rows] =
      await pool.execute(
        `SELECT *
         FROM mensajes
         WHERE solicitudId = ?
         ORDER BY
           fecha ASC,
           id ASC`,
        [
          req.params.id,
        ],
      );

    return res.json(rows);
  } catch (error) {
    return res
      .status(500)
      .json({
        error:
          error.message,
      });
  }
}

export async function obtenerNotificaciones(
  req,
  res,
) {
  try {
    const [rows] =
      await pool.execute(
        `SELECT *
         FROM notificaciones
         WHERE solicitudId = ?
         ORDER BY
           fecha DESC,
           id DESC`,
        [
          req.params.id,
        ],
      );

    return res.json(rows);
  } catch (error) {
    return res
      .status(500)
      .json({
        error:
          error.message,
      });
  }
}