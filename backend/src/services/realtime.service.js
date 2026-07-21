let io = null;

const clientesLongPolling =
  new Set();

const clientesSSE =
  new Set();

export function configurarRealtime(
  socketServer,
) {
  io = socketServer;
}

export function agregarClienteLongPolling(
  res,
) {
  clientesLongPolling.add(res);
}

export function eliminarClienteLongPolling(
  res,
) {
  clientesLongPolling.delete(res);
}

export function agregarClienteSSE(
  res,
) {
  clientesSSE.add(res);
}

export function eliminarClienteSSE(
  res,
) {
  clientesSSE.delete(res);
}

export function notificarCambio(
  tipo,
  payload,
) {
  const evento = {
    tipo,
    payload,

    fecha:
      new Date()
        .toISOString(),
  };


  for (
    const res
    of clientesLongPolling
  ) {
    if (!res.writableEnded) {
      res
        .status(200)
        .json(evento);
    }
  }

  clientesLongPolling.clear();


  const mensajeSSE =
    `data: ${JSON.stringify(evento)}\n\n`;

  for (
    const res
    of clientesSSE
  ) {
    if (!res.writableEnded) {
      res.write(mensajeSSE);
    }
  }

  
  if (io) {
    io.emit(
      "solicitudes:evento",
      evento,
    );
  }
}