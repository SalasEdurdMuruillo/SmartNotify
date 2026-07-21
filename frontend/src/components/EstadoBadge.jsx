const ESTILOS_ESTADO = {
  Pendiente: {
    clase: "badge-estado badge-pendiente",
    icono: "🕒",
  },
  Asignada: {
    clase: "badge-estado badge-asignada",
    icono: "📌",
  },
  "En proceso": {
    clase: "badge-estado badge-proceso",
    icono: "🛠️",
  },
  Finalizada: {
    clase: "badge-estado badge-finalizada",
    icono: "✅",
  },
  Cancelada: {
    clase: "badge-estado badge-cancelada",
    icono: "❌",
  },
};

function EstadoBadge({ estado }) {
  const estilo =
    ESTILOS_ESTADO[estado] || {
      clase: "badge-estado badge-pendiente",
      icono: "🕒",
    };

  return (
    <span className={estilo.clase}>
      <span aria-hidden="true">{estilo.icono}</span>
      {estado}
    </span>
  );
}

export default EstadoBadge;
