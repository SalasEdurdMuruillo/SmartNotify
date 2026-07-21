import pool
  from "../../config/db.js";

export function configurarChat(
  io,
) {
  io.on(
    "connection",
    (socket) => {
      console.log(
        "Cliente WebSocket conectado:",
        socket.id,
      );

      socket.on(
        "solicitud:unirse",
        (solicitudId) => {
          socket.join(
            `solicitud-${solicitudId}`,
          );
        },
      );

      socket.on(
        "chat:mensaje",
        async (
          datos,
          responder,
        ) => {
          try {
            const {
              solicitudId,
              autor,
              rol = "Cliente",
              mensaje,
            } = datos || {};

            if (
              !solicitudId ||
              !autor?.trim() ||
              !mensaje?.trim()
            ) {
              responder?.({
                ok: false,

                error:
                  "Datos del mensaje incompletos",
              });

              return;
            }

            const rolValido =
              rol === "Tecnico"
                ? "Tecnico"
                : "Cliente";

            const [result] =
              await pool.execute(
                `INSERT INTO mensajes
                (
                  solicitudId,
                  autor,
                  rol,
                  mensaje
                )
                VALUES (?, ?, ?, ?)`,
                [
                  solicitudId,
                  autor.trim(),
                  rolValido,
                  mensaje.trim(),
                ],
              );

            const nuevoMensaje = {
              id:
                result.insertId,

              solicitudId:
                Number(
                  solicitudId,
                ),

              autor:
                autor.trim(),

              rol:
                rolValido,

              mensaje:
                mensaje.trim(),

              fecha:
                new Date()
                  .toISOString(),
            };

            io
              .to(
                `solicitud-${solicitudId}`,
              )
              .emit(
                "chat:nuevo-mensaje",
                nuevoMensaje,
              );

            responder?.({
              ok: true,
            });
          } catch (error) {
            console.error(error);

            responder?.({
              ok: false,

              error:
                "No se pudo guardar el mensaje",
            });
          }
        },
      );

      socket.on(
        "chat:escribiendo",
        ({
          solicitudId,
          autor,
        }) => {
          socket
            .to(
              `solicitud-${solicitudId}`,
            )
            .emit(
              "chat:escribiendo",
              {
                autor,
              },
            );
        },
      );

      socket.on(
        "chat:dejo-escribir",
        ({
          solicitudId,
        }) => {
          socket
            .to(
              `solicitud-${solicitudId}`,
            )
            .emit(
              "chat:dejo-escribir",
            );
        },
      );

      socket.on(
        "disconnect",
        () => {
          console.log(
            "Cliente WebSocket desconectado:",
            socket.id,
          );
        },
      );
    },
  );
}
