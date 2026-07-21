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

  return rows[0] || null;
}

export function formularioTradicional(
  req,
  res,
) {
  res.send(`
    <!doctype html>

    <html lang="es">
      <head>
        <meta charset="UTF-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >

        <title>
          Comunicación síncrona
        </title>

        <style>
          body {
            font-family: Arial;
            background: #eef2f7;
            margin: 0;
            padding: 30px;
            color: #1f2937;
          }

          .contenedor {
            max-width: 760px;
            margin: auto;
          }

          .card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 10px 28px #0002;
            margin-bottom: 22px;
          }

          input,
          textarea,
          button {
            width: 100%;
            padding: 11px;
            margin: 7px 0 15px;
            box-sizing: border-box;
            border-radius: 7px;
            border: 1px solid #cbd5e1;
          }

          button {
            background: #0d6efd;
            color: white;
            border: 0;
            font-weight: bold;
            cursor: pointer;
          }

          .secundario {
            background: #334155;
          }
        </style>
      </head>

      <body>
        <div class="contenedor">
          <div class="card">
            <h1>
              Etapa 1: Comunicación síncrona
            </h1>

            <p>
              Este formulario usa POST
              tradicional y recarga toda
              la página.
            </p>

            <form
              method="POST"
              action="/tradicional/solicitudes"
            >
              <label>
                Nombre del cliente
              </label>

              <input
                name="nombreCliente"
                required
              >

              <label>
                Correo
              </label>

              <input
                name="correo"
                type="email"
                required
              >

              <label>
                Asunto
              </label>

              <input
                name="asunto"
                required
              >

              <label>
                Descripción
              </label>

              <textarea
                name="descripcion"
                rows="5"
                required
              ></textarea>

              <button type="submit">
                Registrar solicitud
              </button>
            </form>
          </div>

          <div class="card">
            <h2>
              Consultar estado
            </h2>

            <form
              method="GET"
              action="/tradicional/consultar"
            >
              <label>
                ID de la solicitud
              </label>

              <input
                name="id"
                type="number"
                min="1"
                required
              >

              <button
                class="secundario"
                type="submit"
              >
                Consultar
              </button>
            </form>
          </div>
        </div>
      </body>
    </html>
  `);
}

export async function registrarTradicional(
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
        .send(
          "Todos los campos son obligatorios",
        );
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

    await pool.execute(
      `INSERT INTO historial
      (
        solicitudId,
        tipo,
        detalle,
        estadoNuevo
      )
      VALUES (
        ?,
        'CREACION_TRADICIONAL',
        'Solicitud creada mediante POST tradicional',
        'Pendiente'
      )`,
      [
        result.insertId,
      ],
    );

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
      "Su solicitud fue registrada correctamente mediante comunicación síncrona.",
    );

    return res.redirect(
      `/tradicional/solicitudes/${solicitud.id}`,
    );
  } catch (error) {
    return res
      .status(500)
      .send(
        `Error: ${error.message}`,
      );
  }
}

export async function consultarTradicional(
  req,
  res,
) {
  return res.redirect(
    `/tradicional/solicitudes/${req.query.id}`,
  );
}

export async function verSolicitudTradicional(
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
        .send(
          "Solicitud no encontrada",
        );
    }

    return res.send(`
      <!doctype html>

      <html lang="es">
        <head>
          <meta charset="UTF-8">

          <title>
            Solicitud #${solicitud.id}
          </title>
        </head>

        <body
          style="
            font-family:Arial;
            max-width:700px;
            margin:40px auto;
            color:#1f2937;
          "
        >
          <h1>
            Solicitud #${solicitud.id}
          </h1>

          <p>
            <strong>Cliente:</strong>
            ${solicitud.nombreCliente}
          </p>

          <p>
            <strong>Correo:</strong>
            ${solicitud.correo}
          </p>

          <p>
            <strong>Asunto:</strong>
            ${solicitud.asunto}
          </p>

          <p>
            <strong>Descripción:</strong>
            ${solicitud.descripcion}
          </p>

          <p>
            <strong>Estado:</strong>
            ${solicitud.estado}
          </p>

          <p>
            <strong>Creación:</strong>
            ${solicitud.fechaCreacion}
          </p>

          <a href="/tradicional">
            Volver
          </a>
        </body>
      </html>
    `);
  } catch (error) {
    return res
      .status(500)
      .send(
        `Error: ${error.message}`,
      );
  }
}