const express = require('express')
const { connectToDb, getDB} = require('./db')
const { ObjectId } = require('mongodb')

//init app and middleware
const app = express()
app.use(express.json())
// Serve static files from the 'public' directory
app.use(express.static('public'));

//db Connection
let database

//CONNECT TO THE DATABASE
connectToDb((err) => {
    if(!err){
        //listen to port number 3000
        app.listen(3000, () => {
            console.log('App listening on port 3000')
        })
        //FETCH, UPDATE DATA
        database = getDB()
    }
    else{
        console.log(err)
    }
})


// set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', './client')
app.set(express.static('client'));

//routes
app.get('/cars', (req, res) => {
    // const page = req.query.p || 0
    // const carsPerPage = 7

    let cars = []

//LIMITING 7 DOCUMENTS PER PAGE
    database.collection('cars')
        .find()
        .sort({
            Model: 1
        })
        // .skip(page * carsPerPage) //SKIP THE AMOUNT OF CARS TIMES THE PAGE
        // .limit(carsPerPage) //LIMIT THE AMOUNT OF CARS DISPLAYED IN ONE PAGE EQUAL TO THE VALUE
        .forEach(car => cars.push(car))
        // .toArray()
        .then(() =>{
            res.status(200).json(cars)
        })
        .catch(() =>{
            res.status(200).json({
                error: 'Could Not Fetch Documents'
            })
        })
})


//SINGLE DOCUMENTS ONLY
app.get('/cars/:id', (req, res) => {
    
    if (ObjectId.isValid(req.params.id)) {
        const objectId = new ObjectId(req.params.id); // Construct ObjectId instance with new keyword
    
        database.collection('cars')
            .findOne({ _id: objectId })
            .then(doc => {
                if (doc) {
                    res.status(200).json(doc);
                } else {
                    res.status(404).json({ error: 'Car not found' });
                }
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: 'Could not fetch document' });
            });
    } else {
        res.status(500).json({ error: 'Invalid Document ID' });
    }})

//CREATE DOCUMENTS (POSTMAN ONLY)
app.post('/cars', (req, res) => {
    const car = req.body
    
    database.collection('cars')
    .insertOne(car)
    .then(result => {
        res.status(201).json(result)
    })
    .catch(err => {
        res.status(500).json({
            err: 'Could not create a new document'
        })
    })

})

//DELETE DOCUMENTS (POSTMAN ONLY)
app.delete('/cars/:id', (req, res) => {
    if (ObjectId.isValid(req.params.id)) {
        database.collection('cars')
            .deleteOne({ _id: new ObjectId(req.params.id)})
            .then(result => {
                if (result) {
                    res.status(200).json(result);
                } else {
                    res.status(404).json({ error: 'Document Cannot be Deleted' });
                }
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: 'Could not fetch document' });
            });
    } else {
        res.status(500).json({ error: 'Invalid Document ID' });
}})

//UPDATE ONE DOCUMENT (POSTMAN ONLY)
app.patch('/cars/:id', (req, res) =>{
    const updates = req.body

    if (ObjectId.isValid(req.params.id)) {
        database.collection('cars')
            .updateOne({ _id: new ObjectId(req.params.id)}, {$set: updates})
            .then(result => {
                if (result) {
                    res.status(200).json(result);
                } else {
                    res.status(404).json({ error: 'Document Cannot be Deleted' });
                }
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: 'Could not update document' });
            });
    } else {
        res.status(500).json({ error: 'Invalid Document ID' });
}})

// Add this route in your Express app
app.get('/search', (req, res) => {
    const searchQuery = req.query.query;

    // Use a regular expression to perform a case-insensitive search
    const regex = new RegExp(searchQuery, 'i');

    database.collection('cars')
        .find({ $or: [{Brand: regex}, { Model: regex }, { Price: regex }, { Hand: regex }, {Accessories: regex}] })
        .toArray()
        .then(results => {
            res.json(results);
        })
        .catch(error => {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});
app.get('/brand', (req, res) =>{
    
})

app.get('/', (req, res) => {
    res.render('index')
})

