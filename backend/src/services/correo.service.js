import nodemailer
  from "nodemailer";

import dotenv
  from "dotenv";

import pool
  from "../../config/db.js";

dotenv.config();

function smtpConfigurado() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    !process.env.SMTP_USER.includes(
      "COLOQUE_AQUI",
    ) &&
    !process.env.SMTP_PASS.includes(
      "COLOQUE_AQUI",
    ),
  );
}

function escaparHtml(
  valor = "",
) {
  return String(valor)
    .replaceAll(
      "&",
      "&amp;",
    )
    .replaceAll(
      "<",
      "&lt;",
    )
    .replaceAll(
      ">",
      "&gt;",
    )
    .replaceAll(
      '"',
      "&quot;",
    )
    .replaceAll(
      "'",
      "&#039;",
    );
}

function boton(
  url,
  texto,
  color,
) {
  return `
    <a
      href="${url}"
      style="
        display:inline-block;
        margin:5px;
        padding:11px 15px;
        background:${color};
        color:#ffffff;
        text-decoration:none;
        border-radius:7px;
        font-weight:bold;
      "
    >
      ${texto}
    </a>
  `;
}

async function registrarNotificacion(
  solicitudId,
  destinatario,
  asunto,
  estadoEnvio,
  detalle = null,
) {
  try {
    await pool.execute(
      `INSERT INTO notificaciones
      (
        solicitudId,
        destinatario,
        asunto,
        estadoEnvio,
        detalle
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        solicitudId,
        destinatario,
        asunto,
        estadoEnvio,
        detalle,
      ],
    );
  } catch (error) {
    console.error(
      "No se pudo registrar la notificación:",
      error.message,
    );
  }
}

export async function enviarCorreoSolicitud(
  solicitud,
  titulo,
  mensaje,
) {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    "http://localhost:5173";

  const token =
    encodeURIComponent(
      solicitud.token,
    );

  const id =
    solicitud.id;

  const enlaces = {
    consultar:
      `${frontendUrl}/solicitud/${id}?token=${token}`,

    confirmar:
      `${frontendUrl}/confirmar/${id}?token=${token}`,

    cancelar:
      `${frontendUrl}/cancelar/${id}?token=${token}`,

    informacion:
      `${frontendUrl}/informacion/${id}?token=${token}`,

    solucion:
      `${frontendUrl}/solucion/${id}?token=${token}`,

    evaluacion:
      `${frontendUrl}/evaluacion/${id}?token=${token}`,
  };

  const asuntoCorreo =
    `${titulo} - Solicitud #${id}`;

  /*
   * Si todavía no se colocaron
   * las credenciales de Mailtrap,
   * imprime los enlaces en la terminal.
   */
  if (!smtpConfigurado()) {
    console.log(
      "\n================ CORREO OMITIDO ================",
    );

    console.log(
      "Configure SMTP_USER y SMTP_PASS en backend/.env",
    );

    console.log(
      "Destinatario:",
      solicitud.correo,
    );

    console.log(
      "Asunto:",
      asuntoCorreo,
    );

    console.log(
      "Enlaces de prueba:",
      enlaces,
    );

    console.log(
      "=================================================\n",
    );

    await registrarNotificacion(
      id,
      solicitud.correo,
      asuntoCorreo,
      "Omitido",
      "No se configuraron credenciales SMTP",
    );

    return {
      enviado: false,
      omitido: true,
      enlaces,
    };
  }

  const transporter =
    nodemailer.createTransport({
      host:
        process.env.SMTP_HOST,

      port:
        Number(
          process.env.SMTP_PORT ||
          2525,
        ),

      secure:
        String(
          process.env.SMTP_SECURE,
        ).toLowerCase() ===
        "true",

      auth: {
        user:
          process.env.SMTP_USER,

        pass:
          process.env.SMTP_PASS,
      },
    });

  const html = `
    <div
      style="
        font-family:Arial,sans-serif;
        background:#eef2f7;
        padding:28px;
      "
    >
      <div
        style="
          max-width:700px;
          margin:auto;
          background:white;
          border-radius:14px;
          overflow:hidden;
          border:1px solid #dbe3ed;
        "
      >
        <div
          style="
            background:linear-gradient(
              135deg,
              #111827,
              #1d4ed8
            );
            color:white;
            padding:24px;
          "
        >
          <h1
            style="
              margin:0;
              font-size:25px;
            "
          >
            SmartNotify Solutions
          </h1>

          <p
            style="
              margin:7px 0 0;
            "
          >
            Sistema de soporte técnico
          </p>
        </div>

        <div style="padding:25px;">
          <h2 style="margin-top:0;">
            ${escaparHtml(titulo)}
          </h2>

          <p>
            Hola
            <strong>
              ${escaparHtml(
                solicitud.nombreCliente,
              )}
            </strong>.
          </p>

          <p>${mensaje}</p>

          <table
            style="
              width:100%;
              border-collapse:collapse;
              margin:20px 0;
            "
          >
            <tr>
              <td
                style="
                  border:1px solid #ddd;
                  padding:9px;
                "
              >
                <strong>
                  Destinatario
                </strong>
              </td>

              <td
                style="
                  border:1px solid #ddd;
                  padding:9px;
                "
              >
                ${escaparHtml(
                  solicitud.correo,
                )}
              </td>
            </tr>

            <tr>
              <td
                style="
                  border:1px solid #ddd;
                  padding:9px;
                "
              >
                <strong>
                  Fecha
                </strong>
              </td>

              <td
                style="
                  border:1px solid #ddd;
                  padding:9px;
                "
              >
                ${new Date().toLocaleString(
                  "es-CR",
                )}
              </td>
            </tr>

            <tr>
              <td
                style="
                  border:1px solid #ddd;
                  padding:9px;
                "
              >
                <strong>
                  Identificador
                </strong>
              </td>

              <td
                style="
                  border:1px solid #ddd;
                  padding:9px;
                "
              >
                #${id}
              </td>
            </tr>

            <tr>
              <td
                style="
                  border:1px solid #ddd;
                  padding:9px;
                "
              >
                <strong>
                  Asunto
                </strong>
              </td>

              <td
                style="
                  border:1px solid #ddd;
                  padding:9px;
                "
              >
                ${escaparHtml(
                  solicitud.asunto,
                )}
              </td>
            </tr>

            <tr>
              <td
                style="
                  border:1px solid #ddd;
                  padding:9px;
                "
              >
                <strong>
                  Estado actual
                </strong>
              </td>

              <td
                style="
                  border:1px solid #ddd;
                  padding:9px;
                "
              >
                ${escaparHtml(
                  solicitud.estado,
                )}
              </td>
            </tr>
          </table>

          <div
            style="
              text-align:center;
            "
          >
            ${boton(
              enlaces.consultar,
              "Consultar estado",
              "#0d6efd",
            )}

            ${boton(
              enlaces.confirmar,
              "Confirmar recepción",
              "#198754",
            )}

            ${boton(
              enlaces.informacion,
              "Agregar información",
              "#6f42c1",
            )}

            ${boton(
              enlaces.solucion,
              "Confirmar solución",
              "#20c997",
            )}

            ${boton(
              enlaces.evaluacion,
              "Evaluar servicio",
              "#fd7e14",
            )}

            ${boton(
              enlaces.cancelar,
              "Cancelar solicitud",
              "#dc3545",
            )}
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const resultado =
      await transporter.sendMail({
        from:
          process.env.EMAIL_FROM ||
          "SmartNotify <soporte@smartnotify.local>",

        to:
          solicitud.correo,

        subject:
          asuntoCorreo,

        html,
      });

    await registrarNotificacion(
      id,
      solicitud.correo,
      asuntoCorreo,
      "Enviado",
      resultado.messageId,
    );

    return {
      enviado: true,

      messageId:
        resultado.messageId,
    };
  } catch (error) {
    await registrarNotificacion(
      id,
      solicitud.correo,
      asuntoCorreo,
      "Error",
      error.message,
    );

    throw error;
  }
}

export function enviarCorreoSinBloquear(
  solicitud,
  titulo,
  mensaje,
) {
  enviarCorreoSolicitud(
    solicitud,
    titulo,
    mensaje,
  ).catch((error) => {
    console.error(
      "Error enviando correo:",
      error.message,
    );
  });
}