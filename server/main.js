const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const mysql = require('mysql2/promise')

const multer = require('multer')
const fs = require('fs')
const AWS = require('aws-sdk')

const { MongoClient, ObjectId } = require('mongodb')

const jwt = require('jsonwebtoken')

const nodemailer = require('nodemailer')

const fetch = require('node-fetch')
const withQuery = require('with-query').default

const { Telegraf } = require('telegraf')
const {MenuTemplate, MenuMiddleware} = require('telegraf-inline-menu')

//telegram bot
const TELEGRAM_BOT_API_KEY = process.env.TELEGRAM_BOT_API_KEY || ''

let telegramUserLat = 0
let telegramUserLong = 0

//create a bot
const bot = new Telegraf(TELEGRAM_BOT_API_KEY)


//when a user starts a session with your bot
bot.start(ctx =>{
    //ctx.replyWithDocument(robo_hi,{ caption: 'You are under arrest! To cooperate type /giphy follow by the search term. Example: /giphy robocop'})
    if(telegramUserLat==0){
        ctx.reply('Hi I am Jiak Simi Bot, your solution to everything and anything edible. I need to know your location in order to serve you better. Let me know where you are by sending your location in Telegram.')
    } else {
        ctx.reply(`Welcome back! Your location on my record is [${telegramUserLat}, ${telegramUserLong}]. To update or change, send me a new location. Otherwise you can say /jiaksimi or /jiaksimi followed by a number 1 to 5 to receive up to 5 nearby suggestions.`)
        ctx.replyWithLocation(telegramUserLat, telegramUserLong)
        menuMiddleware.replyToContext(ctx)
    }
})

//fetch reviews function
const fetchReviews = async (count, ctx) => {
    
    const result = await mongoClient.db(DATABASE)
            .collection(COLLECTION)
            .find({ location:
                { $nearSphere:
                    { $geometry: 
                        { type: "Point", coordinates: [ telegramUserLong, telegramUserLat ] }
                    } 
                }
            })
            .limit(count)
            .toArray()
        
    console.info(result.length)
    for(let i = 0; i < result.length; i++){
        const caption = `${result[i].title} (${result[i].rating}/5) - ${result[i].address} - https://www.google.com/maps/search/?api=1&query=${result[i].location.coordinates[1]},${result[i].location.coordinates[0]}`
        ctx.replyWithPhoto(`https://final.sfo2.digitaloceanspaces.com/${result[i].image}`,{ caption: caption }) 
    }
}


bot.command('jiaksimi', async ctx => {


    const length = ctx.message.text.length
    const q = ctx.message.text.substring(10, length)

    let count = parseInt(q)
   
    if(count > 6)
       count = 5
    if(isNaN(count) || count < 1)
        count = 1
    
    return fetchReviews(count, ctx)

})

bot.hears('hi', ctx => {
    ctx.reply('Hi yourself! Are you hungry?')
})

//respond to location sent
bot.on('location', ctx => {
  
    telegramUserLat = ctx.update.message.location.latitude
    telegramUserLong = ctx.update.message.location.longitude

    ctx.reply(`Got it! I have your location, now you can say /jiaksimi or /jiaksimi followed by a number 1 to 5 to receive up to 5 nearby suggestions.`)

})

//respond to any unknown commands
bot.on('message', ctx => {
    ctx.reply('I do not understand your last command. Send your location or simply say /jiaksimi. You may also say /jiaksimi followed by a number(1 to 5) to receive up to 5 suggestions near you. e.g. /jiansimi 3 (to receive the 3 nearest result)')
})

//start the bot
console.info(`Starting bot at ${new Date()}`)
bot.launch()

//mySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'fsd2020-do-user-8423499-0.b.db.ondigitalocean.com',
    user: process.env.DB_USER || 'doadmin',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fsd2020',
    port: process.env.DB_PORT || '25060',
    connectionLimit: 4,
    timezone: '+08:00'
})

//for signing
const TOKEN_SECRET = process.env.TOKEN_SECRET || ''

//construct SQL
const getLoginDetails = "SELECT user_id FROM user WHERE user_id = ? AND password = sha1(?)"

//establish SQL connection, take in params and query the rdbms
const mkQuery = (sql, pool) => {
    return(async(args) => {
        const conn = await pool.getConnection()
        try{
            let results = await conn.query(sql, args || [])
            console.log(results)
            return results[0]
        }catch(err){
            console.log(err)
        }finally{
            conn.release()
        }
    })
}

