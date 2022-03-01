const cors = require("cors");
const express = require("express");
const app = express();
const multer = require("multer");
const objectId = require('mongodb').ObjectId
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 5000
const path = require("path")
const fs = require('fs');


const uri = `mongodb+srv://bicyledbnew:bicyledbnew321@cluster0.wanl6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

app.use(cors())
app.use(express.json())


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve(__dirname, 'uploads'))
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '_' + Date.now() + '_' + file.originalname)
    }
})


const uploads = multer({ storage: storage });

app.use(uploads.any());
app.use(express.static('./public'));


//if you need to download (after upload) files in cloudinary 
const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: 'df8velsbs',
    api_key: '917132773258831',
    api_secret: '-zx1wZ4y7XvPchfH3xw6EndBGik'
});

//if you need to del files after upload


async function upload(file) {
    const params = { public_id: `${Date.now()}`, resource_type: 'auto' }
    return cloudinary.uploader.upload(file.path, params);
}

// this promisify's fs.unlink (probably natively available in fs.promise)
async function unlink(file) {
    return new Promise((resolve, reject) => {
        fs.unlink(file.path, error => error ? reject(error) : resolve());
    });
}

// upload, then unlink if upload succeeds, return the url upload result
// catch errors here, so other concurrent uploads can continue
async function uploadAndUnlink(file) {
    try {
        const url = await upload(file);
        await unlink(file);
        return url
    } catch (err) {
        console.log(err);
    }
}


async function run() {

    try {
        await client.connect();
        const database = client.db("unityMart");
        const unityMartCategories = database.collection('categories')
        const unityMartAttributes = database.collection('attributes')
        const unityMartProductsCollection = database.collection("products");
        const unityMartMediaCollection = database.collection("media");



        // MEDIA
        app.post('/media', async (req, res, next) => {
            console.log(req.body.images);
            console.log(req.files);
            const images = req.body.images
            const promises = req.files.map(file => uploadAndUnlink(file));
            const urls = await Promise.all(promises);
            var m = new Date();
            var dateString = m.getUTCFullYear() + "/" + (m.getUTCMonth() + 1) + "/" + m.getUTCDate() + " " + m.getUTCHours() + ":" + m.getUTCMinutes() + ":" + m.getUTCSeconds();
            const media = { urls: urls, uploadDate: dateString }
            const result = await unityMartMediaCollection.insertOne(media)
            res.json(result);
        });


        app.get('/media/', async (req, res) => {
            const cursor = unityMartMediaCollection.find({});
            const result = await cursor.toArray()
            res.json(result)
        })


        // ADD PRODUCTS
        app.post('/dashboard/addProduct', async (req, res) => {
            const { offerDate, title, brand, reg_price, sale_price, stock, images, categories, product_des, newAttributes } = req.body
            const productDetail = {
                title,
                brand,
                reg_price,
                sale_price,
                stock,
                images,
                categories,
                product_des,
                offerDate,
                attributes: newAttributes
            }
            const result = await unityMartProductsCollection.insertOne(productDetail)
            res.json(result)

        })
        //  GET PRODUCTS
        app.get('/products', async (req, res) => {
            const cursor = unityMartProductsCollection.find({});
            const result = await cursor.toArray()
            res.json(result)
        })

        // ADD CATEGORY
        app.post('/dashboard/addCategory', async (req, res) => {
            const { vendor, options } = req.body

            const slug = options?.label.split(' ').join('-')
            const demo = 'demo'
            const categoryDetail = {
                slug,
                vendor,
                options: {
                    label: options?.label,
                    value: slug
                }
            }
            console.log(categoryDetail);
            const result = await unityMartCategories.insertOne(categoryDetail)
            res.json(result)

        })

        // GET CATEGORY 
        app.get('/dashboard/categories', async (req, res) => {
            const query = req.query
            if (query._id) {
                const cursor = unityMartCategories.find(query);
                const result = await cursor.toArray()
                res.json(result)
            } else {
                const cursor = unityMartCategories.find(query);
                const result = await cursor.toArray()
                res.json(result)
            }

        })

        // DELETE CATEGORY
        app.delete('/dashboard/categories/:id', async (req, res) => {
            const id = req.params.id
            console.log(id);
            const query = { _id: objectId(id) }
            const result = await unityMartCategories.deleteOne(query)
            res.json(result)
        })

        // UPDATE CATEGORY
        app.put('/dashboard/categories/', async (req, res) => {
            const { categoryValue, id } = req.body
            const filter = { _id: objectId(id) }
            const slug = categoryValue?.split(' ').join('-')
            const updateDoc = {
                $set: {
                    slug: slug,
                    options: {
                        label: categoryValue,
                        value: slug
                    }
                },
            };

            const result = await unityMartCategories.updateOne(filter, updateDoc);
            res.json(result)
        })


        // ======================= ===> ADD ATTRIBUTES <=== ================================
        // ADD ATTRIBUTES
        app.post('/dashboard/add-attributes', async (req, res) => {
            const { label, vendor } = req.body

            const slug = label?.split(' ').join('-')
            const attributesDetail = {
                label,
                slug,
                vendor,

            }
            console.log(attributesDetail);
            const result = await unityMartAttributes.insertOne(attributesDetail)
            res.json(result)

        })
        // GET ATTRIBUTES 
        app.get('/dashboard/attributes', async (req, res) => {
            const query = req.query
            if (query._id) {
                const cursor = unityMartAttributes.find(query);
                const result = await cursor.toArray()
                res.json(result)
            } else {
                const cursor = unityMartAttributes.find(query);
                const result = await cursor.toArray()
                res.json(result)
            }

        })

        // ADD ATTRIBUTES VALUE
        app.put('/dashboard/attributes/', async (req, res) => {
            const { options, id } = req.body
            console.log(options);
            const filter = { _id: objectId(id) }
            // const slug = label?.split(' ').join('-')
            const updateDoc = {
                $push: {
                    options: options
                },
            }

            const result = await unityMartAttributes.updateOne(filter, updateDoc);
            res.json(result)
            console.log(result);
        })


    } finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})


