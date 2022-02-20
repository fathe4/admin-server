const cors = require("cors");
const express = require("express");
const app = express();
const multer = require("multer");
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 5000
const path = require("path")

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://bicyledbnew:bicyledbnew321@cluster0.wanl6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const UPLOAD_FOLDER = "./uploads/"

// define storage for images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_FOLDER)
    },
    filename: function (req, file, cb) {
        const fileExt = path.extname(file.originalname)
        const fileName = file.originalname
            .replace(fileExt, "")
            .toLowerCase()
            .split(" ")
            .join("-") + "-" + Date.now()
        cb(null, fileName + fileExt)
    }
})
// uploads parameters for multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1000000
    }
})

async function run() {
    try {
        await client.connect();
        const database = client.db("unityMart");

        const unityMartProductsCollection = database.collection("products");

        app.post('/addProduct/', upload.single('images'), async (req, res) => {
            // console.log(req.get, req.protocol, 'req file');

            const url = req.protocol + '://' + req.get('host')
            console.log(url + '/public/' + req.file.filename);

            const productDetail = {
                images: req.files,
                imageUrl: url + '/uploads/' + req.file.filename
            }

            const result = await unityMartProductsCollection.insertOne(productDetail)
            res.json(result)
        })

        app.get('/addProduct/', async (req, res) => {
            const cursor = unityMartProductsCollection.find({});
            const result = await cursor.toArray()
            res.json(result)
        })


    } finally {

    }
}

run().catch(console.dir);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})




