const axios = require('axios');
require('dotenv').config();
const { getAllProducts } = require ('../db');
const { rebuildDB } = require('../db/seedData');
const client = require('../db/client');
const { describe } = require('yargs');
const { token } = require('morgan');
const { createOrder, getOrdersByProduct } = require('../db/orders');

const { SERVER_ADDRESS = 'http://localhost:', PORT = 3000 } = process.env;
const API_URL = process.env.API_URL || SERVER_ADDRESS + PORT;

describe('API', () => {

    beforeAll(async() => {
        await rebuildDB();
      })
      afterAll(async() => {
        await client.end();
      })
      xit('responds to a request at /api/health with a message specifying it is healthy', async () => {
        try {
            const res = await axios.get(`${API_URL}/api/health`);
            expect(typeof res.data.message).toEqual('string');
    
        } catch(error) {
            console.error('Line 19', error)
        }
      });

    describe('Products', () => {
        let products;
        describe('GET /api/products', () => {
            beforeAll(async () => {
                try {
                    const { data } = await axios.get(`${API_URL}/api/products`);
                    products = data;
                } catch(error) {
                    console.error('Error on 31:', error)
                }

            });

            xit('Returns an array', () => {
                expect(Array.isArray(products)).toBe(true);
            });

            xit('Returns products from the database', () => {
                const [ product ] = products;
                expect(product.name).toBeDefined();
            });

        })

        describe('GET /api/products/:productId', () => {
            let firstProduct;
            beforeAll(async () => {
                const { data } = await axios.get(`${API_URL}/api/products/1`);
                firstProduct = data;
            });

            xit('Returns a product from the database', () => {
                expect(firstProduct.name).toBeDefined();
            });

            xit('Returns the correct product', () => {
                expect(firstProduct.id).toEqual(1);
            });
        })
    }); // END describe('Products')

    describe('Order_Products', ()=>{
        let newOrderProductTestVar = {orderId: 7, productId: 7, quantity:2};
        let oldOrderProductTestVar = {orderId: 4, productId: 4, quantity:1}

        describe('POST /orders/:orderId/products', ()=>{
            let newOrder;
            it('Adds a product to an order', async()=>{
                newOrder = await createOrder({creatorId: userId, name: 'test item'})
                const {data: response} = await axios.post(`
                    ${API_URL}/api/orders/${newOrderProductTestVar.orderId}/products`,
                    {orderId: newOrder.id, ...newOrderProductTestVar},
                    {headers: {'Authorization': `Bearer ${token}`}}
                )

                expect(response.orderId).toBe(newOrder.orderId);
                expect(response.productId).toBe(newOrderProductTestVar.productId)
            })
        });

        describe('PATCH /order_products/:orderProductId', ()=>{
            it('updates to order', async()=>{
                const {data: response} = await axios.patch(`
                ${API_URL}/api/order_products/${oldOrderProductTestVar.productId}`,
                    newOrderProductTestVar, 
                    {headers: {'Authorization': `Bearer ${token}`}} 
                );

                expect(response.quantity).toEqual(newOrderProductTestVar.quantity)
            })
        });

        describe('DELETE /order_products/:orderProductId', ()=>{
            it('removes product from order', async ()=>{
                const {data: deleteOrderProduct} = await axios.delete(`
                    ${API_URL}/api/order_products/${newOrderProductTestVar.productId}`,
                    {headers: {'Authorization': `Bearer ${token}`}}
                );
                const shouldBeDeleted = await getOrdersByProduct(deleteOrderProduct.id);
                expect(deleteOrderProduct.id).toBe(newOrderProductTestVar.id)
            })
        } )
    }) // END describe('Order_Products')
}); // END describe('API')