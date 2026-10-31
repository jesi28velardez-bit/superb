/* =========================================================
   REGISTRO DE IA
   (Completá acá el registro de uso de IA de tu proyecto:
   herramienta, fecha, qué se pidió y qué se usó del resultado.)
   ========================================================= */

"use strict";

/* =========================================================
   1. DATOS Y PERSISTENCIA
   ========================================================= */

const CLAVE_STORAGE = "stock-datos";

// Arrays principales del sistema
let categorias = [];  // { id, nombre }
let productos = [];   // { id, codigo, nombre, categoriaId, unidad, precio, stockInicial, stockMinimo, stock }
let movimientos = []; // { id, codigo, tipo, motivo, cantidad, fecha, observacion }

// Datos de ejemplo (se cargan solo si no hay nada guardado)
const CATEGORIAS_INICIALES = [
  { id: "cat-almacen",  nombre: "Almacén" },
  { id: "cat-lacteos",  nombre: "Lácteos" },
  { id: "cat-limpieza", nombre: "Limpieza" },
  { id: "cat-bebidas",  nombre: "Bebidas" }
];

// Códigos de 13 dígitos (EAN-13) que empiezan con 779
const PRODUCTOS_INICIALES = [
  { id: "prod-1", codigo: "7791000001014", nombre: "Arroz largo fino 1 kg",     categoriaId: "cat-almacen",  unidad: "unidad", precio: 1850, stockInicial: 40, stockMinimo: 10 },
  { id: "prod-2", codigo: "7791000002028", nombre: "Fideos tirabuzón 500 g",    categoriaId: "cat-almacen",  unidad: "unidad", precio: 1200, stockInicial: 6,  stockMinimo: 15 },
  { id: "prod-3", codigo: "7792000001035", nombre: "Leche entera 1 L",          categoriaId: "cat-lacteos",  unidad: "l",      precio: 1450, stockInicial: 60, stockMinimo: 20 },
  { id: "prod-4", codigo: "7792000002049", nombre: "Yogur natural 1 kg",        categoriaId: "cat-lacteos",  unidad: "unidad", precio: 2300, stockInicial: 0,  stockMinimo: 8  },
  { id: "prod-5", codigo: "7792000003053", nombre: "Queso cremoso",             categoriaId: "cat-lacteos",  unidad: "kg",     precio: 9800, stockInicial: 12, stockMinimo: 5  },
  { id: "prod-6", codigo: "7793000001063", nombre: "Lavandina 1 L",             categoriaId: "cat-limpieza", unidad: "l",      precio: 1100, stockInicial: 25, stockMinimo: 10 },
  { id: "prod-7", codigo: "7793000002077", nombre: "Detergente 750 ml",         categoriaId: "cat-limpieza", unidad: "unidad", precio: 2100, stockInicial: 4,  stockMinimo: 8  },
  { id: "prod-8", codigo: "7794000001084", nombre: "Gaseosa cola 2,25 L",       categoriaId: "cat-bebidas",  unidad: "unidad", precio: 2900, stockInicial: 48, stockMinimo: 12 }
];

function guardarDatos() {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify({ categorias, productos, movimientos }));
  } catch (error) {
    console.error("No se pudo guardar en localStorage:", error);
  }
}

function cargarDatos() {
  let datos = null;

  try {
    datos = JSON.parse(localStorage.getItem(CLAVE_STORAGE));
  } catch (error) {
    datos = null; // JSON dañado: se trata como "sin datos"
  }

  const hayDatos =
    datos &&
    Array.isArray(datos.categorias) &&
    Array.isArray(datos.productos) &&
    Array.isArray(datos.movimientos);

  if (hayDatos) {
    categorias = datos.categorias;
    productos = datos.productos;
    movimientos = datos.movimientos;
  } else {
    // Primera vez: se cargan los datos de ejemplo
    categorias = CATEGORIAS_INICIALES.map((c) => ({ ...c }));
    productos = PRODUCTOS_INICIALES.map((p) => ({ ...p, stock: p.stockInicial }));
    movimientos = [];
    guardarDatos();
  }
}

/* =========================================================
   2. UTILIDADES
   ========================================================= */

