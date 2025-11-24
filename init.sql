CREATE DATABASE IF NOT EXISTS testdb;
USE testdb;


CREATE TABLE IF NOT EXISTS usuarios (
id INT AUTO_INCREMENT PRIMARY KEY,
username VARCHAR(50) UNIQUE NOT NULL,
password VARCHAR(255) NOT NULL,
role ENUM('user','admin') DEFAULT 'user',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Usuario admin de ejemplo (con contraseña 'adminpass' -> deberás cambiarla si la quieres en claro)
-- No insertamos la contraseña en claro; se recomienda registrar desde la app o usar script para hashear.
