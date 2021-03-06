import fetch from 'isomorphic-unfetch'
import Router from 'next/router'
import baserUrl from '../constants/baseUrl'
import getLatestMovies from '../functions/api/getLatestMovies'
import Poster from '@tenjo/web-features/build/Data-Display/Cards/Poster/Ui/React/Styles/1/poster.1.index.js'
import List from '@tenjo/web-features/build/Data-Display/List/Ui/React/list.index.js'

const image =
  'https://images-na.ssl-images-amazon.com/images/I/818NtgncwLL._SL1500_.jpg'

const Index = ({ movies = [] }) => {
  const handlePosterClick = async ({ magnet }) => {
    window.location = magnet
  }

  return (
    <div>
      <List grid>
        {Array.isArray(movies) &&
          movies.map(({ posterUrl, title, ...rest }) => {
            return (
              <Poster
                key={posterUrl}
                src={posterUrl}
                alt={title}
                {...rest}
                onClick={handlePosterClick}
              />
            )
          })}
      </List>
    </div>
  )
}

Index.getInitialProps = async function() {
  const movies = await getLatestMovies()
  console.log(movies)

  return {
    movies
  }
}

export default Index
