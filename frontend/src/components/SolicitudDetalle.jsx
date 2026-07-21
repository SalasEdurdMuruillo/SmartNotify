import {
  useEffect,
  useState,
} from "react";

import {
  io,
} from "socket.io-client";

import {
  obtenerSolicitud,
  obtenerHistorial,
  obtenerNotificaciones,
  actualizarSolicitud,
  API_URL,
} from "../services/solicitudService.js";

import BarraProgreso
  from "./BarraProgreso.jsx";

import Chat
  from "./Chat.jsx";

function SolicitudDetalle({
  solicitudId,
  onCerrar,
}) {
  const [
    solicitud,
    setSolicitud,
  ] = useState(null);

  const [
    historial,
    setHistorial,
  ] = useState([]);

  const [
    notificaciones,
    setNotificaciones,
  ] = useState([]);

  const [
    informacion,
    setInformacion,
  ] = useState("");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const cargar =
    async () => {
      try {
        const [
          datos,
          movimientos,
          correos,
        ] = await Promise.all([
          obtenerSolicitud(
            solicitudId,
          ),

          obtenerHistorial(
            solicitudId,
          ),

          obtenerNotificaciones(
            solicitudId,
          ),
        ]);

        setSolicitud(
          datos,
        );

        setHistorial(
          movimientos,
        );

        setNotificaciones(
          correos,
        );

        setInformacion(
          datos.informacionAdicional ||
          "",
        );

        setError("");
      } catch (err) {
        setError(
          err.message,
        );
      }
    };

  useEffect(
    () => {
      cargar();

      const socket =
        io(API_URL);

      socket.on(
        "solicitudes:evento",
        (
          evento,
        ) => {
          if (
            Number(
              evento.payload?.id,
            ) ===
            Number(
              solicitudId,
            )
          ) {
            cargar();
          }
        },
      );

      return () =>
        socket.disconnect();
    },
    [
      solicitudId,
    ],
  );

  const guardarInformacion =
    async () => {
      try {
        const respuesta =
          await actualizarSolicitud(
            solicitudId,
            {
              informacionAdicional:
                informacion,
            },
          );

        setMensaje(
          respuesta.mensaje,
        );

        await cargar();
      } catch (err) {
        setError(
          err.message,
        );
      }
    };

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}

        <button
          className="btn btn-link"
          onClick={onCerrar}
        >
          Cerrar
        </button>
      </div>
    );
  }

  if (!solicitud) {
    return (
      <p>
        Cargando...
      </p>
    );
  }

  return (
    <section className="detalle-seccion">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>
          Solicitud #{solicitud.id}
        </h2>

        <button
          className="btn btn-outline-secondary"
          onClick={onCerrar}
        >
          Cerrar detalle
        </button>
      </div>

      {
        mensaje && (
          <div className="alert alert-success">
            {mensaje}
          </div>
        )
      }

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card panel h-100">
            <div className="card-body">
              <h3>
                {
                  solicitud.asunto
                }
              </h3>

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
                  Correo:
                </strong>{" "}

                {
                  solicitud.correo
                }
              </p>

              <BarraProgreso
                estado={
                  solicitud.estado
                }
              />

              <h4 className="mt-4">
                Descripción
              </h4>

              <pre className="texto-ajustado">
                {
                  solicitud.descripcion
                }
              </pre>

              <h4>
                Información adicional
              </h4>

              <textarea
                className="form-control mb-2"
                rows="5"
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
              />

              <button
                className="btn btn-primary"
                onClick={
                  guardarInformacion
                }
              >
                Actualizar información
              </button>

              <hr />

              <p>
                <strong>
                  Recepción confirmada:
                </strong>{" "}

                {
                  solicitud.recepcionConfirmada
                    ? "Sí"
                    : "No"
                }
              </p>

              <p>
                <strong>
                  Solución confirmada:
                </strong>{" "}

                {
                  solicitud.solucionConfirmada
                    ? "Sí"
                    : "No"
                }
              </p>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card panel mb-4">
            <div className="card-body">
              <h3>
                Historial
              </h3>

              <div className="lista-scroll">
                {
                  historial.map(
                    (
                      item,
                    ) => (
                      <div
                        className="item-lista"
                        key={
                          item.id
                        }
                      >
                        <strong>
                          {
                            item.tipo
                          }
                        </strong>

                        <div>
                          {
                            item.detalle
                          }
                        </div>

                        <small>
                          {
                            new Date(
                              item.fecha,
                            ).toLocaleString(
                              "es-CR",
                            )
                          }
                        </small>
                      </div>
                    ),
                  )
                }
              </div>
            </div>
          </div>

          <div className="card panel">
            <div className="card-body">
              <h3>
                Correos enviados
              </h3>

              <div className="lista-scroll lista-corta">
                {
                  notificaciones.map(
                    (
                      item,
                    ) => (
                      <div
                        className="item-lista"
                        key={
                          item.id
                        }
                      >
                        <strong>
                          {
                            item.estadoEnvio
                          }:{" "}

                          {
                            item.asunto
                          }
                        </strong>

                        <div>
                          {
                            item.destinatario
                          }
                        </div>

                        <small>
                          {
                            new Date(
                              item.fecha,
                            ).toLocaleString(
                              "es-CR",
                            )
                          }
                        </small>
                      </div>
                    ),
                  )
                }

                {
                  notificaciones.length ===
                    0 && (
                    <span className="text-secondary">
                      Sin notificaciones.
                    </span>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <Chat
        solicitudId={
          Number(
            solicitudId,
          )
        }
      />
    </section>
  );
}

export default SolicitudDetalle;