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
    const title = req.body
    console.log(title);
    // const price = req.body.price
    // const description = req.body.description
    // const pic = req.files.url
    // const picData = pic.data
    // const encodedPic = picData.toString('base64')
    // const imageBuffer = Buffer.from(encodedPic, 'base64')
    // const productDetail = {
    //     title,
    //     price,
    //     description,
    //     url: imageBuffer
    // }
    // const result = await bicycleProductsCollection.insertOne(productDetail)
    // res.json(result)

})

// ADD CATEGORY
app.post('/dashboard/addCategory', async (req, res) => {
    const { slug, vendor, options } = req.body

    const categoryDetail = {
        slug,
        vendor,
        options: {
            label: options?.label,
            value: options?.value,
        }
    }
    const result = await unityMartCategories.insertOne(categoryDetail)
    res.json(result)

})

// GET CATEGORY 
app.get('/dashboard/categories', async (req, res) => {
    const query = req.query
    if (query._id) {
        console.log('false');
        const cursor = unityMartCategories.find(query);
        const result = await cursor.toArray()
        res.json(result)
    } else {
        console.log('true');
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
    const email = req.body
    console.log('database', email);
    // const adminEmail = email.email
    // const filter = { email: adminEmail };

    // const updateDoc = {
    //     $set: {
    //         roll: 'admin'
    //     },
    // };
    // const result = await unityMartCategories.updateOne(filter, updateDoc);
    // res.json(result)


})