function crearId(prefijo) {
  return prefijo + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Para comparar nombres sin importar mayúsculas, tildes ni espacios sobrantes
function normalizar(texto) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* =========================================================
   3. CATEGORÍAS: VALIDACIÓN
   ========================================================= */

// Devuelve un mensaje de error, o "" si el nombre es válido
function validarNombreCategoria(nombre, idExcluido) {
  if (nombre.trim() === "") {
    return "El nombre de la categoría es obligatorio.";
  }

  const repetida = categorias.some(
    (c) => c.id !== idExcluido && normalizar(c.nombre) === normalizar(nombre)
  );

  if (repetida) {
    return "Ya existe una categoría con ese nombre.";
  }

  return "";
}

/* =========================================================
   4. CATEGORÍAS: INTERFAZ
   ========================================================= */

const formCategoria = document.getElementById("form-categoria");
const inputCategoria = document.getElementById("categoria-nombre");
const btnGuardarCategoria = document.getElementById("btn-guardar-categoria");
const listaCategorias = document.getElementById("lista-categorias");

let categoriaEditandoId = null;

// Botón "Cancelar" que solo se ve mientras se edita (type="reset" para reutilizar el estilo)
const btnCancelarCategoria = document.createElement("button");
btnCancelarCategoria.type = "reset";
btnCancelarCategoria.id = "btn-cancelar-categoria";
btnCancelarCategoria.textContent = "Cancelar";
btnCancelarCategoria.hidden = true;
formCategoria.querySelector(".botones").appendChild(btnCancelarCategoria);

function contarProductosDeCategoria(categoriaId) {
  return productos.filter((p) => p.categoriaId === categoriaId).length;
}

function renderizarCategorias() {
  listaCategorias.innerHTML = "";

  categorias.forEach((categoria) => {
    const cantidad = contarProductosDeCategoria(categoria.id);

    const item = document.createElement("li");

    const nombre = document.createElement("strong");
    nombre.textContent = categoria.nombre;

    const detalle = document.createElement("span");
    detalle.className = "categoria-cantidad";
    detalle.textContent = cantidad === 1 ? "1 producto" : cantidad + " productos";

    const acciones = document.createElement("div");
    acciones.className = "acciones-item";

    const btnEditar = document.createElement("button");
    btnEditar.type = "button";
    btnEditar.dataset.accion = "editar";
    btnEditar.dataset.id = categoria.id;
    btnEditar.textContent = "✏️ Editar";

    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.className = "btn-peligro";
    btnEliminar.dataset.accion = "eliminar";
    btnEliminar.dataset.id = categoria.id;
    btnEliminar.textContent = "🗑️ Eliminar";

    acciones.append(btnEditar, btnEliminar);
    item.append(nombre, detalle, acciones);
    listaCategorias.appendChild(item);
  });
}

// Mantiene al día los desplegables de categoría del formulario y del filtro de productos
function renderizarSelectsDeCategorias() {
  ["producto-categoria", "filtro-categoria"].forEach((idSelect) => {
    const select = document.getElementById(idSelect);
    if (!select) return;

    const valorActual = select.value;

    // Se conserva la primera opción ("Seleccioná…" / "Todas")
    while (select.options.length > 1) {
      select.remove(1);
    }

    categorias.forEach((categoria) => {
      const opcion = document.createElement("option");
      opcion.value = categoria.id;
      opcion.textContent = categoria.nombre;
      select.appendChild(opcion);
    });

    // Se restaura la selección si la categoría todavía existe
    if (categorias.some((c) => c.id === valorActual)) {
      select.value = valorActual;
    }
  });
}

function refrescarTodo() {
  renderizarCategorias();
  renderizarSelectsDeCategorias();
  renderizarProductos(); // la tabla muestra el nombre de la categoría
  actualizarOpcionesDeProductos(); // lista de códigos y filtro de Movimientos
  actualizarInfoProducto();
  renderizarMovimientos();
  renderizarAlertas(); // también actualiza el contador del menú
}

function salirDeEdicionCategoria() {
  categoriaEditandoId = null;
  btnGuardarCategoria.textContent = "Agregar categoría";
  btnCancelarCategoria.hidden = true;
  inputCategoria.setCustomValidity("");
}

/* =========================================================
   5. CATEGORÍAS: ALTA, EDICIÓN Y BAJA
   ========================================================= */

// Alta y edición (según si hay una categoría en edición)
formCategoria.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const nombre = inputCategoria.value.trim();
  const error = validarNombreCategoria(nombre, categoriaEditandoId);

  if (error) {
    inputCategoria.setCustomValidity(error);
    inputCategoria.reportValidity();
    return;
  }

  if (categoriaEditandoId) {
    const categoria = categorias.find((c) => c.id === categoriaEditandoId);
    if (categoria) categoria.nombre = nombre;
  } else {
    categorias.push({ id: crearId("cat"), nombre });
  }

  guardarDatos();
  refrescarTodo();
  formCategoria.reset(); // dispara el evento "reset", que sale del modo edición
});

// Al escribir se limpia el mensaje de error
inputCategoria.addEventListener("input", () => inputCategoria.setCustomValidity(""));

// El botón Cancelar (reset) también sale del modo edición
formCategoria.addEventListener("reset", salirDeEdicionCategoria);

// Botones Editar / Eliminar de cada categoría
listaCategorias.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;

  const categoria = categorias.find((c) => c.id === boton.dataset.id);
  if (!categoria) return;

  if (boton.dataset.accion === "editar") {
    categoriaEditandoId = categoria.id;
    inputCategoria.value = categoria.nombre;
    inputCategoria.setCustomValidity("");
    btnGuardarCategoria.textContent = "Guardar cambios";
    btnCancelarCategoria.hidden = false;
    inputCategoria.focus();
    return;
  }

  if (boton.dataset.accion === "eliminar") {
    const cantidad = contarProductosDeCategoria(categoria.id);

    // Regla: no se puede borrar una categoría con productos
    if (cantidad > 0) {
      alert(
        'No se puede eliminar "' + categoria.nombre + '": tiene ' +
        cantidad + (cantidad === 1 ? " producto asociado." : " productos asociados.")
      );
      return;
    }

    if (!confirm('¿Eliminar la categoría "' + categoria.nombre + '"?')) return;

    categorias = categorias.filter((c) => c.id !== categoria.id);

    if (categoriaEditandoId === categoria.id) {
      formCategoria.reset();
    }

    guardarDatos();
    refrescarTodo();
  }
});

