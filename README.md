# 🛍️ FakeStore Interactive App
## By Gabriel Jorge Garcia

Aplicación web en **Node.js + Express** que permite **ver, crear, editar y eliminar productos** de una tienda ficticia utilizando la API pública [FakeStoreAPI](https://fakestoreapi.com).

---

## 🚀 Características principales

- 🔹 **Listado dinámico de productos** con estilo moderno (TailwindCSS)
- 🔹 **Creación, edición y eliminación** simuladas mediante la API
- 🔹 **Mensajes tipo Toast** (alertas visuales) al crear, modificar o eliminar
- 🔹 **Protección contra XSS** gracias a la función `escapeHtml()`
- 🔹 **Simulación de ID personalizada** (ID 21 para nuevos productos)
- 🔹 **Diseño responsive** y dark mode integrado

---

## 🧠 ¿Qué hace la función `escapeHtml()`?

La función `escapeHtml()` limpia los textos antes de insertarlos en el HTML,
evitando ataques de **inyección de código (XSS)**.

```js
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
