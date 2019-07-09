const functions = require('firebase-functions')
const cors = require('cors')
const express = require('express')
const curl = new (require('curl-request'))()
const TorrentSearchApi = require('torrent-search-api')

TorrentSearchApi.enableProvider('1337x')
const app = express()
const secKey = 'newhouse'
const qbitTorrentCred = {
  host: 'http://192.168.0.10:8080',
  username: 'admin',
  password: 'password'
}

const getMovieInfo = async (query) => {
  try {
    let data = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=2388873e04ec158e7436ea33b73e5002&language=en-US&page=1&query=${encodeURIComponent(
        query
      )}`
    )
    return await data.json()
  } catch (error) {
    return error
  }
}

// Automatically allow cross-origin requests
app.use(cors({ origin: true }))

// Add middleware to authenticate requests
app.use(function(req, res, next) {
  let apiSecKey = req.body.apiSecKey
  if (apiSecKey === secKey) {
    next()
  } else {
    res.json('false')
  }
})

app.post('/auth', async (req, res, next) => {
  res.json('true')
})

app.post('/startDownload', async (req, res, next) => {
  let type = req.body.type
  let magnet = req.body.magnet
  let savepath =
    type === 'movie'
      ? 'C:/Users/jeremy/Videos/Movies'
      : 'C:/Users/jeremy/Videos/TV Shows'

  // Login
  curl
    .setHeaders([`Referer: ${qbitTorrentCred.host}`])
    .setBody(
      'username=' +
        qbitTorrentCred.username +
        '&password=' +
        qbitTorrentCred.password
    )
    .post(qbitTorrentCred.host + '/login')
    .then(({ statusCode, body, headers }) => {
      let currentCookie = headers['set-cookie'][0]
      currentCookie = currentCookie.split(';')[0]

      // Download
      curl
        .setHeaders([
          `Referer: ${qbitTorrentCred.host}`,
          'Content-Type: application/x-www-form-urlencoded',
          'Cookie: ' + currentCookie
        ])
        .setBody('urls=' + magnet + '&savepath=' + savepath)
        .post(qbitTorrentCred.host + '/command/download')
        .then(({ statusCode, body, headers }) => {
          res.json('success')
        })
    })
    .catch((e) => {
      console.log(e)
      res.json('fail')
    })
})

//Routes
app.post('/getEpisodes', async (req, res, next) => {
  let query = req.body.query
  let resultLimit = 10

  const series = await TorrentSearchApi.search(query, 'TV', resultLimit)
  let seriesList = await series.map(async (serie, index) => {
    // set magnet
    let magnet = await TorrentSearchApi.getMagnet(serie)
    serie.magnet = magnet
    return serie
  })
  let data = { episodeList: await Promise.all(seriesList) }

  res.json(data)
})

app.post('/getLatestMovies', async (req, res, next) => {
  let resultLimit = 10

  const movies = await TorrentSearchApi.search('1080', 'Movies', resultLimit)
  let moviesList = await movies.map(async (serie, index) => {
    let magnet = await TorrentSearchApi.getMagnet(serie)
    serie.magnet = magnet
    return serie
  })

  let data = await Promise.all(moviesList)

  let latestMovies = data.map(async (movie) => {
    let formatTitle = movie.title.replace(/ *\([^)]*\) */g, '')
    formatTitle = formatTitle.replace(/ *\[[^\]]*]/g, '')

    let seriesInfo = await getMovieInfo(formatTitle)
    let posterUrl = ''

    if (seriesInfo.results[0]) {
      posterUrl = `http://image.tmdb.org/t/p/w185/${
        seriesInfo.results[0].poster_path
      }`
    }

    return seriesInfo
      ? {
          magnet: movie.magnet,
          posterUrl,
          id: movie.peers,
          title: movie.title
        }
      : null
  })

  res.json(await Promise.all(latestMovies))
})

app.post('/', async (req, res, next) => {
  let query = req.body.query
  let resultLimit = 5

  // Movies
  const movies = await TorrentSearchApi.search(query, 'Movies', resultLimit)
  let movieList = await movies.map(async (movie, index) => {
    // set magnet
    let magnet = await TorrentSearchApi.getMagnet(movie)
    movie.magnet = magnet
    return movie
  })

  // Tv Shows
  const series = await TorrentSearchApi.search(query, 'TV', resultLimit)
  let seriesList = await series.map(async (serie, index) => {
    // set magnet
    let magnet = await TorrentSearchApi.getMagnet(serie)
    serie.magnet = magnet
    return serie
  })

  // Export
  let data = {
    moviesList: await Promise.all(movieList),
    seriesList: await Promise.all(seriesList)
  }
  res.json(data)
})

exports.api = functions.https.onRequest(app)
