
//SETTING UP THE MONGODB EXPRESS, .db FILE AND OBJECTID
const express = require('express')
const { connectToDb, getDB} = require('./db')
const { ObjectId } = require('mongodb')

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


// set the view engine to ./client ejs file
app.set('view engine', 'ejs');
app.set('views', './client')
app.use(express.static('./client'));
app.use(express.static('./client/Pictures'))

//SETTING UP THE URL
app.get('/cars', (req, res) => {
    // const page = req.query.p || 0
    // const carsPerPage = 7
    let cars = []

//DISPLAYING THE COLLECTION 'cars' IN THE '/car' URL
    
    if (Object.keys(req.query).length === 0) 
    { 
        database.collection('cars').find(filter)
    }
        else{database.collection('cars').find()
        .sort({ 
            Model: 1
        })
        //LIMITING 7 DOCUMENTS PER PAGE
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
}})


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
        res.status(201).json(result)(result.ops[0]);
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

// ESTABLISHING AND CONFIGURING THE '/search' URL
app.get('/database/search', (req, res) => {
    // Construct filter based on query parameters
    const filter = {};

    if (req.query.hand) {
        filter.Hand = req.query.hand;
    }
    if (req.query.price) {
        filter.Price = { $lte: parseInt(req.query.price) }; // Assuming price is stored as integer in the database
    }
    if (req.query.brand) {
        filter.Brand = req.query.brand;
    }

    // Check if search query is present
    const searchQuery = req.query.query;
    if (searchQuery) {
        // Use a regular expression to perform a case-insensitive search
        const regex = new RegExp(searchQuery, 'i');

        // Add search query to filter
        filter.$or = [
            { Brand: regex },
            { Model: regex },
            { Hand: regex },
            { Accessories: regex }
        ];
    }

    // Find cars matching the filter
    database.collection('cars')
        .find(filter)
        .toArray()
        .then(results => {
            res.json(results);
        })
        .catch(error => {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});

// ESTABLISHING AND CONFIGURING THE '/price' URL
app.get('/database/price', (req, res) => {
    const searchQuery = parseInt(req.query.query);
    console.log(searchQuery)

    database.collection('cars')
        .find( {Price: { $lte: searchQuery } }) // Fetch cars with price less than or equal to 150000
        .toArray()
        .then(results => {
            res.json(results);
        })
        .catch(error => {   
            console.error('Sakto nga error:', error);
            // res.status(500).json({ error: 'Internal server error' });
        });
});






// Set up route handler for the root URL ("/")
app.get('/', (req, res) => {
    // Render the "index" view/template
    res.render('index');
});

// Set up route handler for the "/addcars" URL
app.get('/addcars', (req, res) => {
    res.render('addcars');
});

app.get('/updatecars', (req, res) =>{
    res.render('updatecars');
})

app.get('/deletecars', (req, res) =>{
    res.render('deletecars')
})
app.get('/database', (req, res) =>{
    res.render('database')
})