/* =========================================================
   6. PRODUCTOS
   ========================================================= */

const formProducto = document.getElementById("form-producto");
const campos = {
  codigo: document.getElementById("producto-codigo"),
  nombre: document.getElementById("producto-nombre"),
  categoria: document.getElementById("producto-categoria"),
  unidad: document.getElementById("producto-unidad"),
  precio: document.getElementById("producto-precio"),
  stockInicial: document.getElementById("producto-stock-inicial"),
  stockMinimo: document.getElementById("producto-stock-minimo")
};
const labelStockInicial = document.querySelector('label[for="producto-stock-inicial"]');
const btnGuardarProducto = document.getElementById("btn-guardar-producto");
const buscadorProductos = document.getElementById("buscador-productos");
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroEstado = document.getElementById("filtro-estado");
const tbodyProductos = document.getElementById("tbody-productos");

let productoEditandoId = null;

const formatoPrecio = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

const TEXTO_ESTADO = { "sin-stock": "Sin stock", bajo: "Bajo", ok: "Normal" };

// "sin-stock" si es 0, "bajo" si es <= mínimo, "ok" en otro caso
function calcularEstado(producto) {
  if (producto.stock <= 0) return "sin-stock";
  if (producto.stock <= producto.stockMinimo) return "bajo";
  return "ok";
}

/* ---------- Validación ---------- */

function esEnteroNoNegativo(texto) {
  return /^\d+$/.test(texto.trim());
}

// Devuelve { campo, mensaje } con el primer error, o null si todo está bien
function validarProducto() {
  const codigo = campos.codigo.value.trim();

  if (!/^\d{8,13}$/.test(codigo)) {
    return { campo: campos.codigo, mensaje: "El código debe tener entre 8 y 13 dígitos numéricos." };
  }

  if (productos.some((p) => p.id !== productoEditandoId && p.codigo === codigo)) {
    return { campo: campos.codigo, mensaje: "Ya existe un producto con ese código." };
  }

  if (campos.nombre.value.trim() === "") {
    return { campo: campos.nombre, mensaje: "El nombre es obligatorio." };
  }

  if (campos.categoria.value === "") {
    return { campo: campos.categoria, mensaje: "Elegí una categoría." };
  }

  if (campos.unidad.value === "") {
    return { campo: campos.unidad, mensaje: "Elegí una unidad." };
  }

  const precio = Number(campos.precio.value);
  if (campos.precio.value.trim() === "" || !(precio > 0)) {
    return { campo: campos.precio, mensaje: "El precio debe ser mayor que cero." };
  }

  // Al editar, el stock inicial está bloqueado y no se valida
  if (!productoEditandoId && !esEnteroNoNegativo(campos.stockInicial.value)) {
    return { campo: campos.stockInicial, mensaje: "El stock inicial debe ser un entero mayor o igual a 0." };
  }

  if (!esEnteroNoNegativo(campos.stockMinimo.value)) {
    return { campo: campos.stockMinimo, mensaje: "El stock mínimo debe ser un entero mayor o igual a 0." };
  }

  return null;
}

// Al tocar un campo se limpia su mensaje de error
Object.values(campos).forEach((campo) => {
  ["input", "change"].forEach((evento) =>
    campo.addEventListener(evento, () => campo.setCustomValidity(""))
  );
});

/* ---------- Listado ---------- */

function productosFiltrados() {
  const textoNormalizado = normalizar(buscadorProductos.value);
  const textoCodigo = buscadorProductos.value.trim();

  return productos.filter((p) => {
    const coincideTexto =
      textoNormalizado === "" ||
      normalizar(p.nombre).includes(textoNormalizado) ||
      p.codigo.includes(textoCodigo);
    const coincideCategoria = filtroCategoria.value === "" || p.categoriaId === filtroCategoria.value;
    const coincideEstado = filtroEstado.value === "" || calcularEstado(p) === filtroEstado.value;

    return coincideTexto && coincideCategoria && coincideEstado;
  });
}

function crearCelda(texto) {
  const celda = document.createElement("td");
  celda.textContent = texto;
  return celda;
}

function renderizarProductos() {
  tbodyProductos.innerHTML = "";

  const lista = productosFiltrados();

  if (lista.length === 0) {
    const fila = document.createElement("tr");
    const celda = crearCelda(
      productos.length === 0
        ? "Todavía no hay productos cargados."
        : "No hay productos que coincidan con la búsqueda."
    );
    celda.colSpan = 8;
    fila.appendChild(celda);
    tbodyProductos.appendChild(fila);
    return;
  }

  lista.forEach((producto) => {
    const categoria = categorias.find((c) => c.id === producto.categoriaId);
    const estado = calcularEstado(producto);

    const fila = document.createElement("tr");

    // Estado con su indicador de color
    const celdaEstado = document.createElement("td");
    const insignia = document.createElement("span");
    insignia.className = "estado estado-" + estado;
    insignia.textContent = TEXTO_ESTADO[estado];
    celdaEstado.appendChild(insignia);

    // Acciones
    const celdaAcciones = document.createElement("td");

    const btnEditar = document.createElement("button");
    btnEditar.type = "button";
    btnEditar.dataset.accion = "editar";
    btnEditar.dataset.id = producto.id;
    btnEditar.textContent = "✏️ Editar";

    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.className = "btn-peligro";
    btnEliminar.dataset.accion = "eliminar";
    btnEliminar.dataset.id = producto.id;
    btnEliminar.textContent = "🗑️ Eliminar";

    const contenedorAcciones = document.createElement("div");
    contenedorAcciones.className = "acciones-item";
    contenedorAcciones.append(btnEditar, btnEliminar);
    celdaAcciones.appendChild(contenedorAcciones);

    fila.append(
      crearCelda(producto.codigo),
      crearCelda(producto.nombre),
      crearCelda(categoria ? categoria.nombre : "—"),
      crearCelda(formatoPrecio.format(producto.precio)),
      crearCelda(producto.stock + " " + producto.unidad),
      crearCelda(producto.stockMinimo),
      celdaEstado,
      celdaAcciones
    );

    tbodyProductos.appendChild(fila);
  });
}