//create the SQL closure function
const executeGetLoginDetails = mkQuery(getLoginDetails, pool)

//passport core
const passport = require('passport')

//passport strategy
const LocalStrategy = require('passport-local').Strategy

const mkAuth = (passport) => {
    return (req, resp, next) => {
        passport.authenticate('local',
            (err, user, info) => {
                if((null != err) || (!user)) {
                    resp.status(401)
                    resp.type('application/json')
                    resp.json({error: err})
                    return
                }
                req.user = user
                next()
            }
        )(req, resp.next)
    }
}

//configure passport with a strategy
passport.use(
    new LocalStrategy(
        { usernameField: 'username', passwordField: 'password', passReqToCallback: true },
        ( req, user, password, done ) => {
            //perform the authentication
            console.info(`>LocalStrategy username: ${user}, password: ${password}`)
            executeGetLoginDetails([user, password]).then((results) => {
                if (results.length > 0) {
                    done(null,
                        //info about the user
                        {
                            username: user,
                            loginTime: (new Date()).toString()
                            
                        }
                        )
                } else { 
                    done('Incorrect username and password', false)
                }
            }).catch((e) => {
                resp.status(500)
                resp.json({e})
            })
        }
    )
)

const localStrategyAuth = mkAuth(passport)

const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

const app = express()
app.use(morgan('combined'))
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//initialize passport after json and form-urlencoded
app.use(passport.initialize())


app.post('/login', 
    //passport middleware to perform login
    localStrategyAuth, 
    (req, resp) => {
        //generate JWT token
        const timestamp = (new Date()).getTime() / 1000
        const token = jwt.sign({
            sub: req.user.username,
            iss: 'myapp',
            iat: timestamp,
            exp: timestamp + (60 * 60),
            data: {
                loginTime: req.user.loginTime
            }
        }, TOKEN_SECRET)
        resp.status(200)
        resp.type('application/json')
        resp.json({ message: `Login at ${new Date()}`, token, user: req.user.username })
    /*executeCheckLogin([req.body.username, req.body.password]).then((results) => {
        if(results.length > 0){
            console.log('Login successful')
            resp.status(200)
            resp.json({ authenticated: 'true' })
        } else {
            console.log('Login fail')
            resp.status(401)
            resp.json({ authenticated: 'false' })
        }

    }).catch((e) => {
        resp.status(500)
        resp.json({ authenticated: 'false', error: e})
    })*/
})

//S3 
const s3 = new AWS.S3({
    endpoint: new AWS.Endpoint(process.env.AWS_ENDPOINT || 'sfo2.digitaloceanspaces.com'),
    accessKeyId: process.env.ACCESS_KEY || '',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || ''
})

const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'final'

const upload = multer({
    dest: process.env.TMP_DIR || '/opt/tmp/uploads'
})

const mkJson = (params, image) => {
    return {
        title: params.title,
        rating: params.rating,
        address: params.address,
        location: {
            type: "Point",
            coordinates: [parseFloat(params.lng), parseFloat(params.lat)]
        },
        comments: params.comments,
        image: image,
        user: params.user,
        ts: new Date()
    }
}

const readFile = (path) => new Promise(
    (resolve, reject) =>
        fs.readFile(path, (err, buff) => {
            if (null != err)
                reject(err)
            else
                resolve(buff)
        })
)

const putObject = (file, buff, s3) => new Promise(
    (resolve, reject) => {
        const params = {
            Bucket: AWS_S3_BUCKET_NAME,
            Key: file.filename,
            Body: buff,
            ACL: 'public-read',
            ContentType: file.mimetype,
            ContentLength: file.size
        }
        s3.putObject(params, (err, result) => {
            if (null != err)
                reject(err)
            else
                resolve(result)
        })
    }
)

const s3delete = function (params) {
    return new Promise ((resolve, reject) => {
        s3.createBucket({
            Bucket: AWS_S3_BUCKET_NAME
        }, function() {
            s3.deleteObject(params, function (err, data) {
                if (err) 
                    console.log(err)
                else
                    console.log('Successfully deleted file from bucket')
                console.log(data)
            })
        }
        )
    })
}

//MongoDB
//configure mongoDB

const MONGO_PSWD = process.env.MONGO_PSWD || ''
const MONGO_URL =  `mongodb+srv://admin:${MONGO_PSWD}@paf-cluster.i7cv2.mongodb.net/final?retryWrites=true&w=majority`

