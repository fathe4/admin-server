const cors = require("cors");
const express = require("express");
const app = express();
const multer = require("multer");
const objectId = require('mongodb').ObjectId
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 5000
const path = require("path")
const fs = require('fs');
const shortId = require('shortid')



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
        const bicycleAffiliateLinksCollection = database.collection("affiliate-links");
        const bicycleRealTimeDataCollection = database.collection("affiliate-daily-data");



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
        //  GET PRODUCTSs
        app.get('/products', async (req, res) => {
            const cursor = unityMartProductsCollection.find({});
            const result = await cursor.toArray()
            res.json(result)
        })
        //  GET PRODUCTS BY ID
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: objectId(id) }
            const cursor = unityMartProductsCollection.find(filter);
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


        // ============ ======================== AFFILIATE ====================== ===================== //
        // LINK SHRINK

        app.get('/shortUrls', async (req, res) => {
            const shortUrls = bicycleAffiliateLinksCollection.find()
            const result = await shortUrls.toArray()
            res.send(result)
        })


        app.post('/shortUrls', async (req, res) => {
            const uniqueUrl = shortId({ url: req.body.url })
            const details = {
                short: uniqueUrl,
                full: req.body.url,
                clicks: 0,
                earned: 0,
                date: req.body.date,
                affiliateUser: req.body.affiliateUser
            }
            const result = await bicycleAffiliateLinksCollection.insertOne(details)
            res.json(result)
        })


        // GET SHORT URL
        app.get('/findUrl/:shortUrl', async (req, res) => {
            const shortenUrl = await bicycleAffiliateLinksCollection.findOne({ short: req.params.shortUrl })
            let isUrlTrue = false;
            if (shortenUrl?.short === req.params.shortUrl) {
                isUrlTrue = true
            }
            res.json({ isUrlTrue: isUrlTrue })
        })
        // ADD COMMISSION
        app.put('/ref/', async (req, res) => {
            const { ref, earned } = req.body

            const earn = Number(earned)
            const filter = { short: ref };

            const options = { upsert: true };
            const updateDoc = {
                $inc: {
                    earned: earn
                }
            };
            const user = await bicycleAffiliateLinksCollection.findOne({ short: ref })

            const result = await bicycleAffiliateLinksCollection.updateOne(filter, updateDoc, options);
            res.json(result)


            var today = new Date();
            var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
            const updateData = {
                $set: {
                    date: date
                },
                $inc: {
                    earned: earn
                }
            }


            const realTimeUpdate = await bicycleRealTimeDataCollection.findOneAndUpdate({ affiliateUser: user.affiliateUser }, updateData, {
                new: true,
                upsert: true
            })

        })
        // GET DAILY UPDATE
        app.get('/ref/updates', async (req, res) => {
            const shortUrls = bicycleRealTimeDataCollection.find()
            const result = await shortUrls.toArray()
            res.send(result)
        })

        // DELETE SHORT URL
        app.delete('/delete/shortUrl/:shortUrl', async (req, res) => {
            const short = req.params.shortUrl
            const query = { short: short }
            const result = await bicycleAffiliateLinksCollection.deleteOne(query)
            // const result2 = await bicycleRealTimeDataCollection.deleteOne(query)
            res.json(result)
        })



        app.get('/:shortUrl', async (req, res) => {
            const filter = {
                short: req.params.shortUrl
            }

            var today = new Date();
            var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

            // GETTING THE USER EMAIL TO UPDATE THE EXACT USER VALUES
            const user = await bicycleAffiliateLinksCollection.findOne(filter)

            const updateData = {
                $set: {
                    date: date,
                    earned: 0,
                    affiliateUser: user.affiliateUser
                },
                $inc: {
                    clicks: 1
                }
            }
            // IT WILL UPDATE THE VALUES WHO CREATED THE SHORT URL
            const realTimeUpdate = await bicycleRealTimeDataCollection.findOneAndUpdate({ affiliateUser: user.affiliateUser }, updateData, {
                new: true,
                upsert: true
            })

            const updateDoc = {
                $inc: {
                    clicks: 1
                }
            }
            // IT WILL UPDATE THE SPECIFIC URL OBJECT
            const urlDoc = await bicycleAffiliateLinksCollection.findOneAndUpdate(filter, updateDoc, {
                new: false,
                upsert: true
            })

            res.redirect(`${urlDoc.value.full}?ref=${req.params.shortUrl}`)

        })



    } finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})