[buscadorProductos].forEach((el) => el.addEventListener("input", renderizarProductos));
[filtroCategoria, filtroEstado].forEach((el) => el.addEventListener("change", renderizarProductos));

/* ---------- Alta y edición ---------- */

function salirDeEdicionProducto() {
  productoEditandoId = null;
  campos.stockInicial.disabled = false;
  labelStockInicial.textContent = "Stock inicial";
  btnGuardarProducto.textContent = "Guardar producto";
  Object.values(campos).forEach((campo) => campo.setCustomValidity(""));
}

formProducto.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const error = validarProducto();
  if (error) {
    error.campo.setCustomValidity(error.mensaje);
    error.campo.reportValidity();
    return;
  }

  const codigo = campos.codigo.value.trim();

  const datos = {
    codigo,
    nombre: campos.nombre.value.trim(),
    categoriaId: campos.categoria.value,
    unidad: campos.unidad.value,
    precio: Number(campos.precio.value),
    stockMinimo: Number(campos.stockMinimo.value)
  };

  if (productoEditandoId) {
    const producto = productos.find((p) => p.id === productoEditandoId);

    if (producto) {
      // Si cambió el código, el historial de movimientos lo sigue
      if (producto.codigo !== codigo) {
        movimientos.forEach((m) => {
          if (m.codigo === producto.codigo) m.codigo = codigo;
        });
      }
      // El stock actual y el stock inicial NO se tocan acá
      Object.assign(producto, datos);
    }
  } else {
    const stockInicial = Number(campos.stockInicial.value);
    productos.push({ id: crearId("prod"), ...datos, stockInicial, stock: stockInicial });
  }

  guardarDatos();
  refrescarTodo(); // actualiza también el contador de productos por categoría
  formProducto.reset();  // dispara "reset", que sale del modo edición
});

formProducto.addEventListener("reset", salirDeEdicionProducto);

/* ---------- Edición y baja desde la tabla ---------- */

function editarProducto(producto) {
  productoEditandoId = producto.id;

  campos.codigo.value = producto.codigo;
  campos.nombre.value = producto.nombre;
  campos.categoria.value = producto.categoriaId;
  campos.unidad.value = producto.unidad;
  campos.precio.value = producto.precio;
  campos.stockMinimo.value = producto.stockMinimo;

  // El stock se modifica solo con movimientos
  campos.stockInicial.value = producto.stockInicial;
  campos.stockInicial.disabled = true;
  labelStockInicial.textContent = "Stock inicial (no editable)";

  btnGuardarProducto.textContent = "Guardar cambios";
  formProducto.scrollIntoView({ behavior: "smooth", block: "start" });
  campos.nombre.focus({ preventScroll: true });
}

tbodyProductos.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;

  const producto = productos.find((p) => p.id === boton.dataset.id);
  if (!producto) return;

  if (boton.dataset.accion === "editar") {
    editarProducto(producto);
    return;
  }

  if (boton.dataset.accion === "eliminar") {
    const cantidadMovimientos = movimientos.filter((m) => m.codigo === producto.codigo).length;

    let mensaje = '¿Eliminar el producto "' + producto.nombre + '"?';
    if (cantidadMovimientos > 0) {
      mensaje += "\n\nSus " + cantidadMovimientos + " movimientos seguirán en el historial.";
    }

    if (!confirm(mensaje)) return;

    productos = productos.filter((p) => p.id !== producto.id);

    if (productoEditandoId === producto.id) {
      formProducto.reset();
    }

    guardarDatos();
    refrescarTodo();
  }
});

/* =========================================================
   7. MOVIMIENTOS
   ========================================================= */

const formMovimiento = document.getElementById("form-movimiento");
const camposMov = {
  codigo: document.getElementById("movimiento-codigo"),
  tipo: document.getElementById("movimiento-tipo"),
  motivo: document.getElementById("movimiento-motivo"),
  cantidad: document.getElementById("movimiento-cantidad"),
  fecha: document.getElementById("movimiento-fecha"),
  observacion: document.getElementById("movimiento-observacion")
};
const infoProducto = document.getElementById("movimiento-info");
const listaCodigos = document.getElementById("lista-codigos");
const filtroMovimientosProducto = document.getElementById("filtro-movimientos-producto");
const tbodyMovimientos = document.getElementById("tbody-movimientos");

