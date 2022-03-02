const app = express();
const router = app.Router()
import { bicycleAffiliateLinksCollection, bicycleRealTimeDataCollection } from '../../app'

app.get('/shortUrls', async (req, res) => {
    const shortUrls = bicycleAffiliateLinksCollection.find()
    const result = await shortUrls.toArray()
    res.send(result)
})


exports.postShortUrls = async (req, res) => {
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
}


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

app.delete('/delete/shortUrl/:id', async (req, res) => {
    console.log(req.params);
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

module.exports = router