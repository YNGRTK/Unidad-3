const express = require('express');
const app = express();
const port = 3000;
const db = require('./firebase'); // Importa la conexión a Firebase
const { messaging } = require('firebase-admin');
app.use(express.json()); // se usa  JSON para leer las solicitudes entrantes
const collection = db.collection('Productos'); // se define la colección de productos

// ruta para ver los productos
app.get('/Productos', async (req, res) => {
  try {
    const snapshot = await db.collection('Productos').get();
    const productos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

// ruta para traer un producto por id
app.get('/Productos/:id', async (req, res) => {
  try { 
    const id = req.params.id; // se obtiene el ID del producto de los parámetros de la ruta
    const doc = await db.collection('Productos').doc(id).get(); // se obtiene el documento del producto por ID
    if(!doc.exists) {
      return res.status(404).json({ message: 'Producto no encontrado' }); // se envía una respuesta de error si el producto no existe
    }
    res.json({
      id: doc.id,
      ...doc.data()
    }); // se envía el producto como respuesta en formato JSON
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ message: 'Error al obtener producto' }); // se envía una respuesta de error en caso de fallo
  }
});

// ruta para agregar un nuevo producto
app.post('/Productos', async (req, res) => {
  try {
    const { nombre, precio, categoria, stock } = req.body;
    const docRef = await db.collection('Productos').add({
      nombre,
      precio,
      categoria,
      stock,
      fecha: new Date() // se agrega la fecha del servidor
    }); // se agrega un nuevo producto a la colección
    res.json({
      message: 'Producto agregado exitosamente',
      id: docRef.id
    }); // se envía la respuesta con el ID del nuevo producto
  } catch (error) {
    console.error('Error al agregar producto:', error);
    res.status(500).json({ message: 'Error al agregar producto' }); // se envía una respuesta de error en caso de fallo
  }
});

//Actualizar producto
app.put('/Productos/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const docRef = db.collection('Productos').doc(id);
    const doc = await docRef.get();
    if (!doc.exists)
      return res.status(404).json({ message: 'Producto no encontrado' });
    const { nombre, precio, categoria, stock } = req.body;
    await docRef.update({
      ...(nombre !== undefined && { nombre }),
      ...(precio !== undefined && { precio }),
      ...(categoria !== undefined && { categoria }),
      ...(stock !== undefined && { stock }),
      fechaActualizacion: new Date()
    });
    res.json({ message: 'Producto actualizado exitosamente', id });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
});

//Eliminar producto
app.delete('/Productos/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const docRef = db.collection('Productos').doc(id);
    const doc = await docRef.get();
    if (!doc.exists)
      return res.status(404).json({ message: 'Producto no encontrado' });
    // Eliminar relaciones en VentasProductos
    const relSnap = await db.collection('VentasProductos')
      .where('IDproducto', '==', id).get();
    const batch = db.batch();
    relSnap.docs.forEach(d => batch.delete(d.ref));
    batch.delete(docRef);
    await batch.commit();
    res.json({ message: 'Producto y sus relaciones eliminados', id });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
});

//Ruta para ver las ventas
app.get('/Ventas', async (req, res) => {
  try {
    const snapshot = await db.collection('Ventas').get();
    const ventas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ message: 'Error al obtener ventas' });
  }
});

//Ruta para traer una venta por id
app.get('/Ventas/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await db.collection('Ventas').doc(id).get();
    if(!doc.exists) {
      return res.status(404).json({ message: ' Venta no encontrada '});
    }
    res.json({
      id: doc.id,
      ...doc.data()
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ message: 'Error al obtener venta' });
  }
});

//Ruta para agregar una nueva venta
app.post('/Ventas', async (req, res) => {
  try {
    const { Cantidad, DetallesVenta, FechaVenta, PrecioUnitario, ProductoID, TotalVenta } = req.body;
    const docRef = await db.collection('Ventas').add({
      Cantidad,
      DetallesVenta,
      FechaVenta,
      PrecioUnitario,
      ProductoID,
      TotalVenta,
      fecha: new Date()
    });
    res.status(201).json({
      message: 'Venta creada exitosamente',
      id: docRef.id
    });
  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({ message: 'Error al crear venta' });
  }
});

//Actualizar una venta
app.put('/Ventas/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const docRef = db.collection('Ventas').doc(id);
    const doc = await docRef.get();
    if (!doc.exists)
      return res.status(404).json({ message: 'Venta no encontrada' });
    const { Cantidad, DetallesVenta, FechaVenta,
            PrecioUnitario, ProductoID, TotalVenta } = req.body;
    await docRef.update({
      ...(Cantidad !== undefined && { Cantidad }),
      ...(DetallesVenta !== undefined && { DetallesVenta }),
      ...(FechaVenta !== undefined && { FechaVenta }),
      ...(PrecioUnitario !== undefined && { PrecioUnitario }),
      ...(ProductoID !== undefined && { ProductoID }),
      ...(TotalVenta !== undefined && { TotalVenta }),
      fechaActualizacion: new Date()
      });
    res.json({ message: 'Venta actualizada exitosamente', id });
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    res.status(500).json({ message: 'Error al actualizar venta' });
  }
});