/* ---------- Fechas ---------- */

// Fecha de hoy (hora local) en formato AAAA-MM-DD
function fechaHoy() {
  const ahora = new Date();
  return (
    ahora.getFullYear() + "-" +
    String(ahora.getMonth() + 1).padStart(2, "0") + "-" +
    String(ahora.getDate()).padStart(2, "0")
  );
}

// Comprueba formato AAAA-MM-DD y que el día exista (no 2025-02-31)
function esFechaValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;

  const [anio, mes, dia] = texto.split("-").map(Number);
  if (anio < 1900) return false;

  const fecha = new Date(anio, mes - 1, dia);
  return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
}

function formatearFecha(texto) {
  const [anio, mes, dia] = texto.split("-");
  return dia + "/" + mes + "/" + anio;
}

// La fecha arranca en "hoy" y no admite fechas futuras
function prepararCampoFecha() {
  const hoy = fechaHoy();
  camposMov.fecha.max = hoy;
  camposMov.fecha.defaultValue = hoy; // así el "reset" también vuelve a hoy
  if (!camposMov.fecha.value) camposMov.fecha.value = hoy;
}

/* ---------- Producto según el código escrito ---------- */

function buscarProductoPorCodigo(codigo) {
  return productos.find((p) => p.codigo === codigo.trim());
}

function actualizarInfoProducto() {
  const codigo = camposMov.codigo.value.trim();

  infoProducto.className = "info-producto";

  if (codigo === "") {
    infoProducto.textContent = "";
    return;
  }

  const producto = buscarProductoPorCodigo(codigo);

  if (!producto) {
    infoProducto.textContent = "Producto no encontrado";
    infoProducto.classList.add("info-error");
    return;
  }

  infoProducto.textContent =
    producto.nombre + " · Stock actual: " + producto.stock + " " + producto.unidad;
  infoProducto.classList.add("info-ok");
}

// Sugerencias de códigos del formulario y filtro del historial
function actualizarOpcionesDeProductos() {
  listaCodigos.innerHTML = "";
  productos.forEach((producto) => {
    const opcion = document.createElement("option");
    opcion.value = producto.codigo;
    opcion.label = producto.nombre;
    listaCodigos.appendChild(opcion);
  });

  const valorActual = filtroMovimientosProducto.value;

  while (filtroMovimientosProducto.options.length > 1) {
    filtroMovimientosProducto.remove(1);
  }

  productos.forEach((producto) => {
    const opcion = document.createElement("option");
    opcion.value = producto.codigo;
    opcion.textContent = producto.nombre + " (" + producto.codigo + ")";
    filtroMovimientosProducto.appendChild(opcion);
  });

  if (productos.some((p) => p.codigo === valorActual)) {
    filtroMovimientosProducto.value = valorActual;
  }
}

camposMov.codigo.addEventListener("input", actualizarInfoProducto);

// Enter en el código: pasa el foco a cantidad (sin enviar el formulario)
camposMov.codigo.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") {
    evento.preventDefault();
    camposMov.cantidad.focus();
  }
});

/* ---------- Validación ---------- */

// Devuelve { error: { campo, mensaje } } o { producto, cantidad }
function validarMovimiento() {
  const producto = buscarProductoPorCodigo(camposMov.codigo.value);

  if (!producto) {
    return { error: { campo: camposMov.codigo, mensaje: "Producto no encontrado: ingresá un código existente." } };
  }

  const tipo = camposMov.tipo.value;
  if (tipo !== "entrada" && tipo !== "salida") {
    return { error: { campo: camposMov.tipo, mensaje: "Elegí el tipo de movimiento." } };
  }

  if (camposMov.motivo.value.trim() === "") {
    return { error: { campo: camposMov.motivo, mensaje: "El motivo es obligatorio." } };
  }

  const textoCantidad = camposMov.cantidad.value.trim();
  const cantidad = Number(textoCantidad);
  if (!/^\d+$/.test(textoCantidad) || cantidad <= 0) {
    return { error: { campo: camposMov.cantidad, mensaje: "La cantidad debe ser un entero mayor que cero." } };
  }

  const fecha = camposMov.fecha.value;
  if (!esFechaValida(fecha)) {
    return { error: { campo: camposMov.fecha, mensaje: "Ingresá una fecha válida." } };
  }
  if (fecha > fechaHoy()) {
    return { error: { campo: camposMov.fecha, mensaje: "La fecha no puede ser futura." } };
  }

  // Una salida no puede dejar el stock negativo
  if (tipo === "salida" && cantidad > producto.stock) {
    return {
      error: {
        campo: camposMov.cantidad,
        mensaje:
          "Stock insuficiente: hay " + producto.stock + " " + producto.unidad +
          " y la salida es de " + cantidad + "."
      }
    };
  }

  return { producto, cantidad };
}

// Al tocar un campo se limpia su mensaje de error
Object.values(camposMov).forEach((campo) => {
  ["input", "change"].forEach((evento) =>
    campo.addEventListener(evento, () => campo.setCustomValidity(""))
  );
});

/* ---------- Registro ---------- */