const mongoClient = new MongoClient(MONGO_URL, {
    useNewUrlParser: true, useUnifiedTopology: true
})

const DATABASE = 'Final'
const COLLECTION = 'Reviews'

app.post('/upload', upload.single('img'), (req, resp) => {
    console.info('>> title:', req.body.title)

    const doc = mkJson(req.body, req.file.filename)

    readFile(req.file.path)
        .then(buff =>
            putObject(req.file, buff, s3)
        )
        .then(() => {
            mongoClient.db(DATABASE).collection(COLLECTION)
                .insertOne(doc)
        })
        .then(result => {
            console.log('Insert Success')
            //delete the temp file
            fs.unlink(req.file.path, () => {})
            resp.status(200)
            resp.json({ result })
        })
        .catch(error => {
            console.error('Insert Error: ', error)
            resp.status(500)
            resp.json({ error })
        })
})

//get list of reviews, sort by near to far
app.get(`/reviews`, async (req, resp) => {
    const lat = parseFloat(req.query['lat'])
    const lng = parseFloat(req.query['lng'])
    const rad = parseFloat(req.query['rad']) //in meters

    try{
        const result = await mongoClient.db(DATABASE)
            .collection(COLLECTION)
            .find({ location:
                { $nearSphere:
                    { $geometry: 
                        { type: "Point", coordinates: [ lng, lat ] }, 
                        $maxDistance: rad 
                    } 
                }
            })
            .toArray()
            
        resp.status(200)
        resp.type('application/json')
        resp.json({result: result})
    } catch(e) {
        resp.status(500)
        resp.type('application/json')
        resp.json({ error: e })
    }
})

//delete review
app.post('/deleteReview/:id', async (req, resp) => {
    const id = ObjectId(req.params.id)
    console.info('server: ', id)
    try{
        //retrieve s3 filename from review
        const result = await mongoClient.db(DATABASE)
            .collection(COLLECTION)
            .find({ _id: id })
            .toArray()
        const imageFilename = result[0].image

        //delete file from s3
        const params = {
            Bucket: AWS_S3_BUCKET_NAME,  
            Key: imageFilename 
        }
        s3delete(params)

        //delete review record from MondoDB 
        await mongoClient.db(DATABASE)
            .collection(COLLECTION)
            .deleteOne({_id: ObjectId(id)})
        
        resp.status(200)
        resp.type('application/json')
        resp.json({ })
    } catch(e) {
        resp.status(500)
        resp.type('application/json')
        resp.json({ error: e })
    }
})

//let hawkers
//get list of hawkers from external RESTful api
app.get('/hawkers', async (req, resp) => {
    
    //if (hawkers == null) {
       // console.info('hawker = null')
        const BASE_URL = 'https://api.jael.ee/datasets/hawker'
        const url = withQuery(BASE_URL, {})
        try{
            let result = await fetch(url)
            result = await result.json()

            hawkers = result
            resp.status(200)
            resp.type('application/json')
            resp.json({hawkers}) 
        } catch(e) {
            resp.status(500)
            resp.type('application/json')
            resp.json({ error: e })
        }
    //}
})

//feedback via email
let transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "jiaksimiapp@gmail.com",
      pass: "mpdw41254"
    }
})
//middleware for sending email
app.post('/feedback', (req, resp) => {
    console.info('req: ', req.body)
    console.info('comments: ', req.body.comments)
    console.info('user: ', req.body.user)
    const message = {
        from: 'jiaksimiapp@gmail.com',
        to: 'jiaksimiapp@gmail.com',
        subject: `Feedback from ${req.body.user} via Jiak Simi App`,
        html: `<strong>User:</strong> ${req.body.user}<p><strong>Comments:</strong> ${req.body.comments}
            <p><strong>Timestamp:</strong> ${new Date()}`
    }
    transport.sendMail(message, function(err, info) {
        if (err) {
            console.log(err)
            resp.status(500)
            resp.json(err)
        } else {
            console.log(info)
            resp.status(200)
            resp.json(info)
        }
    })
})

//start the server
//check SQL connection
const p0 = (async () => {
    const conn = await pool.getConnection()
    await conn.ping()
    conn.release()
    return true
}) ()

//check mongoDB connection
const p1 = (async () => {
    await mongoClient.connect()
    return true
})()


Promise.all([ p0, p1 ])
    .then((r) => {
        app.listen(PORT, () => {
            console.info(`Application started on port ${PORT} at ${new Date()}`)
        })
    })
