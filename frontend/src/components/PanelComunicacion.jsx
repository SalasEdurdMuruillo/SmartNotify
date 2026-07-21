import { useEffect, useRef, useState } from "react";

import { io } from "socket.io-client";

import { API_URL } from "../services/solicitudService.js";

function PanelComunicacion({ onActualizar }) {
  const [modos, setModos] = useState({
    polling: false,
    longPolling: false,
    sse: false,
    websocket: false,
  });

  const [eventos, setEventos] = useState([]);

  const pollingRef = useRef(null);

  const longPollingActivoRef = useRef(false);

  const longPollingAbortRef = useRef(null);

  const sseRef = useRef(null);

  const socketRef = useRef(null);

  const registrar = (origen, evento) => {
    setEventos((actuales) =>
      [
        {
          origen,
          evento,

          hora: new Date().toLocaleTimeString("es-CR"),
        },

        ...actuales,
      ].slice(0, 30),
    );
  };

  const conectarWebSocket = () => {
    if (socketRef.current) {
      return;
    }

    const socket = io(API_URL);

    socketRef.current = socket;

    socket.on("connect", () => {
      setModos((m) => ({
        ...m,
        websocket: true,
      }));

      registrar("WebSocket", {
        tipo: "CONECTADO",

        id: socket.id,
      });
    });

    socket.on("solicitudes:evento", (evento) => {
      registrar("WebSocket", evento);

      onActualizar();
    });

    socket.on("disconnect", () => {
      setModos((m) => ({
        ...m,
        websocket: false,
      }));

      registrar("WebSocket", {
        tipo: "DESCONECTADO",
      });
    });
  };

  const alternarWebSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();

      socketRef.current = null;

      setModos((m) => ({
        ...m,
        websocket: false,
      }));
    } else {
      conectarWebSocket();
    }
  };

  const alternarPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);

      pollingRef.current = null;

      setModos((m) => ({
        ...m,
        polling: false,
      }));

      return;
    }

    onActualizar();

    pollingRef.current = setInterval(() => {
      onActualizar();

      registrar("Polling", {
        tipo: "CONSULTA_CADA_10_SEGUNDOS",
      });
    }, 10000);

    setModos((m) => ({
      ...m,
      polling: true,
    }));
  };

  const cicloLongPolling = async () => {
    while (longPollingActivoRef.current) {
      const controller = new AbortController();

      longPollingAbortRef.current = controller;

      try {
        const response = await fetch(
          `${API_URL}/api/comunicacion/long-polling`,
          {
            signal: controller.signal,
          },
        );

        const evento = await response.json();

        if (!longPollingActivoRef.current) {
          break;
        }

        registrar("Long Polling", evento);

        if (evento.tipo !== "SIN_CAMBIOS") {
          onActualizar();
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          registrar("Long Polling", {
            tipo: "ERROR",

            mensaje: error.message,
          });

          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
      }
    }
  };

  const alternarLongPolling = () => {
    if (longPollingActivoRef.current) {
      longPollingActivoRef.current = false;

      longPollingAbortRef.current?.abort();

      setModos((m) => ({
        ...m,
        longPolling: false,
      }));

      return;
    }

    longPollingActivoRef.current = true;

    setModos((m) => ({
      ...m,
      longPolling: true,
    }));

    cicloLongPolling();
  };

  const alternarSSE = () => {
    if (sseRef.current) {
      sseRef.current.close();

      sseRef.current = null;

      setModos((m) => ({
        ...m,
        sse: false,
      }));

      return;
    }

    const source = new EventSource(`${API_URL}/api/comunicacion/sse`);

    source.onmessage = (mensaje) => {
      const evento = JSON.parse(mensaje.data);

      registrar("SSE", evento);

      if (evento.tipo !== "SSE_CONECTADO") {
        onActualizar();
      }
    };

    source.onerror = () =>
      registrar("SSE", {
        tipo: "ERROR_CONEXION",
      });

    sseRef.current = source;

    setModos((m) => ({
      ...m,
      sse: true,
    }));
  };

  useEffect(() => {
    /*
     * El WebSocket se conecta
     * automáticamente para mostrar
     * el progreso en tiempo real.
     */
    conectarWebSocket();

    return () => {
      clearInterval(pollingRef.current);

      longPollingActivoRef.current = false;

      longPollingAbortRef.current?.abort();

      sseRef.current?.close();

      socketRef.current?.disconnect();
    };
  }, []);

  const clase = (activo, variante) =>
    `btn btn-etapa btn-etapa-${variante} ${activo ? "activo" : ""}`;

  return (
    <div className="card panel h-100 panel-comunicacion">
      <div className="card-body">
        <h2>🌐 Tipos de comunicación</h2>

        <p className="text-secondary">
          Activa cada mecanismo y luego registra o cambia una solicitud.
        </p>

        <div className="d-flex flex-wrap gap-2 mb-4">
          <button
            className={clase(modos.polling, "polling")}
            onClick={alternarPolling}
          >
            🟡 Etapa 3: Polling 10 s
          </button>

          <button
            className={clase(modos.longPolling, "long-polling")}
            onClick={alternarLongPolling}
          >
            🟠 Etapa 4: Long Polling
          </button>

          <button className={clase(modos.sse, "sse")} onClick={alternarSSE}>
            🔵 Etapa 5: SSE
          </button>

          <button
            className={clase(modos.websocket, "websocket")}
            onClick={alternarWebSocket}
          >
            🟣 Etapa 6: WebSockets
          </button>
        </div>

        <div className="registro-eventos">
          {eventos.length === 0 && (
            <span>Los eventos recibidos aparecerán aquí.</span>
          )}

          {eventos.map((item, index) => (
            <div key={`${item.hora}-${index}`}>
              [{item.hora}] {item.origen}: {JSON.stringify(item.evento)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PanelComunicacion;