formMovimiento.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const resultado = validarMovimiento();

  if (resultado.error) {
    resultado.error.campo.setCustomValidity(resultado.error.mensaje);
    resultado.error.campo.reportValidity();
    return;
  }

  const { producto, cantidad } = resultado;
  const tipo = camposMov.tipo.value;

  // Entrada suma, salida resta
  producto.stock += tipo === "entrada" ? cantidad : -cantidad;

  movimientos.push({
    id: crearId("mov"),
    codigo: producto.codigo,
    tipo,
    motivo: camposMov.motivo.value.trim(),
    cantidad,
    fecha: camposMov.fecha.value,
    observacion: camposMov.observacion.value.trim()
  });

  guardarDatos();
  formMovimiento.reset();
  prepararCampoFecha();
  refrescarTodo(); // actualiza stock, estados, alertas e historial
  camposMov.codigo.focus();
});

formMovimiento.addEventListener("reset", () => {
  Object.values(camposMov).forEach((campo) => campo.setCustomValidity(""));
  // El reset vacía los campos después de este evento: se actualiza el aviso un instante después
  setTimeout(actualizarInfoProducto, 0);
});

/* ---------- Historial (del más nuevo al más viejo) ---------- */

function renderizarMovimientos() {
  tbodyMovimientos.innerHTML = "";

  const codigoFiltrado = filtroMovimientosProducto.value;

  // Se invierte el orden de carga y luego se ordena por fecha (el sort es estable),
  // así los de la misma fecha quedan del último cargado al primero
  const lista = [...movimientos]
    .reverse()
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .filter((m) => codigoFiltrado === "" || m.codigo === codigoFiltrado);

  if (lista.length === 0) {
    const fila = document.createElement("tr");
    const celda = crearCelda(
      movimientos.length === 0
        ? "Todavía no hay movimientos registrados."
        : "No hay movimientos para ese producto."
    );
    celda.colSpan = 7;
    fila.appendChild(celda);
    tbodyMovimientos.appendChild(fila);
    return;
  }

  lista.forEach((movimiento) => {
    const producto = productos.find((p) => p.codigo === movimiento.codigo);

    const celdaTipo = document.createElement("td");
    const etiquetaTipo = document.createElement("span");
    etiquetaTipo.className = "tipo-" + movimiento.tipo;
    etiquetaTipo.textContent = movimiento.tipo === "entrada" ? "Entrada" : "Salida";
    celdaTipo.appendChild(etiquetaTipo);

    const fila = document.createElement("tr");
    fila.append(
      crearCelda(formatearFecha(movimiento.fecha)),
      crearCelda(movimiento.codigo),
      crearCelda(producto ? producto.nombre : "(producto eliminado)"),
      celdaTipo,
      crearCelda(movimiento.motivo),
      crearCelda(movimiento.cantidad),
      crearCelda(movimiento.observacion || "—")
    );

    tbodyMovimientos.appendChild(fila);
  });
}

filtroMovimientosProducto.addEventListener("change", renderizarMovimientos);

/* =========================================================
   8. ALERTAS
   ========================================================= */

const listaAlertas = document.getElementById("lista-alertas");
const contadorAlertas = document.getElementById("contador-alertas");
const btnImprimirReposicion = document.getElementById("btn-imprimir-reposicion");
const tbodyReposicion = document.getElementById("tbody-reposicion");
const fechaImpresion = document.getElementById("fecha-impresion");

// Cantidad sugerida para pedir: el doble del mínimo menos el stock actual
function calcularCantidadSugerida(producto) {
  return Math.max(0, 2 * producto.stockMinimo - producto.stock);
}

// Productos sin stock (primero) y en el mínimo o por debajo, ordenados por urgencia
function calcularAlertas() {
  return productos
    .map((producto) => ({ producto, estado: calcularEstado(producto) }))
    .filter((alerta) => alerta.estado !== "ok")
    .sort((a, b) => {
      // 1) Sin stock antes que stock bajo
      const gravedadA = a.estado === "sin-stock" ? 0 : 1;
      const gravedadB = b.estado === "sin-stock" ? 0 : 1;
      if (gravedadA !== gravedadB) return gravedadA - gravedadB;

      // 2) Menor cobertura (stock / mínimo) primero; sin stock cuenta como 0
      const coberturaA = a.producto.stockMinimo > 0 ? a.producto.stock / a.producto.stockMinimo : 0;
      const coberturaB = b.producto.stockMinimo > 0 ? b.producto.stock / b.producto.stockMinimo : 0;
      if (coberturaA !== coberturaB) return coberturaA - coberturaB;

      // 3) Desempate: mayor mínimo (más demanda) primero, y luego por nombre
      if (a.producto.stockMinimo !== b.producto.stockMinimo) {
        return b.producto.stockMinimo - a.producto.stockMinimo;
      }
      return a.producto.nombre.localeCompare(b.producto.nombre, "es");
    });
}

function crearDato(etiqueta, valor) {
  const dato = document.createElement("span");
  dato.append(etiqueta + ": ");
  const negrita = document.createElement("strong");
  negrita.textContent = valor;
  dato.appendChild(negrita);
  return dato;
}

