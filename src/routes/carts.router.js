import { Router } from 'express';
import cartModel from '../DAO/mongoManager/models/cart.model.js';

const router = Router();

// POST - Agregar nuevo carrito - OK
router.post('/', async (req, res) => {
    try {
        const productsCar = [];
        // Agregamos el carrito nuevo con create()
        const cartGenerated = await cartModel.create({products: productsCar});

        res.status(200).json({status: 'success', message: 'Carrito agregado con exito!!!', cartGenerated});
    } catch (e) {
        res.status(404).json({status: 'error', message: e.message});
    }
});

// GET - Listar los productos del carrito seleccionado - OK
router.get('/:cid', async (req, res) => {
    try {
        // Obtenemos el id que viene como parametro
        let cid = req.params.cid;

        const cartFound = await cartModel.findOne({_id: cid});

        // Verificamos que el carrito exista
        if(!cartFound) throw {message: 'NOT FOUND: Carrito no encontrado'};

        // Si si existe lo retornamos
        res.status(200).json(cartFound.products);
    } catch (e) {
        res.status(404).json({status: 'error', message: e.message});
    }
});

// GET - Agregar producto al array de productos del carrito indicado - OK
router.get('/:cid/product/:pid', async (req, res) => {
    try {
        // Obtenemos los parametros del endpoint
        let cid = req.params.cid;
        let pid = req.params.pid;
        let quantity = parseInt(req.query.quantity) || 1;

        // Obtenemos el documento deseado de la BD
        const cart = await cartModel.findById(cid);

        if (!cart) throw {message: 'NOT FOUND'};

        // Verificamos si el producto ya existe en el carrito para solo actualizar la cantidad
        let result = false;
        let cantEx = cart.products.find(prod => {
            result = prod.product._id.toString() === pid;
            return result;
        });

        if(result){
            quantity += cantEx.quantity;
            // Actualizamos el producto del carrito. Utilizamos varias validaciones con MongoDB
            if(!await cartModel.updateOne({_id: {$eq: cid}}, {$set: {"products.$[prods].quantity": quantity}}, {arrayFilters: [{"prods.product": {$eq: pid}}]})) throw {message: 'NOT FOUND'};
        } else {
            // Agregamos el producto al carrito
            if(!cart.products.push({product: pid, quantity: quantity})) throw {message: 'NOT FOUND'} // Population
            // Guardamos lo cambios en el carrito
            cart.save();
        }

        res.status(200).json({status: 'success', message: `Carrito ${cart._id} - Producto: ${pid}`});
    } catch (e) {
        res.status(404).json({status: 'error', message: e.message});
    }
});

// DELETE - Eliminar Producto de Carrito por ID - OK
router.delete('/:cid/products/:pid', async (req, res) => {
    try {
        // Tomar el id pasado como parametro
        const cid = req.params.cid; // ID Carrito
        const pid = req.params.pid; // ID Producto a eliminar del carrito
        // Eliminar Producto de Carrito si existe
        const result = await cartModel.updateMany({_id: cid,},{$pull: {products: {product: pid}}});

        // Validamos que exista el carrito y eliminamos el producto por id
        if(result.modifiedCount <= 0) throw {message: 'NOT FOUND'}

        res.status(200).json({status: 'success', message: 'Producto eliminado con exito!!!'});
    } catch (e) {
        res.status(404).json({status: 'error', message: e.message});
    }
});

// DELETE - Eliminar Todos los productos de un carrito - OK
router.delete('/:cid', async (req, res) => {
    try {
        // Tomar el id pasado como parametro
        const cid = req.params.cid; // ID Carrito

        // Eliminar Productos de Carrito si existe
        const result = await cartModel.findByIdAndUpdate({_id: cid}, {$set: {products: []}});

        // Validamos que exista el carrito y eliminamos el producto por id
        if(result.modifiedCount <= 0) throw {message: 'NOT FOUND'}

        res.status(200).json({status: 'success', message: 'Productos eliminados con exito!!!'});
    } catch (e) {
        res.status(404).json({status: 'error', message: e.message});
    }
});

// DELETE - Eliminar Carrito por ID - OK
// router.delete('/:cid', async (req, res) => {
//     try {
//         // Tomar el id pasado como parametro
//         const cid = req.params.cid; // ID Carrito

//         if(!await cartModel.deleteOne({_id: cid})) throw {message: 'NOT FOUND'}

//         res.status(200).json({status: 'success', message: 'Producto eliminado en exito!!!'});
//     } catch (e) {
//         res.status(404).json({status: 'error', message: e.message});
//     }
// });

// PUT - Actualizar el carrito en base a un arreglo nuevo - OK
router.put('/:cid', async (req, res) => {
    try {
        // Obtenemos los parametros del endpoint
        let cid = req.params.cid;
        // Tomamos los datos a actualizar del objeto obtenido por parametro
        const products = req.body;
        console.log(products);

        // Obtenemos el documento deseado de la BD
        const cart = await cartModel.findById(cid);

        if (!cart) throw {message: 'NOT FOUND'};

        // Agregamos los productos al carrito
        for (let i = 0; i < products.length; i++) {
            if(!cart.products.push(products[i])) throw {message: 'NOT FOUND'}
        }
        // Guardamos lo cambios en el carrito
        cart.save();

        res.status(200).json({status: 'success', message: `Carrito ${cart._id} actualizado`});
    } catch (e) {
        res.status(404).json({status: 'error', message: e.message});
    }
});

// PUT - Actualizar solo la cantidad de un producto - OK
router.put('/:cid/products/:pid', async (req, res) => {
    try {
        // Obtenemos los parametros del endpoint
        let cid = req.params.cid;
        let pid = req.params.pid;
        let quantity = parseInt(req.body.quantity);

        // Obtenemos el documento deseado de la BD
        const cart = await cartModel.findById(cid);

        if (!cart) throw {message: 'NOT FOUND'};

        // Verificamos si el producto ya existe en el carrito para solo actualizar la cantidad
        let result = false;
        let cantEx = cart.products.find(prod => {
            result = prod.product._id.toString() === pid;
            return result;
        });

        if(result){
            // Actualizamos el producto del carrito. Utilizamos varias validaciones con MongoDB
            if(!await cartModel.updateOne({_id: {$eq: cid}}, {$set: {"products.$[prods].quantity": quantity}}, {arrayFilters: [{"prods.product": {$eq: pid}}]})) throw {message: 'NOT FOUND'};
        }

        res.status(200).json({status: 'success', message: `Carrito ${cart._id} - Producto: ${pid}`});
    } catch (e) {
        res.status(404).json({status: 'error', message: e.message});
    }
});

export default router;