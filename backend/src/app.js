import express
  from "express";

import dotenv
  from "dotenv";

import cors
  from "cors";

import http
  from "http";

import {
  Server,
} from "socket.io";

import pool, {
  probarConexion,
} from "../config/db.js";

import solicitudRouter
  from "./routes/solicitud.routes.js";

import comunicacionRouter
  from "./routes/comunicacion.routes.js";

import tradicionalRouter
  from "./routes/tradicional.routes.js";

import {
  configurarRealtime,
} from "./services/realtime.service.js";

import {
  configurarChat,
} from "./socket/chat.socket.js";

dotenv.config();

const NAME =
  process.env.SERVER_NAME ||
  "Servidor SmartNotify Solutions";

const VERSION =
  process.env.SERVER_VERSION ||
  "1.0.0";

const DESCRIPTION =
  process.env.SERVER_DESCRIPTION ||
  "Sistema de soporte técnico";

const PORT =
  Number(
    process.env.SERVER_PORT ||
    4000,
  );

const app =
  express();

const servidorHttp =
  http.createServer(app);

const io =
  new Server(
    servidorHttp,
    {
      cors: {
        origin: true,

        methods: [
          "GET",
          "POST",
          "PUT",
          "PATCH",
          "DELETE",
        ],
      },
    },
  );

configurarRealtime(io);

configurarChat(io);

app.use(cors());

app.use(
  express.json({
    limit: "2mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.get(
  "/",
  (req, res) => {
    res.json({
      name: NAME,
      version: VERSION,
      description: DESCRIPTION,
      puerto: PORT,
    });
  },
);

app.get(
  "/api/estado",
  async (
    req,
    res,
  ) => {
    try {
      await pool.query(
        "SELECT 1",
      );

      return res.json({
        backend:
          "activo",

        baseDatos:
          "conectada",
      });
    } catch (error) {
      return res
        .status(500)
        .json({
          backend:
            "activo",

          baseDatos:
            "desconectada",

          error:
            error.message,
        });
    }
  },
);

app.use(
  "/api/solicitudes",
  solicitudRouter,
);

app.use(
  "/api/comunicacion",
  comunicacionRouter,
);

app.use(
  "/tradicional",
  tradicionalRouter,
);

app.use(
  (req, res) => {
    res
      .status(404)
      .json({
        error:
          `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
      });
  },
);

servidorHttp.listen(
  PORT,
  async () => {
    console.log(
      `${NAME} ${VERSION} ejecutándose en http://localhost:${PORT}`,
    );

    console.log(
      `Solicitudes: http://localhost:${PORT}/api/solicitudes`,
    );

    console.log(
      `Comunicación síncrona: http://localhost:${PORT}/tradicional`,
    );

    try {
      await probarConexion();

      console.log(
        "MySQL conectado correctamente",
      );
    } catch (error) {
      console.error(
        "El servidor inicio, pero MySQL no esta conectado:",
        error.message,
      );
    }
  },
);