function renderizarAlertas() {
  const alertas = calcularAlertas();

  // El contador del menú siempre refleja la cantidad de alertas
  contadorAlertas.textContent = alertas.length;

  // Sin alertas no hay nada para reponer
  btnImprimirReposicion.disabled = alertas.length === 0;

  // Lista vacía: el mensaje "Todo el stock está en orden" lo muestra el CSS (:empty)
  listaAlertas.innerHTML = "";

  alertas.forEach(({ producto, estado }) => {
    const categoria = categorias.find((c) => c.id === producto.categoriaId);

    const item = document.createElement("li");
    item.className = "alerta-" + estado;

    // Datos del producto
    const info = document.createElement("div");
    info.className = "alerta-info";

    const insignia = document.createElement("span");
    insignia.className = "estado estado-" + estado;
    insignia.textContent = TEXTO_ESTADO[estado];

    const nombre = document.createElement("strong");
    nombre.textContent = producto.nombre;

    const codigo = document.createElement("span");
    codigo.className = "alerta-codigo";
    codigo.textContent = producto.codigo + (categoria ? " · " + categoria.nombre : "");

    info.append(insignia, nombre, codigo);

    // Stock actual, mínimo y cantidad sugerida
    const datos = document.createElement("div");
    datos.className = "alerta-datos";

    const pedido = document.createElement("span");
    pedido.className = "alerta-pedido";
    pedido.append("Sugerido a pedir: ");
    const cantidadPedido = document.createElement("strong");
    cantidadPedido.textContent = calcularCantidadSugerida(producto) + " " + producto.unidad;
    pedido.appendChild(cantidadPedido);

    datos.append(
      crearDato("Stock actual", producto.stock + " " + producto.unidad),
      crearDato("Mínimo", producto.stockMinimo),
      pedido
    );

    item.append(info, datos);
    listaAlertas.appendChild(item);
  });
}

/* ---------- Impresión de la lista de reposición ---------- */

function prepararHojaDeReposicion(alertas) {
  fechaImpresion.textContent = formatearFecha(fechaHoy());
  tbodyReposicion.innerHTML = "";

  alertas.forEach(({ producto }) => {
    const celdaProducto = document.createElement("td");
    celdaProducto.append(producto.nombre);

    const codigo = document.createElement("span");
    codigo.className = "producto-codigo-impresion";
    codigo.textContent = producto.codigo;
    celdaProducto.appendChild(codigo);

    const celdaCasillero = document.createElement("td");
    celdaCasillero.className = "col-pedido";
    const casillero = document.createElement("span");
    casillero.className = "casillero";
    celdaCasillero.appendChild(casillero);

    const fila = document.createElement("tr");
    fila.append(
      celdaProducto,
      crearCelda(calcularCantidadSugerida(producto) + " " + producto.unidad),
      celdaCasillero
    );
    tbodyReposicion.appendChild(fila);
  });
}

btnImprimirReposicion.addEventListener("click", () => {
  const alertas = calcularAlertas();

  if (alertas.length === 0) {
    alert("No hay productos para reponer.");
    return;
  }

  prepararHojaDeReposicion(alertas);

  // La clase hace que el CSS de impresión oculte el resto de la página
  document.body.classList.add("imprimiendo-reposicion");
  window.print();
});

// Al terminar (o cancelar) la impresión se vuelve a la página normal
window.addEventListener("afterprint", () => {
  document.body.classList.remove("imprimiendo-reposicion");
});

/* =========================================================
   9. EXPORTAR E IMPORTAR
   ========================================================= */

const btnExportar = document.getElementById("btn-exportar");
const btnImportar = document.getElementById("btn-importar");
const inputImportar = document.getElementById("archivo-importar");

/* ---------- Exportar ---------- */

