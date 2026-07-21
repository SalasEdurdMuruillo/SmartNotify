export const API_URL =
  "http://localhost:4000";

async function request(
  ruta,
  opciones = {},
) {
  let response;

  try {
    response = await fetch(
      `${API_URL}${ruta}`,
      {
        ...opciones,

        headers: {
          "Content-Type":
            "application/json",

          ...(
            opciones.headers ||
            {}
          ),
        },
      },
    );
  } catch {
    throw new Error(
      "No fue posible conectar con el backend en http://localhost:4000",
    );
  }

  const texto =
    await response.text();

  let data = {};

  if (texto) {
    try {
      data =
        JSON.parse(texto);
    } catch {
      throw new Error(
        "El backend devolvió una respuesta que no es JSON",
      );
    }
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.mensaje ||
      "Error en el servidor",
    );
  }

  return data;
}

export function crearSolicitud(
  datos,
) {
  return request(
    "/api/solicitudes",
    {
      method:
        "POST",

      body:
        JSON.stringify(
          datos,
        ),
    },
  );
}

export function listarSolicitudes() {
  return request(
    "/api/solicitudes",
  );
}

export function obtenerSolicitud(
  id,
) {
  return request(
    `/api/solicitudes/${id}`,
  );
}

export function obtenerSolicitudPublica(
  id,
  token,
) {
  return request(
    `/api/solicitudes/${id}/publica?token=${encodeURIComponent(token)}`,
  );
}

export function actualizarSolicitud(
  id,
  datos,
) {
  return request(
    `/api/solicitudes/${id}`,
    {
      method:
        "PUT",

      body:
        JSON.stringify(
          datos,
        ),
    },
  );
}

export function cambiarEstado(
  id,
  estado,
) {
  return request(
    `/api/solicitudes/${id}/estado`,
    {
      method:
        "PATCH",

      body:
        JSON.stringify({
          estado,
        }),
    },
  );
}

export function obtenerHistorial(
  id,
) {
  return request(
    `/api/solicitudes/${id}/historial`,
  );
}

export function obtenerMensajes(
  id,
) {
  return request(
    `/api/solicitudes/${id}/mensajes`,
  );
}

export function obtenerNotificaciones(
  id,
) {
  return request(
    `/api/solicitudes/${id}/notificaciones`,
  );
}

export function accionCorreo(
  id,
  accion,
  datos = {},
) {
  return request(
    `/api/solicitudes/${id}/${accion}`,
    {
      method:
        "POST",

      body:
        JSON.stringify(
          datos,
        ),
    },
  );
}