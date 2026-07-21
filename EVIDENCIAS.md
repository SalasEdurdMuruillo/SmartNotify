# Evidencia de funcionamiento — SmartNotify Solutions

Este documento es una guia para generar la evidencia (capturas de pantalla o video)
que exige el laboratorio como entregable. Sigue el orden propuesto: cada bloque
indica **que hacer**, **que capturar** y **que debe verse** en la evidencia para
que quede claro que el requerimiento funciona.

Antes de iniciar:

```bash
# 1) Base de datos
docker compose up -d

# 2) Backend (puerto 4000)
cd backend && npm install && npm run dev

# 3) Frontend (puerto 5173)
cd frontend && npm install && npm run dev
```

Abre Thunder Client/Postman/Insomnia para las pruebas de API y el navegador en
`http://localhost:5173` para las pruebas de interfaz.

---

## 1. Gestion completa de solicitudes

| Accion | Como probarlo | Evidencia a capturar |
|---|---|---|
| Registrar solicitud | Llenar el formulario "Nueva solicitud" en el frontend | Captura del formulario lleno + mensaje de exito con el ID asignado |
| Consultar estado | Clic en "Ver detalle" de una solicitud en la tabla | Captura del panel de detalle con estado y barra de progreso |
| Actualizar informacion | En el detalle, editar "Informacion adicional" y guardar | Captura antes y despues del cambio |
| Cancelar solicitud | Cambiar el estado a "Cancelada" desde la tabla o usar el enlace de cancelar del correo | Captura del estado cambiado + correo de cancelacion recibido |
| Confirmar solucion | Usar el boton "Confirmar solucion" desde el enlace de correo | Captura del mensaje "Solucion confirmada correctamente" |

---

## 2. Correos electronicos automaticos por evento

