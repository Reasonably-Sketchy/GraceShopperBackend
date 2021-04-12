const express = require('express');
const orderProductsRouter = express.Router();
const {requireUser, requiredNotSent} = require("./utils");
const jwt = require("jsonwebtoken");
const {
    getAllOrders,
    getOrderById,
    getOrdersByUser,
    getCartByUser,
    client,
    getAllProducts,
    getOrderProductById,
    updateOrderProduct
} = require('../db');
const productsRouter = require('./products');

orderProductsRouter.use((req, res, next) => {
    console.log("A request is being made to /order_products...");
    next();
  });

orderProductsRouter.get('/', async (req, res, next)=>{
    try { 
        const orders = await getAllOrders();
        
        res.send(orders)
    } catch ({name, message}) {
        next({name, message});
    } 
});

orderProductsRouter.patch('/:orderProductId', 
    requireUser,
    requiredNotSent({requiredParams: ['price', 'quantity']}),
    async (req, res, next) => {
        try {
            const { price, quantity } = req.body
            const { orderProductId } = req.params;
            const orderProductUpdate = await getOrderProductById(orderProductId);
            if(!orderProductUpdate) {
                next({
                    name: 'NotFound',
                    message: `No order_product found by ID ${orderProductId}`
                })
            } else {
                const updatedOrderProduct = await updateOrderProduct({id: req.params.orderProductId, price, quantity})
                res.send(updatedOrderProduct)
            }

        } catch (error) {
            next(error)
        }
});

orderProductsRouter.delete('/:orderProductId', requireUser, async(req, res, next)=>{
    try {
        const deleteRoutineActivity = await destroyOrderProduct(req.params.orderProductId)
        res.send({success: true, ...deleteRoutineActivity});
    } catch (error) {
        next(error)
    }
});

module.exports = orderProductsRouter;