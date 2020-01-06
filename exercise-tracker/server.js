const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track')

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static('public'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
})

const UserSchema = new mongoose.Schema({
    username: String,
    exercises: [
        {
            description: String,
            duration: Number,
            date: Date
        }
    ]
})
const User = mongoose.model('User', UserSchema)

app.post('/api/exercise/new-user', (req, res) => {
    new User({ username: req.body.username })
        .save()
        .then(user => res.json({ username: user.username, _id: user._id }))
})

app.get('/api/exercise/users', (req, res) => {
    User.find()
        .select('username _id')
        .then(users => res.json(users))
})

app.post('/api/exercise/add', (req, res) => {
    User.findById(req.body.userId)
        .then(user => {
            if (!user.exercises) user.exercises = []
            user.exercises.push({
                description: req.body.description,
                duration: Number(req.body.duration),
                date: req.body.date ? new Date(req.body.date) : new Date()
            })
            return user.save()
        })
        .then(user => res.json(user))
})

app.get('/api/exercise/log', (req, res) => {
    User.findById(req.query.userId).then(user => {
        let log = user.exercises.filter(ex => {
            if (req.query.from && ex.date.getTime() < Date.parse(req.query.from)) {
                return false
            }
            if (req.query.to && ex.date.getTime() > Date.parse(req.query.to)) {
                return false
            }
            return true
        })

        if (req.query.limit) {
            log = log.slice(0, Number(req.query.limit))
        }

        res.json({
            user,
            log,
            count: log.length
        })
    })
})

// Not found middleware
app.use((req, res, next) => {
    return next({ status: 404, message: 'not found' })
})

// Error Handling middleware
app.use((err, req, res, next) => {
    let errCode, errMessage

    if (err.errors) {
        // mongoose validation error
        errCode = 400 // bad request
        const keys = Object.keys(err.errors)
        // report the first validation error
        errMessage = err.errors[keys[0]].message
    } else {
        // generic or custom error
        errCode = err.status || 500
        errMessage = err.message || 'Internal Server Error'
    }
    res.status(errCode)
        .type('txt')
        .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})
