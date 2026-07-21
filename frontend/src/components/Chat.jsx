import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  io,
} from "socket.io-client";

import {
  API_URL,
  obtenerMensajes,
} from "../services/solicitudService.js";

function Chat({
  solicitudId,
}) {
  const [
    mensajes,
    setMensajes,
  ] = useState([]);

  const [
    autor,
    setAutor,
  ] = useState("Cliente");

  const [
    rol,
    setRol,
  ] = useState("Cliente");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    escribiendo,
    setEscribiendo,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const socketRef =
    useRef(null);

  const timerRef =
    useRef(null);

  const chatFinalRef =
    useRef(null);

  function bajarChat() {
    setTimeout(() => {
      chatFinalRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  }

  useEffect(() => {
    async function cargarMensajes() {
      try {
        const datos =
          await obtenerMensajes(
            solicitudId,
          );

        setMensajes(datos);
        bajarChat();
      } catch (errorEncontrado) {
        setError(
          errorEncontrado.message,
        );
      }
    }

    cargarMensajes();

    const socket =
      io(API_URL);

    socketRef.current =
      socket;

    socket.emit(
      "solicitud:unirse",
      solicitudId,
    );

    socket.on(
      "connect",
      () => {
        setError("");
      },
    );

    socket.on(
      "connect_error",
      () => {
        setError(
          "No fue posible conectar el chat con el servidor.",
        );
      },
    );

    socket.on(
      "chat:nuevo-mensaje",
      (nuevoMensaje) => {
        setMensajes(
          (mensajesActuales) => [
            ...mensajesActuales,
            nuevoMensaje,
          ],
        );

        bajarChat();
      },
    );

    socket.on(
      "chat:escribiendo",
      ({
        autor: nombre,
        rol: rolUsuario,
      }) => {
        const nombreRol =
          rolUsuario === "Tecnico"
            ? "El técnico"
            : nombre || "El cliente";

        setEscribiendo(
          `${nombreRol} está escribiendo...`,
        );
      },
    );

    socket.on(
      "chat:dejo-escribir",
      () => {
        setEscribiendo("");
      },
    );

    return () => {
      clearTimeout(
        timerRef.current,
      );

      socket.disconnect();
    };
  }, [
    solicitudId,
  ]);

  function cambiarMensaje(valor) {
    setMensaje(valor);

    socketRef.current?.emit(
      "chat:escribiendo",
      {
        solicitudId,
        autor,
        rol,
      },
    );

    clearTimeout(
      timerRef.current,
    );

    timerRef.current =
      setTimeout(() => {
        socketRef.current?.emit(
          "chat:dejo-escribir",
          {
            solicitudId,
          },
        );
      }, 900);
  }

  function cambiarRol(
    nuevoRol,
  ) {
    setRol(nuevoRol);

    if (
      nuevoRol === "Tecnico"
    ) {
      setAutor("Técnico");
    } else {
      setAutor("Cliente");
    }
  }

  function enviarMensaje(
    event,
  ) {
    event.preventDefault();

    if (
      !mensaje.trim()
    ) {
      return;
    }

    if (
      !autor.trim()
    ) {
      setError(
        "Debe indicar el nombre del autor.",
      );

      return;
    }

    socketRef.current?.emit(
      "chat:mensaje",
      {
        solicitudId,
        autor:
          autor.trim(),

        rol,

        mensaje:
          mensaje.trim(),
      },

      (respuesta) => {
        if (
          respuesta?.ok
        ) {
          setMensaje("");
          setError("");

          socketRef.current?.emit(
            "chat:dejo-escribir",
            {
              solicitudId,
            },
          );

          bajarChat();
        } else {
          setError(
            respuesta?.error ||
            "No se pudo enviar el mensaje.",
          );
        }
      },
    );
  }

  return (
    <div className="card panel mt-4">
      <div className="card-body">
        <h2>
          Chat bidireccional por WebSockets
        </h2>

        <p className="text-secondary">
          Los mensajes del cliente aparecen
          a la izquierda y los mensajes del
          técnico a la derecha.
        </p>

        {
          error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )
        }

        <div className="chat-box mb-2">
          {
            mensajes.length ===
            0 && (
              <div className="chat-vacio">
                Todavía no hay mensajes.
              </div>
            )
          }

          {
            mensajes.map(
              (item) => {
                const esTecnico =
                  item.rol ===
                  "Tecnico";

                return (
                  <div
                    className={
                      `fila-mensaje ${esTecnico
                        ? "fila-tecnico"
                        : "fila-cliente"
                      }`
                    }
                    key={item.id}
                  >
                    <div
                      className={
                        `burbuja-mensaje ${esTecnico
                          ? "burbuja-tecnico"
                          : "burbuja-cliente"
                        }`
                      }
                    >
                      <div className="encabezado-mensaje">
                        <strong>
                          {esTecnico ? "Técnico" : item.autor}
                        </strong>
                      </div>
                      <div className="texto-mensaje">
                        {
                          item.mensaje
                        }
                      </div>

                      <small className="fecha-mensaje">
                        {
                          new Date(
                            item.fecha,
                          ).toLocaleString(
                            "es-CR",
                          )
                        }
                      </small>
                    </div>
                  </div>
                );
              },
            )
          }

          <div
            ref={
              chatFinalRef
            }
          />
        </div>

        <div className="indicador-escribiendo">
          {escribiendo}
        </div>

        <form
          className="row g-2"
          onSubmit={
            enviarMensaje
          }
        >
          <div className="col-md-3">
            <input
              className="form-control"
              value={autor}
              onChange={
                (event) =>
                  setAutor(
                    event.target.value,
                  )
              }
              placeholder="Nombre"
              required
            />
          </div>

          <div className="col-md-2">
            <select
              className="form-select"
              value={rol}
              onChange={
                (event) =>
                  cambiarRol(
                    event.target.value,
                  )
              }
            >
              <option value="Cliente">
                Cliente
              </option>

              <option value="Tecnico">
                Técnico
              </option>
            </select>
          </div>

          <div className="col-md-5">
            <input
              className="form-control"
              value={mensaje}
              onChange={
                (event) =>
                  cambiarMensaje(
                    event.target.value,
                  )
              }
              placeholder="Escriba un mensaje"
              required
            />
          </div>

          <div className="col-md-2">
            <button
              className="btn btn-primary w-100"
              type="submit"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Chat;