Cada uno de estos eventos debe disparar un correo, con Mailtrap configurado en
`backend/.env` (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`), revisa la bandeja de
Mailtrap despues de cada accion

-  **Solicitud creada** → registrar una solicitud nueva.
-  **Solicitud asignada** → cambiar estado a "Asignada" en la tabla.
-  **Solicitud en proceso** → cambiar estado a "En proceso".
-**Solicitud finalizada** → cambiar estado a "Finalizada" (o confirmar solucion).
-**Solicitud cancelada** → cambiar estado a "Cancelada".

**Evidencia a capturar:** una captura de Mailtrap por cada uno de los 5 correos,
mostrando el asunto (`<Título> - Solicitud #<id>`) y el cuerpo con la tabla de
datos (destinatario, fecha, identificador, estado).

> Si no configuras SMTP, el backend imprime el correo simulado (con todos los
> enlaces) en la terminal — sirve igual como evidencia: captura la consola.

---

## 3. Correos con todos los datos requeridos y enlaces interactivos

Abrir uno de los correos recibidos (o el log de consola si no usas SMTP real) y
verifica visualmente que contiene:

- Asunto
- Destinatario
- Fecha
- Identificador de solicitud (`#id`)
- Estado actual
- Boton **Consultar estado** → `http://localhost:5173/solicitud/:id?token=...`
- Boton **Confirmar recepcion** → `.../confirmar/:id?token=...`
- Boton **Cancelar solicitud** → `.../cancelar/:id?token=...`
- Boton **Confirmar solucion** → `.../solucion/:id?token=...`
- Boton **Agregar informacion** (formulario) → `.../informacion/:id?token=...`
- Boton **Evaluar servicio** (formulario) → `.../evaluacion/:id?token=...`

**Evidencia a capturar:** captura del correo completo mostrando los 6 botones.

---

## 4. Formulario abierto desde un correo (Etapa 2/HTTP)

1. Clic en el boton **Evaluar servicio** de un correo (o pega la URL
   `http://localhost:5173/evaluacion/:id?token=...` en el navegador).
1. Completa calificacion (1–5) y comentario, presiona "Enviar evaluacion".
2. Verifica el mensaje de exito.

**Evidencia a capturar:** captura del formulario de evaluacion lleno + mensaje
de confirmacion. Repite lo mismo con el formulario "Agregar informacion".

---

## 5. Etapa 1 — Comunicacion sincrona (HTTP tradicional)

1. En el frontend, clic en el boton **"Etapa 1: Comunicacion sincrona"** de la
   barra superior (abre `http://localhost:4000/tradicional` en pestaña nueva).
1. Llenar el formulario tradicional y enviarlo — notaras que la pagina **recarga
   por completo** (POST + redirect del servidor).
1. Consulta una solicitud por ID desde el mismo formulario.

**Evidencia a capturar:** captura del formulario, y captura de la pagina de
resultado tras el POST (mostrando la URL cambiada por el redirect del servidor).

---

## 6. Etapa 2 — Comunicacion asincrona (fetch)

1. En el panel principal, registra una solicitud o cambia un estado.
2. Abre las DevTools → pestaña **Network**, filtra por `Fetch/XHR`.

**Evidencia a capturar:** captura de Network mostrando la peticion `fetch`
(`POST /api/solicitudes` o `PATCH /api/solicitudes/:id/estado`) con respuesta
JSON, **sin que la pagina se haya recargado**.

---

## 7. Etapa 3 — Polling automatico (cada 10 s)

1. Activa el boton **"Etapa 3: Polling 10 s"** del panel de comunicacion.
2. Desde otra pestaña (o Thunder Client), cambia el estado de una solicitud.
3. Espera hasta 10 segundos y observa que la tabla se actualiza sola.

**Evidencia a capturar:** captura del registro de eventos mostrando varias
lineas `Polling: CONSULTA_CADA_10_SEGUNDOS` con sus horas, y/o un video corto
mostrando la actualizacion automatica sin recargar la pagina.

*Codigo relevante:* `frontend/src/components/PanelComunicacion.jsx` funcion
`alternarPolling` (usa `setInterval` + `fetch`).

---

## 8. Etapa 4 — Long Polling

1. Activa el boton**"Etapa 4: Long Polling"**.
2. Observa en Network que la peticion `GET /api/comunicacion/long-polling`
   queda **pendiente (pending)** — no responde de inmediato.
1. Cambia el estado de una solicitud desde otra pestaña.
2. La peticion pendiente debe resolverse **inmediatamente** con el evento, y el
   cliente debe abrir otra peticion long-polling automaticamente.

**Evidencia a capturar:** captura de Network mostrando la peticion en estado
"pending" antes del cambio, y otra captura justo después mostrando que se
resolvio y se abrio una nueva conexion (veras varias entradas consecutivas a
`/api/comunicacion/long-polling`).

*Codigo relevante:* backend `comunicacion.controller.js` (`longPolling`, con
`res` guardado hasta que ocurre un cambio o pasan 25s) + frontend
`cicloLongPolling` (`while` que vuelve a hacer `fetch` tras cada respuesta).

---

## 9. Etapa 5 — Server-Sent Events (SSE)

1. Activa el boton **"Etapa 5: SSE"**.
2. En Network, busca la conexion a `/api/comunicacion/sse` — tipo
   `eventsource`, permanece abierta ("time" en crecimiento constante).
1. Cambia el estado de una solicitud desde otra pestaña.
2. El evento debe llegar sin que el cliente haga ninguna peticion nueva.

**Evidencia a capturar:** captura del registro de eventos mostrando
`SSE: {"tipo":"ESTADO_ACTUALIZADO",...}`, y captura de Network con la conexion
`sse` persistente (tipo `EventStream`).

*Codigo relevante:* backend `comunicacion.controller.js` (`sse`, con
`Content-Type: text/event-stream`) + frontend `alternarSSE` (usa
`new EventSource(...)`).

---

## 10. Etapa 6 — WebSockets bidireccionales

1. Abre el detalle de una solicitud y baja hasta el **Chat bidireccional**.
2. Abre la misma solicitud en dos pestañas (una como "Cliente", otra como
   "Tecnico" usando el selector de rol).
1. Escribe en una pestaña y verifica que el mensaje aparece en tiempo real en
   la otra, alineado a la derecha o izquierda segun el rol.
1. Empieza a escribir sin enviar — la otra pestaña debe mostrar
   "... está escribiendo".
1. Cambia un estado desde la tabla y observa que el panel de comunicacion
   recibe el evento por WebSocket (etiqueta "Etapa 6" activa).

**Evidencia a capturar:** captura o video de las dos pestañas mostrando el
intercambio de mensajes en ambos sentidos, y captura del indicador
"está escribiendo".

*Codigo relevante:* backend `socket/chat.socket.js` (eventos
`chat:mensaje`, `chat:escribiendo`) + frontend `components/Chat.jsx`.

---

## 11. Panel en tiempo real (reto adicional 4)

El panel de comunicacion (`PanelComunicacion.jsx`) actua como panel compartido:
cualquier tecnico que tenga la app abierta con WebSockets activo recibe todos
los cambios de estado de todas las solicitudes en tiempo real gracias a
`io.emit("solicitudes:evento", evento)` en `realtime.service.js`.

**Evidencia a capturar:** dos navegadores/perfiles distintos abiertos a la vez,
mostrando que un cambio hecho en uno se refleja instantaneamente en el otro.

---

## 12. Checklist final para el entregable

- Codigo fuente completo (backend + frontend)
- `docker-compose.yml` funcionando (`docker compose up -d`)
- `backend/.env` con credenciales (usar `.env.example` si se anonimiza)
- Capturas/video de las secciones 1 a 11 de este documento
- Base de datos exportada o script `database/init.sql` (ya incluido)

Organiza las capturas en una carpeta `evidencias/` con subcarpetas numeradas
(`01-gestion-solicitudes`, `02-correos`, ... `11-panel-tiempo-real`) para que
coincidan con las secciones de esta guia