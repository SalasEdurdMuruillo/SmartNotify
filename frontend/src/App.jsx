import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Navbar
  from "./components/Navbar.jsx";

import SolicitudForm
  from "./components/SolicitudForm.jsx";

import SolicitudesTable
  from "./components/SolicitudesTable.jsx";

import PanelComunicacion
  from "./components/PanelComunicacion.jsx";

import SolicitudDetalle
  from "./components/SolicitudDetalle.jsx";

import AccionCorreo
  from "./components/AccionCorreo.jsx";

import {
  crearSolicitud,
  cambiarEstado,
  listarSolicitudes,
} from "./services/solicitudService.js";

import "./App.css";

function obtenerRutaCorreo() {
  const partes =
    window.location.pathname
      .split("/")
      .filter(Boolean);

  if (
    partes.length !==
    2
  ) {
    return null;
  }

  const tiposValidos = [
    "solicitud",
    "confirmar",
    "cancelar",
    "informacion",
    "solucion",
    "evaluacion",
  ];

  if (
    !tiposValidos.includes(
      partes[0],
    )
  ) {
    return null;
  }

  return {
    tipo:
      partes[0],

    id:
      partes[1],

    token:
      new URLSearchParams(
        window.location.search,
      ).get("token") || "",
  };
}

function App() {
  const rutaCorreo =
    obtenerRutaCorreo();

  const [
    solicitudes,
    setSolicitudes,
  ] = useState([]);

  const [
    seleccionada,
    setSeleccionada,
  ] = useState(null);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const cargarSolicitudes =
    useCallback(
      async () => {
        try {
          const datos =
            await listarSolicitudes();

          setSolicitudes(
            datos,
          );

          setError("");
        } catch (err) {
          setError(
            err.message,
          );
        }
      },
      [],
    );

  useEffect(
    () => {
      if (!rutaCorreo) {
        cargarSolicitudes();
      }
    },
    [
      cargarSolicitudes,
    ],
  );

  const registrar =
    async (
      datos,
    ) => {
      try {
        const respuesta =
          await crearSolicitud(
            datos,
          );

        setMensaje(
          `${respuesta.mensaje}. ID: #${respuesta.solicitud.id}`,
        );

        setError("");

        await cargarSolicitudes();

        return true;
      } catch (err) {
        setMensaje("");

        setError(
          err.message,
        );

        return false;
      }
    };

  const actualizarEstado =
    async (
      id,
      estado,
    ) => {
      try {
        const respuesta =
          await cambiarEstado(
            id,
            estado,
          );

        setMensaje(
          respuesta.mensaje,
        );

        setError("");

        await cargarSolicitudes();
      } catch (err) {
        setMensaje("");

        setError(
          err.message,
        );
      }
    };

  if (rutaCorreo) {
    return (
      <AccionCorreo
        {...rutaCorreo}
      />
    );
  }

  return (
    <>
      <Navbar />

      <main className="container-fluid contenido-principal">
        {
          mensaje && (
            <div className="alert alert-success">
              {mensaje}
            </div>
          )
        }

        {
          error && (
            <div className="alert alert-danger d-flex justify-content-between align-items-center">
              <span>
                <strong>
                  Error:
                </strong>{" "}

                {error}
              </span>

              <button
                className="btn-close"
                onClick={
                  () =>
                    setError(
                      "",
                    )
                }
              />
            </div>
          )
        }

        <div className="row g-4">
          <div className="col-lg-5">
            <SolicitudForm
              onRegistrar={
                registrar
              }
            />
          </div>

          <div className="col-lg-7">
            <PanelComunicacion
              onActualizar={
                cargarSolicitudes
              }
            />
          </div>
        </div>

        <SolicitudesTable
          solicitudes={
            solicitudes
          }
          onCambiarEstado={
            actualizarEstado
          }
          onVer={
            setSeleccionada
          }
        />

        {
          seleccionada && (
            <SolicitudDetalle
              solicitudId={
                seleccionada
              }
              onCerrar={
                () =>
                  setSeleccionada(
                    null,
                  )
              }
            />
          )
        }
      </main>
    </>
  );
}

export default App;