//Eliminar una venta
app.delete('/Ventas/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const docRef = db.collection('Ventas').doc(id);
    const doc = await docRef.get();
    if (!doc.exists)
      return res.status(404).json({ message: 'Venta no encontrada' });
    // Eliminar relaciones en VentasProductos
    const relSnap = await db.collection('VentasProductos')
      .where('IDventa', '==', id).get();
    const batch = db.batch();
    relSnap.docs.forEach(d => batch.delete(d.ref));
    batch.delete(docRef);
    await batch.commit();
    res.json({ message: 'Venta y sus relaciones eliminadas', id });
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    res.status(500).json({ message: 'Error al eliminar venta' });
  }
});

//Ver todas las relaciones de ventas con productos
app.get('/ventasproductos', async (req, res) => {
    const snapshot = await db.collection('VentasProductos').get();
    const ventasproductos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    res.json(ventasproductos);
});

//Ver ventas de un producto
app.get('/productos/:id/Ventas', async (req, res) => {
    try {
        const id = req.params.id;
        const doc = await db.collection('Productos').doc(id).get();
        if (!doc.exists)
            return res.status(404).json({ message: 'Producto no encontrado' });
        const snapshot = await db.collection('VentasProductos')
            .where('IDproducto', '==', id)
            .get();
        const relaciones = snapshot.docs.map((doc) => ({
            IDventa: doc.data().IDventa,
            cantidad: doc.data().cantidad
        }));
        const Ventas = await Promise.all(
            relaciones.map(async (relacion) => {                                      
                const ventaDoc = await db.collection('Ventas').doc(relacion.IDventa).get(); 
                if (!ventaDoc.exists) return null;
                return {
                    id: ventaDoc.id,
                    ...ventaDoc.data(),
                    cantidad: relacion.cantidad
                };
            }));
        res.json({
            producto: { id: doc.id, ...doc.data() },
            Ventas
        });
    } catch (error) {
        console.error('Error al obtener las ventas del producto', error);
        res.status(500).json({ message: 'Error al obtener las ventas del producto' });
    }
});


//Ver productos de una venta
app.get('/Ventas/:id/productos', async (req, res) => {
    try {
        const id = req.params.id;
        const doc = await db.collection('Ventas').doc(id).get();
        if (!doc.exists)
            return res.status(404).json({ message: 'Venta no encontrada' });
        const snapshot = await db.collection('VentasProductos')
            .where('IDventa', '==', id)
            .get();
        const relaciones = snapshot.docs.map((doc) => ({
            IDproducto: doc.data().IDproducto,
            cantidad: doc.data().cantidad
        }));
        const productos = await Promise.all(
            relaciones.map(async (relacion) => {                                      
                const productoDoc = await db.collection('Productos').doc(relacion.IDproducto).get(); 
                if (!productoDoc.exists) return null;
                return {
                    id: productoDoc.id,
                    ...productoDoc.data(),
                    cantidad: relacion.cantidad
                };
            }));
        res.json({
            Venta: { id: doc.id, ...doc.data() },
            productos
        });
    } catch (error) {
        console.error('Error al obtener los productos de la venta', error);
        res.status(500).json({ message: 'Error al obtener los productos de la venta' });
    }
});

//Crear relacion ventas-productos
app.post('/ventasproductos', async (req, res) => {
  try {
    const { IDventa, IDproducto, cantidad } = req.body;
    // Validar que existan ambos documentos
    const [ventaDoc, productoDoc] = await Promise.all([
      db.collection('Ventas').doc(IDventa).get(),
      db.collection('Productos').doc(IDproducto).get()
    ]);
    if (!ventaDoc.exists)
      return res.status(404).json({ message: 'Venta no encontrada' });
    if (!productoDoc.exists)
      return res.status(404).json({ message: 'Producto no encontrado' });
    const docRef = await db.collection('VentasProductos').add({
      IDventa, IDproducto, cantidad,
      fecha: new Date()
    });
    res.status(201).json({
      message: 'Relación creada exitosamente', id: docRef.id
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear relación' });
  }
});

//Actualizar ventas-productos
app.put('/ventasproductos/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { cantidad } = req.body;
    const docRef = db.collection('VentasProductos').doc(id);
    const doc = await docRef.get();
    if (!doc.exists)
      return res.status(404).json({ message: 'Relación no encontrada' });
    await docRef.update({ cantidad, fechaActualizacion: new Date() });
    res.json({ message: 'Cantidad actualizada exitosamente', id });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar relación' });
  }
});

//Eliminar ventas-productos
app.delete('/ventasproductos/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const docRef = db.collection('VentasProductos').doc(id);
    const doc = await docRef.get();
    if (!doc.exists)
      return res.status(404).json({ message: 'Relación no encontrada' });
    await docRef.delete();
    res.json({ message: 'Relación eliminada exitosamente', id });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar relación' });
  }
});

app.get('/', (req, res) => {
  res.send('¡Servidor Node.js funcionando!');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});