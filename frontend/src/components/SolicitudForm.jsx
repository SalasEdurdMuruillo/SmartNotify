import {
  useState,
} from "react";

const FORM_INICIAL = {
  nombreCliente: "",
  correo: "",
  asunto: "",
  descripcion: "",
};

function SolicitudForm({
  onRegistrar,
}) {
  const [
    form,
    setForm,
  ] = useState(
    FORM_INICIAL,
  );

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const cambiar = (
    event,
  ) => {
    setForm({
      ...form,

      [event.target.name]:
        event.target.value,
    });
  };

  const enviar =
    async (
      event,
    ) => {
      event.preventDefault();

      setEnviando(true);

      const correcto =
        await onRegistrar(
          form,
        );

      if (correcto) {
        setForm(
          FORM_INICIAL,
        );
      }

      setEnviando(false);
    };

  return (
    <form
      className="card panel h-100"
      onSubmit={enviar}
    >
      <div className="card-body">
        <h2>
          Nueva solicitud
        </h2>

        <p className="text-secondary">
          Complete el formulario para registrar una solicitud de soporte.
        </p>

        <label className="form-label">
          Nombre del cliente
        </label>

        <input
          className="form-control mb-3"
          name="nombreCliente"
          value={
            form.nombreCliente
          }
          onChange={cambiar}
          required
        />

        <label className="form-label">
          Correo electrónico
        </label>

        <input
          className="form-control mb-3"
          type="email"
          name="correo"
          value={
            form.correo
          }
          onChange={cambiar}
          required
        />

        <label className="form-label">
          Asunto
        </label>

        <input
          className="form-control mb-3"
          name="asunto"
          value={
            form.asunto
          }
          onChange={cambiar}
          required
        />

        <label className="form-label">
          Descripción
        </label>

        <textarea
          className="form-control mb-3"
          rows="5"
          name="descripcion"
          value={
            form.descripcion
          }
          onChange={cambiar}
          required
        />

        <button
          className="btn btn-primary w-100"
          disabled={enviando}
        >
          {
            enviando
              ? "Registrando..."
              : "Registrar solicitud"
          }
        </button>
      </div>
    </form>
  );
}

export default SolicitudForm;