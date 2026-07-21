import {
  API_URL,
} from "../services/solicitudService.js";

function Navbar() {
  return (
    <header className="navbar-smart">
      <div className="d-flex align-items-center gap-3">
        <span className="navbar-logo">
          📩
        </span>

        <div>
          <h1>
            SmartNotify Solutions
          </h1>

          <p>
            Solicitudes de soporte y
            comunicación en tiempo real
          </p>
        </div>
      </div>

      <a
        href={`${API_URL}/tradicional`}
        target="_blank"
        rel="noreferrer"
        className="btn btn-navbar-cta"
      >
        🟢 Etapa 1: Comunicación síncrona
      </a>
    </header>
  );
}

export default Navbar;