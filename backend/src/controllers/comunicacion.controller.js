import {
  agregarClienteLongPolling,
  eliminarClienteLongPolling,
  agregarClienteSSE,
  eliminarClienteSSE,
} from "../services/realtime.service.js";

export function longPolling(
  req,
  res,
) {
  req.setTimeout(30000);

  agregarClienteLongPolling(
    res,
  );

  const timeout =
    setTimeout(() => {
      eliminarClienteLongPolling(
        res,
      );

      if (!res.writableEnded) {
        res
          .status(200)
          .json({
            tipo:
              "SIN_CAMBIOS",

            fecha:
              new Date()
                .toISOString(),
          });
      }
    }, 25000);

  req.on(
    "close",
    () => {
      clearTimeout(timeout);

      eliminarClienteLongPolling(
        res,
      );
    },
  );
}

export function sse(
  req,
  res,
) {
  res.setHeader(
    "Content-Type",
    "text/event-stream",
  );

  res.setHeader(
    "Cache-Control",
    "no-cache",
  );

  res.setHeader(
    "Connection",
    "keep-alive",
  );

  res.flushHeaders();

  agregarClienteSSE(res);

  res.write(
    `data: ${JSON.stringify({
      tipo:
        "SSE_CONECTADO",

      fecha:
        new Date()
          .toISOString(),
    })}\n\n`,
  );

  const heartbeat =
    setInterval(() => {
      if (!res.writableEnded) {
        res.write(
          `event: ping\ndata: ${Date.now()}\n\n`,
        );
      }
    }, 20000);

  req.on(
    "close",
    () => {
      clearInterval(
        heartbeat,
      );

      eliminarClienteSSE(
        res,
      );
    },
  );
}