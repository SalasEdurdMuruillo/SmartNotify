import {
  useEffect,
  useState,
} from "react";

import {
  accionCorreo,
  obtenerSolicitudPublica,
} from "../services/solicitudService.js";

import BarraProgreso
  from "./BarraProgreso.jsx";

function AccionCorreo({
  tipo,
  id,
  token,
}) {
  const [
    solicitud,
    setSolicitud,
  ] = useState(null);

  const [
    informacion,
    setInformacion,
  ] = useState("");

  const [
    calificacion,
    setCalificacion,
  ] = useState("5");

  const [
    comentario,
    setComentario,
  ] = useState("");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    procesando,
    setProcesando,
  ] = useState(false);

  useEffect(
    () => {
      obtenerSolicitudPublica(
        id,
        token,
      )
        .then(
          setSolicitud,
        )
        .catch(
          (
            err,
          ) =>
            setError(
              err.message,
            ),
        );
    },
    [
      id,
      token,
    ],
  );

  const ejecutar =
    async (
      accion,
      datos = {},
    ) => {
      try {
        setProcesando(true);

        setError("");

        const respuesta =
          await accionCorreo(
            id,
            accion,
            {
              token,
              ...datos,
            },
          );

        setMensaje(
          respuesta.mensaje,
        );

        if (
          respuesta.solicitud
        ) {
          setSolicitud(
            respuesta.solicitud,
          );
        }
      } catch (err) {
        setError(
          err.message,
        );
      } finally {
        setProcesando(false);
      }
    };

  const contenido =
    () => {
      if (
        tipo ===
        "solicitud"
      ) {
        return (
          solicitud && (
            <>
              <h1>
                Consulta de solicitud #{solicitud.id}
              </h1>

              <p>
                <strong>
                  Cliente:
                </strong>{" "}

                {
                  solicitud.nombreCliente
                }
              </p>

              <p>
                <strong>
                  Asunto:
                </strong>{" "}

                {
                  solicitud.asunto
                }
              </p>

              <p>
                <strong>
                  Descripción:
                </strong>{" "}

                {
                  solicitud.descripcion
                }
              </p>

              <BarraProgreso
                estado={
                  solicitud.estado
                }
              />

              <p className="mt-3">
                <strong>
                  Información adicional:
                </strong>
              </p>

              <pre className="texto-ajustado">
                {
                  solicitud.informacionAdicional ||
                  "Sin información adicional"
                }
              </pre>
            </>
          )
        );
      }

      if (
        tipo ===
        "informacion"
      ) {
        return (
          <>
            <h1>
              Agregar información
            </h1>

            <p>
              Solicitud #{id}
            </p>

            <textarea
              className="form-control mb-3"
              rows="7"
              value={informacion}
              onChange={
                (
                  event,
                ) =>
                  setInformacion(
                    event
                      .target
                      .value,
                  )
              }
              required
            />

            <button
              className="btn btn-primary"
              disabled={
                procesando ||
                !informacion.trim()
              }
              onClick={
                () =>
                  ejecutar(
                    "informacion",
                    {
                      informacion,
                    },
                  )
              }
            >
              Enviar información
            </button>
          </>
        );
      }

      if (
        tipo ===
        "evaluacion"
      ) {
        return (
          <>
            <h1>
              Evaluar el servicio
            </h1>

            <p>
              Solicitud #{id}
            </p>

            <label className="form-label">
              Calificación
            </label>

            <select
              className="form-select mb-3"
              value={
                calificacion
              }
              onChange={
                (
                  event,
                ) =>
                  setCalificacion(
                    event
                      .target
                      .value,
                  )
              }
            >
              {
                [
                  1,
                  2,
                  3,
                  4,
                  5,
                ].map(
                  (
                    nota,
                  ) => (
                    <option
                      key={
                        nota
                      }
                      value={
                        nota
                      }
                    >
                      {nota} de 5
                    </option>
                  ),
                )
              }
            </select>

            <label className="form-label">
              Comentario
            </label>

            <textarea
              className="form-control mb-3"
              rows="5"
              value={
                comentario
              }
              onChange={
                (
                  event,
                ) =>
                  setComentario(
                    event
                      .target
                      .value,
                  )
              }
            />

            <button
              className="btn btn-primary"
              disabled={
                procesando
              }
              onClick={
                () =>
                  ejecutar(
                    "evaluacion",
                    {
                      calificacion:
                        Number(
                          calificacion,
                        ),

                      comentario,
                    },
                  )
              }
            >
              Enviar evaluación
            </button>
          </>
        );
      }

      const acciones = {
        confirmar: {
          titulo:
            "Confirmar recepción",

          texto:
            "Confirme que recibió la notificación de la solicitud.",

          ruta:
            "confirmar-recepcion",

          boton:
            "Confirmar recepción",

          clase:
            "btn-success",
        },

        cancelar: {
          titulo:
            "Cancelar solicitud",

          texto:
            "Esta acción cambiará la solicitud al estado Cancelada.",

          ruta:
            "cancelar",

          boton:
            "Cancelar solicitud",

          clase:
            "btn-danger",
        },

        solucion: {
          titulo:
            "Confirmar solución",

          texto:
            "Confirme que su problema fue resuelto correctamente.",

          ruta:
            "confirmar-solucion",

          boton:
            "Confirmar solución",

          clase:
            "btn-success",
        },
      };

      const datos =
        acciones[tipo];

      if (!datos) {
        return (
          <h1>
            Acción no válida
          </h1>
        );
      }

      return (
        <>
          <h1>
            {datos.titulo}
          </h1>

          <p>
            Solicitud #{id}
          </p>

          <p>
            {datos.texto}
          </p>

          <button
            className={
              `btn ${datos.clase}`
            }
            disabled={
              procesando
            }
            onClick={
              () =>
                ejecutar(
                  datos.ruta,
                )
            }
          >
            {
              procesando
                ? "Procesando..."
                : datos.boton
            }
          </button>
        </>
      );
    };

  return (
    <main className="pagina-correo">
      <div className="card panel accion-card">
        <div className="card-body p-4">
          <div className="marca-correo">
            SmartNotify Solutions
          </div>

          {
            mensaje && (
              <div className="alert alert-success">
                {mensaje}
              </div>
            )
          }

          {
            error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )
          }

          {
            !solicitud &&
            !error && (
              <p>
                Cargando solicitud...
              </p>
            )
          }

          {
            solicitud &&
            contenido()
          }

          <a
            href="/"
            className="btn btn-outline-secondary mt-3"
          >
            Volver al sistema
          </a>
        </div>
      </div>
    </main>
  );
}

export default AccionCorreo;