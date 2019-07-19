const express = require('express')
const app = express()

// https://blog.ryo4004.net/web/306/
// method: post のために必須
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const cookieParser = require('cookie-parser')
app.use(cookieParser())

// Example directories as static files
app.use(express.static('src/static'))

const ACCESS_TOKEN_NAME = 'x-authorization-code'

app.use((req, res, next) => {
  // CORSリクエストでクレデンシャル(≒クッキー)を必要とする場合の注意点 - Qiita - https://qiita.com/kawaz/items/1e51c374b7a13c21b7e2
  // * だと withCredentials が動かない
  // res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Origin', 'http://localhost:4000')
  res.header('Access-Control-Allow-Credentials', true)

  res.header(
    'Access-Control-Allow-Headers',
    // Chrome は OK で、 Firefox と IE11 がダメだったため、
    // '*' だと CORS 的に許可されないので、明示的にリクエストヘッダーの key 名を許可しています
    `origin, x-requested-with, content-type, accept, post-header, common-header, header1, ${ACCESS_TOKEN_NAME}, X-User-Agent, X-Referer`
    // '*'
  )

  // https://stackoverflow.com/questions/37897523/axios-get-access-to-response-header-fields
  // https://github.com/axios/axios/issues/606
  // Access-Control-Expose-Headers を追加しないとカスタムレスポンスヘッダーをブラウザに返すことはできない
  res.header(
    'Access-Control-Expose-Headers',
    `from-server, ${ACCESS_TOKEN_NAME}`
  )
  next()
})

/**
 * get '/'
 */
app.get('/', function(req, res) {
  res.send('Hello World')
})

/**
 * post '/set-cookie'
 */
app.post('/set-cookie', function(req, res) {
  const token = req.body.token

  if (token) {
    res.cookie('from-server-token', token, { maxAge: 60000, httpOnly: false })
  }

  res.send(
    JSON.stringify({
      apiResult: 'ok'
    })
  )
})

/**
 * get '/api-waiting-for-5-seconds'
 */
app.get('/api-waiting-for-5-seconds', function(req, res) {
  setTimeout(() => {
    res.send(
      JSON.stringify({
        apiResult: [
          { id: 'id1', value: 'value1' },
          { id: 'id2', value: 'value2' }
        ]
      })
    )
  }, 5000)
})

/**
 * get '/headers'
 */
app.get('/headers', (req, res) => {
  res.send(JSON.stringify(req.headers))
})

/**
 * post '/custom-headers'
 */
app.post('/custom-headers', (req, res) => {
  console.log(req.body)

  // カスタムレスポンスヘッダーをセットします
  res.set({
    'from-server': 'server1'
  })

  res.send(JSON.stringify(req.headers))
})

// https://ja.stackoverflow.com/questions/2512/javascript%E3%81%A7-guid-uuid-%E3%83%A9%E3%83%B3%E3%83%80%E3%83%A0%E3%81%AA%E6%96%87%E5%AD%97%E5%88%97-%E3%82%92%E7%94%9F%E6%88%90%E3%81%99%E3%82%8B%E3%81%AB%E3%81%AF
function uuid() {
  let uuid = ''
  let i
  let random

  for (i = 0; i < 32; i++) {
    random = (Math.random() * 16) | 0

    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += '-'
    }
    uuid += (i === 12 ? 4 : i === 16 ? (random & 3) | 8 : random).toString(16)
  }
  return uuid
}

/**
 * get '/healthcheck'
 */
app.get('/healthcheck', function(req, res) {
  res.send('ok')
})

/**
 * post '/login'
 */
app.post('/login', (req, res) => {
  const body = req.body

  if (!(body.username === 'demo' && body.password === 'password')) {
    console.log('login failed')
    res.status(401).send('wrong username or password')
    return
  }

  console.log('login succeeded')

  // カスタムレスポンスヘッダーをセットします
  const id = uuid()
  console.log('uuid:', id)
  res.set({
    [ACCESS_TOKEN_NAME]: id
  })

  res.send(
    JSON.stringify({
      loggedIn: true
    })
  )
})

/**
 * post '/logout'
 */
app.post('/logout', (req, res) => {
  const body = req.body

  console.log('logout succeeded')

  // カスタムレスポンスヘッダーをセットします
  res.set({
    [ACCESS_TOKEN_NAME]: ''
  })

  res.send(
    JSON.stringify({
      loggedIn: false
    })
  )
})

/**
 * post '/login-check'
 */
app.post('/login-check', (req, res) => {
  if (!req.headers[ACCESS_TOKEN_NAME]) {
    console.log('not login')
    res.send(
      JSON.stringify({
        loggedIn: false
      })
    )
    return
  }

  console.log('login again')

  // カスタムレスポンスヘッダーをセットします
  const id = uuid()
  console.log('uuid:', id)
  res.set({
    [ACCESS_TOKEN_NAME]: id
  })

  res.send(
    JSON.stringify({
      loggedIn: true
    })
  )
})

/**
 * get '/status?s=200'
 */
app.get('/status/:s', function(req, res) {
  console.log(req.params)
  // ゲットしたい http status がない場合はとりあえず 200 を返す
  if (!req.params.s) {
    res.status(200).send('ok')
    return
  }

  // 200 - 成功
  if (req.params.s === 200) {
    res.status(req.params.s).send('ok')
    return
  }

  // それ以外のエラー系の http status
  res.status(req.params.s).send('ng')
})

const port = 5000
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
