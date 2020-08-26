export function makeRequest(url) {
  return new Promise((resolve, reject) => {
    request(url, function (error, response, body) {
      if (error)                        return reject(error)
      // if (response.statusCode !== 200)   return reject(`bad status code (${response.statusCode}): ${JSON.stringify(response)}`)

      return resolve(response)
    })
  })
}