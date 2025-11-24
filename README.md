# Aplicacion-con-docker
📝 Descripción del proyecto

Este proyecto es un sistema completo de autenticación con:

Registro de usuarios

Inicio de sesión

Sesiones seguras con cookies

Contraseñas hasheadas con bcrypt

Dashboard privado accesible solo tras iniciar sesión

Base de datos MySQL en un contenedor separado

Backend Node.js (Express)

Frontend HTML básico

Despliegue con Docker Compose

Ideal como práctica de:

Contenedores Docker

Backend + Base de datos

Sesiones y seguridad

Arquitectura multicontenedor

🧱 Estructura del proyecto
login_app/
 ├── app.js
 ├── package.json
 ├── Dockerfile
 ├── docker-compose.yml
 ├── init.sql
 ├── public/
 │    ├── login.html
 │    ├── register.html
 │    └── dashboard.html

⚙️ Tecnologías utilizadas
Componente	Tecnología
Backend	Node.js + Express
Autenticación	express-session + bcrypt
Base de datos	MySQL 8
Orquestación	Docker Compose
Frontend	HTML simple
Persistencia	Volúmenes Docker
🚀 1. Instalación y ejecución
✔ 1.1 Clonar el repositorio
git clone <URL_DEL_REPO>
cd login_app

🚢 2. Levantar la aplicación con Docker Compose

Este proyecto funciona completamente con:

docker-compose up --build -d


Esto creará:

🔹 Contenedor web → Node.js
🔹 Contenedor db → MySQL
🔹 Volumen persistente para la base de datos
🔹 Inicialización automática de la tabla usuarios

📦 3. Servicios expuestos
Servicio	URL
Aplicación Web	http://localhost:3000

Login	http://localhost:3000/login.html

Registro	http://localhost:3000/register.html

Dashboard (requiere sesión)	http://localhost:3000/dashboard
🛢 4. Acceso a la base de datos
Entrar directamente en el contenedor:
docker exec -it login_app-db-1 bash

Entrar en MySQL:
mysql -u testuser -p


Contraseña (definida en docker-compose.yml):

testpass

🗂 5. Base de datos

La tabla se crea automáticamente gracias al archivo:

init.sql:

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user','admin') DEFAULT 'user'
);


Puedes añadir un usuario admin por defecto si quieres.

🔐 6. Sistema de autenticación
✔ Registro

POST /register
Guarda usuario + contraseña hasheada con bcrypt.

✔ Login

POST /login
Crea una sesión usando cookies (connect.sid).

✔ Dashboard

GET /dashboard
Solo accesible si estás logueado.

🌐 7. Rutas principales
Método	Ruta	Descripción
GET	/	Página de inicio
GET	/login.html	Formulario de login
GET	/register.html	Formulario de registro
POST	/login	Inicio de sesión
POST	/register	Registro
GET	/dashboard	Dashboard privado
GET	/logout	Cerrar sesión
🧰 8. Comandos Docker útiles
Ver contenedores:
docker ps

Ver logs:
docker logs login_app-web-1

Reconstruir:
docker-compose down
docker-compose up --build -d

Borrar contenedores y volúmenes:
docker-compose down -v

🔧 9. Variables de entorno

Configuradas en docker-compose.yml:

environment:
  DB_HOST: db
  DB_USER: testuser
  DB_PASSWORD: testpass
  DB_NAME: testdb

🛡 Seguridad implementada

Contraseñas hasheadas con bcrypt

Cookies HTTP Only

Sesiones de usuario

Rutas protegidas con middleware
