const client = require(`./client`)

async function getProductById(id) {
  try {
    const { rows: [product] } = await client.query(
      `
            SELECT *
            FROM products
            WHERE id=$1;
        `, [id]
    );

    return product;
  } catch (error) {
    throw error;
  };
};

async function getAllProducts() {
  try {
    const { rows } = await client.query(`
            SELECT *
            FROM products;
        `);
    return rows;
  } catch (error) {
    throw error;
  };
};

async function createProduct({ name, description, price, imageURL, inStock, category }) {
    
    const productToCreate = {
        name: name,
        description: description,
        price: price,
        imageURL: '',
        inStock: inStock,
        category: category,
    };

    if (imageURL) {
        productToCreate.imageURL = imageURL;
    };

    try {
        const { rows: [product] } = await client.query(
        `
            INSERT INTO products(name, description, price, imageURL, inStock, category)
            VALUES($1, $2, $3, $4, $5, $6)
            ON CONFLICT (name) DO NOTHING
            RETURNING *;
        `, [name, description, price, imageURL, inStock, category]);
        
        return product;
    } catch (error) {
        throw error;
    };
};
