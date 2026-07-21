# DRIP — Marketplace de Moda

## 📌 Sobre el proyecto

**DRIP** es un marketplace de moda full-stack inspirado en plataformas como Zalando, donde los usuarios pueden **explorar un catálogo de productos**, **buscar y filtrar por categoría**, **gestionar favoritos** y **realizar pedidos** con gestión automática de stock.

El proyecto está dividido en dos partes independientes que se comunican mediante una API REST protegida con JWT:

- **Backend**: gestiona usuarios, autenticación, productos, favoritos y pedidos.
- **Frontend**: catálogo navegable, ficha de producto detallada y flujo de registro/inicio de sesión.

De esta forma, *DRIP* funciona como una tienda online completa, con separación clara entre la lógica de negocio (backend) y la experiencia de usuario (frontend).

### 📷 Vista previa de la aplicación

![Vista previa de DRIP]()

### 📱 Interfaz de usuario

![Pantallas de la aplicación]()

---

## 🔧 Tecnologías utilizadas

El proyecto está desarrollado utilizando las siguientes tecnologías:

- **Angular** y **Tailwind CSS** para la interfaz de usuario.
- **Spring Boot** (Java) para la API REST y la lógica de negocio.
- **MongoDB** para el almacenamiento de datos.
- **JWT (JSON Web Tokens)** para la autenticación y autorización.

### 🔍 Arquitectura de la aplicación

![Esquema de arquitectura Angular + Spring Boot + MongoDB](img/arquitecturaproyecto.png)

---

## ✨ Funcionalidades implementadas

- ✅ Registro e inicio de sesión con JWT y roles (`USER` / `ADMIN`)
- ✅ Catálogo de productos con filtro por categoría y búsqueda en tiempo real
- ✅ Ficha de producto: galería de imágenes, selección de talla/color, productos similares
- ✅ Sistema de favoritos por usuario
- ✅ Creación de pedidos con verificación y descuento de stock automático
- ✅ Historial de pedidos por usuario

### Pendiente

-  Carrito de compra y checkout
-  Panel de administración
-  Chatbot de atención al cliente
-  Sistema de valoraciones y opiniones

---

> [!IMPORTANT]
> **Requisitos para poder ejecutar el proyecto:**
>
> - Tener instalado **Java 21**.
> - Tener instalado **Node.js** y **Angular CLI**.
> - Tener **MongoDB** corriendo en `localhost:27017`.
> - Editor de código: **Visual Studio Code**.
>
> Si no tienes MongoDB instalado, sigue los pasos a continuación.

---

> [!NOTE]
> **Comprobar que MongoDB está corriendo**
>
> Antes de arrancar el backend, verifica que el servicio de MongoDB está activo ejecutando en PowerShell:
> ```sh
> Get-Service -Name "MongoDB*"
> ```
> Si el estado no aparece como `Running`, actívalo con:
> ```sh
> Start-Service MongoDB
> ```
> Si no aparece ningún servicio, instala MongoDB Community Server desde [aquí](https://www.mongodb.com/try/download/community).

---

> [!TIP]
> **Arrancar el backend (Spring Boot)**
>
> Desde la carpeta del backend, ejecuta:
> ```sh
> cd demo
> ./mvnw spring-boot:run
> ```
> El backend quedará disponible en `http://localhost:8080`.

---

> [!TIP]
> **Arrancar el frontend (Angular)**
>
> Desde la carpeta del frontend, instala las dependencias y arráncalo:
> ```sh
> cd frontend
> npm install
> ng serve
> ```
> El frontend quedará disponible en `http://localhost:4200`.

---

> [!WARNING]
> **Ejecutar el proyecto en la carpeta correcta**
>
> Asegúrate de estar en la carpeta raíz del proyecto antes de moverte a `demo` o `frontend`.
> Usa este comando para navegar a la carpeta del proyecto (ajusta la ruta según corresponda):
> ```sh
> cd C:\Users\Usuario\marketplace\marketplace
> ```
> Luego, sigue los pasos anteriores para iniciar backend y frontend por separado.

---

## 🔌 Endpoints principales de la API

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | `/api/auth/register` | Registro de usuario | Público |
| POST | `/api/auth/login` | Inicio de sesión | Público |
| GET | `/api/productos` | Listado de productos (filtros: `categoria`, `buscar`) | Público |
| GET | `/api/productos/destacados` | Productos destacados | Público |
| GET | `/api/productos/{id}` | Detalle de producto | Público |
| POST | `/api/productos` | Crear producto | ADMIN |
| PUT | `/api/productos/{id}` | Editar producto | ADMIN |
| DELETE | `/api/productos/{id}` | Eliminar producto | ADMIN |
| GET | `/api/favoritos` | Listar favoritos | Autenticado |
| POST | `/api/favoritos/{productoId}` | Añadir a favoritos | Autenticado |
| DELETE | `/api/favoritos/{productoId}` | Quitar de favoritos | Autenticado |
| POST | `/api/pedidos` | Crear pedido | Autenticado |
| GET | `/api/pedidos/mis-pedidos` | Historial de pedidos | Autenticado |

---

## 🗺️ Roadmap

- [ ] Conectar el botón de favoritos del catálogo/detalle con el backend
- [ ] Carrito de compra funcional + checkout
- [ ] Página de favoritos
- [ ] Panel de administración
- [ ] Carrusel de ofertas especiales en Home
- [ ] Chatbot de atención al cliente
- [ ] Banco de imágenes reales para los productos
- [ ] Sistema de valoraciones y opiniones

---

✅ **Con estos pasos, tu entorno estará listo para ejecutar el proyecto correctamente. 🚀**

## 👤 Autor

Alejandro Quindimil

_Proyecto personal desarrollado con fines de aprendizaje y portfolio._