function exportarDatos() {
  const datos = { categorias, productos, movimientos };
  const texto = JSON.stringify(datos, null, 2); // con sangría, para que sea legible

  // Blob + enlace temporal para disparar la descarga
  const blob = new Blob([texto], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "stock.json";
  document.body.appendChild(enlace); // algunos navegadores lo necesitan dentro del documento
  enlace.click();
  enlace.remove();

  URL.revokeObjectURL(url);
}

btnExportar.addEventListener("click", exportarDatos);

/* ---------- Importar: validación ---------- */

function esTextoNoVacio(valor) {
  return typeof valor === "string" && valor.trim() !== "";
}

function esNumeroEnteroNoNegativo(valor) {
  return Number.isInteger(valor) && valor >= 0;
}

function esObjeto(valor) {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}

// Devuelve un mensaje de error, o "" si el contenido es válido
function validarDatosImportados(datos) {
  if (!esObjeto(datos)) {
    return "El archivo no tiene el formato esperado (se esperaba un objeto con categorías, productos y movimientos).";
  }

  for (const lista of ["categorias", "productos", "movimientos"]) {
    if (!Array.isArray(datos[lista])) {
      return 'Falta la lista "' + lista + '" o no es una lista válida.';
    }
  }

  // Categorías
  const idsCategorias = new Set();
  const nombresCategorias = new Set();

  for (const [i, categoria] of datos.categorias.entries()) {
    if (!esObjeto(categoria) || !esTextoNoVacio(categoria.id) || !esTextoNoVacio(categoria.nombre)) {
      return "La categoría n.º " + (i + 1) + " está incompleta o dañada.";
    }
    if (idsCategorias.has(categoria.id)) {
      return 'Hay categorías repetidas (id "' + categoria.id + '").';
    }
    if (nombresCategorias.has(normalizar(categoria.nombre))) {
      return 'Hay categorías repetidas (nombre "' + categoria.nombre + '").';
    }
    idsCategorias.add(categoria.id);
    nombresCategorias.add(normalizar(categoria.nombre));
  }

  // Productos
  const idsProductos = new Set();
  const codigosProductos = new Set();

  for (const [i, producto] of datos.productos.entries()) {
    const posicion = "El producto n.º " + (i + 1);

    if (!esObjeto(producto) || !esTextoNoVacio(producto.id) || !esTextoNoVacio(producto.nombre) || !esTextoNoVacio(producto.unidad)) {
      return posicion + " está incompleto o dañado.";
    }
    if (typeof producto.codigo !== "string" || !/^\d{8,13}$/.test(producto.codigo)) {
      return posicion + " tiene un código inválido (debe tener de 8 a 13 dígitos).";
    }
    if (!idsCategorias.has(producto.categoriaId)) {
      return posicion + " ('" + producto.nombre + "') pertenece a una categoría que no está en el archivo.";
    }
    if (typeof producto.precio !== "number" || !(producto.precio > 0)) {
      return posicion + " tiene un precio inválido.";
    }
    if (
      !esNumeroEnteroNoNegativo(producto.stockInicial) ||
      !esNumeroEnteroNoNegativo(producto.stockMinimo) ||
      !esNumeroEnteroNoNegativo(producto.stock)
    ) {
      return posicion + " tiene un stock inválido (deben ser enteros mayores o iguales a 0).";
    }
    if (idsProductos.has(producto.id) || codigosProductos.has(producto.codigo)) {
      return "Hay productos repetidos (código " + producto.codigo + ").";
    }
    idsProductos.add(producto.id);
    codigosProductos.add(producto.codigo);
  }

  // Movimientos
  for (const [i, movimiento] of datos.movimientos.entries()) {
    const posicion = "El movimiento n.º " + (i + 1);

    if (!esObjeto(movimiento) || typeof movimiento.codigo !== "string" || !esTextoNoVacio(movimiento.motivo)) {
      return posicion + " está incompleto o dañado.";
    }
    if (movimiento.tipo !== "entrada" && movimiento.tipo !== "salida") {
      return posicion + ' tiene un tipo inválido (debe ser "entrada" o "salida").';
    }
    if (!Number.isInteger(movimiento.cantidad) || movimiento.cantidad <= 0) {
      return posicion + " tiene una cantidad inválida.";
    }
    if (typeof movimiento.fecha !== "string" || !esFechaValida(movimiento.fecha)) {
      return posicion + " tiene una fecha inválida.";
    }
  }

  return "";
}

/* ---------- Importar: lectura y reemplazo ---------- */

function mostrarErrorDeImportacion(mensaje) {
  alert("No se pudo importar el archivo.\n\n" + mensaje + "\n\nNo se modificó ningún dato.");
}

function reemplazarDatos(datos) {
  categorias = datos.categorias.map((c) => ({ id: c.id, nombre: c.nombre.trim() }));
  productos = datos.productos.map((p) => ({ ...p }));
  movimientos = datos.movimientos.map((m) => ({
    ...m,
    id: esTextoNoVacio(m.id) ? m.id : crearId("mov"),
    observacion: typeof m.observacion === "string" ? m.observacion : ""
  }));

  guardarDatos();

  // Se sale de cualquier edición en curso y se limpian los formularios
  formCategoria.reset();
  formProducto.reset();
  formMovimiento.reset();
  prepararCampoFecha();

  refrescarTodo(); // vuelve a dibujar categorías, productos, movimientos, alertas y contador
}

function procesarArchivoImportado(texto, nombreArchivo) {
  let datos;

  try {
    datos = JSON.parse(texto);
  } catch (error) {
    mostrarErrorDeImportacion("El archivo no es un JSON válido.");
    return;
  }

  const problema = validarDatosImportados(datos);
  if (problema) {
    mostrarErrorDeImportacion(problema);
    return;
  }

  const confirmado = confirm(
    'Vas a reemplazar TODOS los datos actuales por los del archivo "' + nombreArchivo + '".\n\n' +
    "Se importarán " + datos.categorias.length + " categorías, " +
    datos.productos.length + " productos y " +
    datos.movimientos.length + " movimientos.\n\n" +
    "Esta acción no se puede deshacer. ¿Continuar?"
  );

  if (!confirmado) return;

  reemplazarDatos(datos);
  alert("Importación completa.");
}

btnImportar.addEventListener("click", () => inputImportar.click());

inputImportar.addEventListener("change", () => {
  const archivo = inputImportar.files[0];
  if (!archivo) return;

  const lector = new FileReader();

  lector.onload = () => {
    procesarArchivoImportado(String(lector.result), archivo.name);
    inputImportar.value = ""; // permite volver a elegir el mismo archivo
  };

  lector.onerror = () => {
    mostrarErrorDeImportacion("No se pudo leer el archivo.");
    inputImportar.value = "";
  };

  lector.readAsText(archivo);
});

/* =========================================================
   10. INICIO
   ========================================================= */

cargarDatos();
prepararCampoFecha();
refrescarTodo();

// Registro del Service Worker (uso sin conexión). Requiere https o localhost.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("No se pudo registrar el Service Worker:", error);
    });
  });
}
