const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
var path = require('path');
var multer = require('multer');


const UPLOAD_FOLDER = "./uploads/"
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

var upload = multer({ storage: storage })

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");

mongoose.connect("mongodb+srv://bicyledbnew:bicyledbnew321@cluster0.wanl6.mongodb.net/unityMart?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});


app.post('/imgupload', upload.single('images'), function (req, res, next) {
    console.log(fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)));
    // var image = new Image({
    //     img: {
    //         data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
    //         contentType: 'image/png'
    //     }
    // });
    // image.save();
    // res.render("app",{Name: req.body.username});
});

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(5000, () => {
    console.log(`Example app listening at http://localhost:${5000}`)
})