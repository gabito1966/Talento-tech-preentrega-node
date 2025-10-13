import bodyParser from "body-parser";
import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 8080;
const API_BASE_URL = "https://fakestoreapi.com";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

async function fetchAPI(endpoint, options = {}) {
  try {
    const resp = await fetch(API_BASE_URL + endpoint, options);
    if (!resp.ok) throw new Error(`${resp.status} - ${resp.statusText}`);
    return await resp.json();
  } catch (err) {
    console.error("Error en fetchAPI:", err.message);
    return null;
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Render de formulario
function renderForm(product, action, title = "", toastMessage = "") {
  const toastScript = toastMessage
    ? `<script>
        window.addEventListener('DOMContentLoaded', () => {
          const toast = document.createElement('div');
          toast.className = 'fixed bottom-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-fade-in';
          toast.textContent = ${JSON.stringify(toastMessage)};
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 3000);
        });
      </script>`
    : "";

  return `
<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes zoom-in {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
    .animate-zoom-in { animation: zoom-in 0.25s ease-out forwards; }
  </style>
</head>
<body class="bg-gray-100 dark:bg-gray-900 text-white dark:text-gray-900 p-8">
  ${toastScript}
  <h1 class="text-2xl font-bold mb-6">${title}</h1>
  <form method="POST" action="${action}" class="space-y-4 max-w-lg mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow">
    <div>
      <label class="block mb-1 dark:text-gray-200 text-gray-900">Título:</label>
      <input name="title" type="text" class="w-full p-2 border rounded dark:bg-gray-700 dark:text-white bg-white text-black"
        required value="${escapeHtml(product.title || "")}" />
    </div>
    <div>
      <label class="block mb-1 dark:text-gray-200 text-gray-900">Precio:</label>
      <input name="price" type="number" step="0.01" min="0.01"
        class="w-full p-2 border rounded dark:bg-gray-700 dark:text-white bg-white text-black"
        required value="${product.price || ""}" />
    </div>
    <div>
      <label class="block mb-1 dark:text-gray-200 text-gray-900">Descripción:</label>
      <textarea name="description" class="w-full p-2 border rounded dark:bg-gray-700 dark:text-white bg-white text-black" required>${escapeHtml(
        product.description || ""
      )}</textarea>
    </div>
    <div>
      <label class="block mb-1 dark:text-gray-200 text-gray-900">URL Imagen:</label>
      <input name="image" type="url" class="w-full p-2 border rounded dark:bg-gray-700 dark:text-white bg-white text-black"
        required pattern="https?://.+" value="${escapeHtml(
          product.image || ""
        )}" />
    </div>
    <div>
      <label class="block mb-1 dark:text-gray-200 text-gray-900">Categoría:</label>
      <input name="category" type="text" class="w-full p-2 border rounded dark:bg-gray-700 dark:text-white bg-white text-black"
        required value="${escapeHtml(product.category || "")}" />
    </div>
    <div class="flex justify-between">
      <button type="submit" class="bg-blue-500 hover:bg-blue-800 text-white px-4 py-2 rounded">Guardar</button>
      <a href="/" class="bg-red-500 hover:bg-red-800 text-white px-4 py-2 rounded">Cancelar</a>
    </div>
  </form>
</body>
</html>`;
}

// Página principal
app.get("/", async (req, res) => {
  const products = (await fetchAPI("/products")) || [];
  const toastMessage = req.query.toast || "";
  const productParam = req.query.product
    ? decodeURIComponent(req.query.product)
    : "";

  let cardsHtml = products
    .map(
      (p) => `
    <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden flex flex-col">
      <img src="${p.image}" alt="${escapeHtml(
        p.title
      )}" class="h-48 object-contain bg-gray-100 dark:bg-gray-700 p-4"/>
      <div class="p-4 flex-1 flex flex-col">
        <h2 class="text-xl font-semibold mb-2">${escapeHtml(p.title)}</h2>
        <p class="text-gray-700 dark:text-gray-300">${escapeHtml(
          p.description
        )}</p>
        <p class="mt-4 font-bold text-lg dark:text-white">$${p.price}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 italic mb-4">Categoría: ${escapeHtml(
          p.category
        )}</p>
        <div class="mt-auto justify-between flex px-5 gap-5">
          <form method="POST" action="/delete/${
            p.id
          }" onsubmit="return confirm('¿Eliminar producto ID: ${p.id}?')">
            <button type="submit" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Eliminar</button>
          </form>
          <form method="GET" action="/edit/${p.id}">
            <button type="submit" class="bg-blue-500 hover:bg-blue-800 text-white px-4 py-2 rounded">Editar</button>
          </form>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Productos Interactivos</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes zoom-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
    .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
    .animate-zoom-in { animation: zoom-in 0.25s ease-out forwards; }
    .toast { position: fixed; bottom: 1.25rem; right: 1.25rem; background-color: #16a34a; color: white;
      padding: 0.5rem 1rem; border-radius: 0.375rem; box-shadow: 0 10px 15px -3px rgba(22,163,74,0.7);
      animation: fade-in 0.3s ease-out forwards; }
  </style>
</head>
<body class="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-400 p-8">
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-4xl font-bold">🛒 Store FakeStore </h1>
    <a href="/create" class="bg-blue-600 hover:bg-blue-700 text-gray-900 px-4 py-2 rounded">➕ Crear producto</a>
  </div>

  <div class="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    ${cardsHtml}
  </div>

  ${toastMessage ? `<div class="toast">${escapeHtml(toastMessage)}</div>` : ""}
  
  <!-- Modal con animación -->
  ${
    productParam
      ? `
  <div id="modal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md text-center animate-zoom-in">
      <h2 class="text-2xl font-bold mb-4 text-green-600">✅ Acción completada</h2>
      <img id="modal-img" class="mx-auto mb-4 w-32 h-32 object-contain" />
      <p class="text-gray-900 dark:text-gray-100 font-semibold" id="modal-title"></p>
      <p class="text-gray-700 dark:text-gray-300 mt-2" id="modal-category"></p>
      <p class="text-gray-500 dark:text-gray-400 mt-2" id="modal-desc"></p>
      <p class="mt-4 text-lg font-bold" id="modal-price"></p>
      <p class="text-xs text-gray-500 mt-1" id="modal-id"></p>
      <button onclick="document.getElementById('modal').remove()"
        class="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Cerrar</button>
    </div>
  </div>
  <script>
    const product = JSON.parse(${JSON.stringify(productParam)});
    if (!product.id) product.id = 21;
    document.getElementById('modal-img').src = product.image || '';
    document.getElementById('modal-title').textContent = "Título: " + product.title;
    document.getElementById('modal-category').textContent = "Categoría: " + product.category;
    document.getElementById('modal-desc').textContent = "Descripción: " + product.description;
    document.getElementById('modal-price').textContent = "Precio: $" + product.price;
    document.getElementById('modal-id').textContent = "ID asignado: " + product.id;
  </script>`
      : ""
  }
</body>
</html>
  `;

  res.send(html);
});

// Editar producto
app.get("/edit/:id", async (req, res) => {
  const id = req.params.id;
  const product = await fetchAPI(`/products/${id}`);
  if (!product) return res.status(404).send("Producto no encontrado");
  res.send(renderForm(product, `/edit/${id}`, `Editar producto ID ${id}`));
});

app.post("/edit/:id", async (req, res) => {
  const id = req.params.id;
  const { title, price, description, image, category } = req.body;
  await fetchAPI(`/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      price: parseFloat(price),
      description,
      image,
      category,
    }),
  });
  res.redirect(
    `/?toast=${encodeURIComponent("Producto actualizado con éxito")}` +
      `&product=${encodeURIComponent(
        JSON.stringify({ id, title, price, description, image, category })
      )}`
  );
});

// Crear producto (ID fijo = 21)
app.get("/create", (req, res) => {
  const empty = {
    title: "",
    price: "",
    description: "",
    image: "",
    category: "",
  };
  res.send(renderForm(empty, "/create", "Crear producto"));
});

app.post("/create", async (req, res) => {
  const { title, price, description, image, category } = req.body;
  const id = 21; // ID fijo
  await fetchAPI("/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      title,
      price: parseFloat(price),
      description,
      image,
      category,
    }),
  });
  res.redirect(
    `/?toast=${encodeURIComponent("Producto creado exitosamente")}` +
      `&product=${encodeURIComponent(
        JSON.stringify({ id, title, price, description, image, category })
      )}`
  );
});

// Eliminar producto
app.post("/delete/:id", async (req, res) => {
  const id = req.params.id;
  const product = await fetchAPI(`/products/${id}`);
  await fetchAPI(`/products/${id}`, { method: "DELETE" });
  res.redirect(
    `/?toast=${encodeURIComponent("Producto eliminado")}` +
      `&product=${encodeURIComponent(JSON.stringify(product))}`
  );
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌎 Servidor en http://localhost:${PORT}`);
});
