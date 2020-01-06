'use strict'

var express = require('express')
const bodyParser = require('body-parser')
const dns = require('dns')

var cors = require('cors')

var app = express()

// Basic Configuration
var port = process.env.PORT || 3000

/** this project needs a db !! **/
// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'))

app.get('/', function(req, res) {
    res.sendFile(process.cwd() + '/views/index.html')
})

const urls = new Map()

app.post('/api/shorturl/new', (req, res) => {
    new Promise(resolve => resolve(new URL(req.body.url)))
        .then(
            url =>
                new Promise((resolve, reject) =>
                    dns.lookup(url.hostname, 0, err => {
                        if (err) {
                            reject(url)
                        } else {
                            resolve(url)
                        }
                    })
                )
        )
        .then(url => {
            const id = urls.size
            urls.set(id, url)
            res.json({ original_url: url.toString(), short_url: id })
        })
        .catch(() => res.json({ error: 'invalid URL' }))
})

app.get('/api/shorturl/:id', (req, res) => {
    const url = urls.get(Number(req.params.id))
    if (url) {
        res.redirect(url)
    } else {
        res.json({ error: 'URL not found!' })
    }
})

app.listen(port, function() {
    console.log('Node.js listening ...')
})
