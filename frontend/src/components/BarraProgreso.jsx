const progresoPorEstado = {
  Pendiente: 20,
  Asignada: 45,
  "En proceso": 75,
  Finalizada: 100,
  Cancelada: 100,
};

function BarraProgreso({
  estado,
}) {
  const progreso =
    progresoPorEstado[estado] ||
    0;

  const clase =
    estado === "Cancelada"
      ? "bg-danger"
      : estado === "Finalizada"
        ? "bg-success"
        : "bg-primary";

  return (
    <div>
      <div className="d-flex justify-content-between small mb-1">
        <span>
          {estado}
        </span>

        <span>
          {progreso}%
        </span>
      </div>

      <div
        className="progress"
        role="progressbar"
        aria-valuenow={progreso}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          className={
            `progress-bar ${clase}`
          }
          style={{
            width:
              `${progreso}%`,
          }}
        />
      </div>
    </div>
  );
}

export default BarraProgreso;