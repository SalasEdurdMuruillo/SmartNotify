USE smartnotify;

CREATE TABLE IF NOT EXISTS solicitudes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    token VARCHAR(64) NOT NULL UNIQUE,

    nombreCliente VARCHAR(120) NOT NULL,

    correo VARCHAR(150) NOT NULL,

    asunto VARCHAR(180) NOT NULL,

    descripcion TEXT NOT NULL,

    informacionAdicional TEXT NULL,

    estado ENUM(
        'Pendiente',
        'Asignada',
        'En proceso',
        'Finalizada',
        'Cancelada'
    ) NOT NULL DEFAULT 'Pendiente',

    recepcionConfirmada BOOLEAN NOT NULL DEFAULT FALSE,

    solucionConfirmada BOOLEAN NOT NULL DEFAULT FALSE,

    fechaCreacion DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    fechaActualizacion DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_solicitudes_estado (estado),

    INDEX idx_solicitudes_correo (correo)
);

CREATE TABLE IF NOT EXISTS historial (
    id INT AUTO_INCREMENT PRIMARY KEY,

    solicitudId INT NOT NULL,

    tipo VARCHAR(60) NOT NULL,

    detalle TEXT NOT NULL,

    estadoAnterior VARCHAR(50) NULL,

    estadoNuevo VARCHAR(50) NULL,

    fecha DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_historial_solicitud
        FOREIGN KEY (solicitudId)
        REFERENCES solicitudes(id)
        ON DELETE CASCADE,

    INDEX idx_historial_solicitud (solicitudId)
);

CREATE TABLE IF NOT EXISTS mensajes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    solicitudId INT NOT NULL,

    autor VARCHAR(100) NOT NULL,

    rol ENUM(
        'Cliente',
        'Tecnico'
    ) NOT NULL DEFAULT 'Cliente',

    mensaje TEXT NOT NULL,

    fecha DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mensajes_solicitud
        FOREIGN KEY (solicitudId)
        REFERENCES solicitudes(id)
        ON DELETE CASCADE,

    INDEX idx_mensajes_solicitud (solicitudId)
);

CREATE TABLE IF NOT EXISTS evaluaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,

    solicitudId INT NOT NULL UNIQUE,

    calificacion TINYINT NOT NULL,

    comentario TEXT NULL,

    fecha DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_calificacion
        CHECK (calificacion BETWEEN 1 AND 5),

    CONSTRAINT fk_evaluaciones_solicitud
        FOREIGN KEY (solicitudId)
        REFERENCES solicitudes(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,

    solicitudId INT NOT NULL,

    destinatario VARCHAR(150) NOT NULL,

    asunto VARCHAR(200) NOT NULL,

    estadoEnvio ENUM(
        'Enviado',
        'Error',
        'Omitido'
    ) NOT NULL,

    detalle TEXT NULL,

    fecha DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notificaciones_solicitud
        FOREIGN KEY (solicitudId)
        REFERENCES solicitudes(id)
        ON DELETE CASCADE,

    INDEX idx_notificaciones_solicitud (solicitudId)
);