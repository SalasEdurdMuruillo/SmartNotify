import BarraProgreso
  from "./BarraProgreso.jsx";

import EstadoBadge
  from "./EstadoBadge.jsx";

const ESTADOS = [
  "Pendiente",
  "Asignada",
  "En proceso",
  "Finalizada",
  "Cancelada",
];

function SolicitudesTable({
  solicitudes,
  onCambiarEstado,
  onVer,
}) {
  return (
    <div className="card panel mt-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0">
            Panel de solicitudes
          </h2>

          <span className="badge text-bg-dark">
            {
              solicitudes.length
            }
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Asunto</th>

                <th
                  style={{
                    minWidth:
                      190,
                  }}
                >
                  Progreso en tiempo real
                </th>

                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {
                solicitudes.map(
                  (
                    solicitud,
                  ) => (
                    <tr
                      key={
                        solicitud.id
                      }
                    >
                      <td>
                        #{solicitud.id}
                      </td>

                      <td>
                        {
                          solicitud.nombreCliente
                        }

                        <small className="d-block text-secondary">
                          {
                            solicitud.correo
                          }
                        </small>
                      </td>

                      <td>
                        {
                          solicitud.asunto
                        }
                      </td>

                      <td>
                        <BarraProgreso
                          estado={
                            solicitud.estado
                          }
                        />
                      </td>

                      <td>
                        <EstadoBadge
                          estado={
                            solicitud.estado
                          }
                        />

                        <select
                          className="form-select form-select-sm mt-2"
                          value={
                            solicitud.estado
                          }
                          onChange={
                            (
                              event,
                            ) =>
                              onCambiarEstado(
                                solicitud.id,

                                event
                                  .target
                                  .value,
                              )
                          }
                        >
                          {
                            ESTADOS.map(
                              (
                                estado,
                              ) => (
                                <option
                                  key={
                                    estado
                                  }
                                >
                                  {
                                    estado
                                  }
                                </option>
                              ),
                            )
                          }
                        </select>
                      </td>

                      <td>
                        <button
                          className="btn btn-outline-dark btn-sm"
                          onClick={
                            () =>
                              onVer(
                                solicitud.id,
                              )
                          }
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ),
                )
              }

              {
                solicitudes.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center text-secondary py-4"
                    >
                      No hay solicitudes registradas.
                    </td>
                  </tr>
                )
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SolicitudesTable;