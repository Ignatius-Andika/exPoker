const express = require('express')
const app = express()
const server = require('http').createServer(app)
// const io = require('socket.io').listen(server)
const io = require('socket.io',
  {
    rememberTransport: false, 
    transports: 
    [
      'websocket', 
      'flashsocket', 
      'polling'
    ], 
    wsEngine: 'ws', 
    pingTimeout: '1800000', 
    pingInterval: '1800000'
  }
).listen(server)
const lessMiddleware = require('less-middleware')
const path = require('path')
const Table = require('./poker_modules/table')
const Player = require('./poker_modules/player')
const request = require('request')

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')
// app.use(express.favicon())
app.use(express.favicon(__dirname + '/public/images/icon.png'));
app.use(express.logger('dev'))
app.use(express.bodyParser())
app.use(app.router)
app.use(lessMiddleware(__dirname + '/public'))
app.use(express.static(path.join(__dirname, 'public')))

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" // to false certified data api

// API DB URL
// var apiUrl = 'http://localhost/PokerAPI/api'
var apiUrl = 'http://mypoker.com/data/api'

// Development Only
if (app.get('env') == 'development') {
  app.use(express.errorHandler())
}

const players = []
const tables = []
var eventEmitter = {}
var uid = ''
var pswd = ''

// const port = process.env.PORT || 8000
const port = 8000
const hostname = '127.0.0.1'

// server.listen(port)
// console.log('Listening on port ' + port)

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  });

// The lobby
app.get('/', function (req, res) {
  uid = req.query['uid']
  pswd = req.query['pswd']
  uid = decodeURIComponent(atob(uid))
  pswd = decodeURIComponent(atob(pswd))
  if (!uid && !pswd) {
    res.render('index')    
  } else {
    res.render('index')
  }
})

// The lobby data (the array of tables and their data)
app.get('/lobby-data', function (req, res) {
  const lobbyTables = []
  for (const tableId in tables) {
    // Sending the public data of the public tables to the lobby screen
    lobbyTables[tableId] = {}
    lobbyTables[tableId].id = tables[tableId].public.id
    lobbyTables[tableId].name = tables[tableId].public.name
    lobbyTables[tableId].seatsCount = tables[tableId].public.seatsCount
    lobbyTables[tableId].playersSeatedCount = tables[tableId].public.playersSeatedCount
    lobbyTables[tableId].bigBlind = tables[tableId].public.bigBlind
    lobbyTables[tableId].smallBlind = tables[tableId].public.smallBlind
  }
  res.send(lobbyTables)
})

// If the table is requested manually, redirect to lobby
app.get('/table-9/:tableId', function (req, res, next) {
  uid = req.query['uid']
  pswd = req.query['pswd']
  var userId = decodeURIComponent(atob(uid))
  var tableId = req.params.tableId
  var url9 = `/table-9/${tableId}?uid=${uid}&pswd=${pswd}`
  for (i in players) {
    var playerId = players[i].public.id
  }
  try {
    if(userId !== playerId){
      res.redirect('/')
    } else {
      res.location(url9)
    }
  } catch (error) {
    console.log('ERROR TABLE 9', error);
  }
})

// If the table is requested manually, redirect to lobby
app.get('/table-7/:tableId', function (req, res) {
  uid = req.query['uid']
  pswd = req.query['pswd']
  var userId = decodeURIComponent(atob(uid))
  var tableId = req.params.tableId
  var url7 = `/table-7/${tableId}?uid=${uid}&pswd=${pswd}`
  for (i in players) {
    var playerId = players[i].public.id
  }
  try {
    if(userId !== playerId){
      res.redirect('/')
    } else {
      res.location(url7)
    }
  } catch (error) {
    console.log('ERROR TABLE 7', error);
  }
})

// If the table is requested manually, redirect to lobby
app.get('/table-5/:tableId', function (req, res) {
  uid = req.query['uid']
  pswd = req.query['pswd']
  var userId = decodeURIComponent(atob(uid))
  var tableId = req.params.tableId
  var url5 = `/table-5/${tableId}?uid=${uid}&pswd=${pswd}`
  for (i in players) {
    var playerId = players[i].public.id
  }
  try {
    if(userId !== playerId){
      res.redirect('/')
    } else {
      res.location(url5)
    }
  } catch (error) {
    console.log('ERROR TABLE 5', error);
  }
})

// The table data
app.get('/table-data/:tableId', function (req, res) {
  try {
    if (typeof req.params.tableId !== 'undefined' && typeof tables[req.params.tableId] !== 'undefined') {
      res.send({ table: tables[req.params.tableId].public })
    }
  } catch (error) {
    console.log('ERROR FUNGSI TABLE', error);
  }
})

io.sockets.on('connection', function (socket) {
  socket.handshake.headers
  socket.connected = true
  console.log(`socket.io connected: ${socket.id}`);
  console.log("Socket Connection: ", socket.connected);

  /**
   * When a player enters a room
   * @param object table-data
   */
  socket.on('enterRoom', function (tableId) {
    if (typeof players[socket.id] !== 'undefined' && players[socket.id].room === null) {
      // Add the player to the socket room
      socket.join('table-' + tableId)
      // Add the room to the player's data
      players[socket.id].room = tableId
    }
  })

  /**
   * When a player leaves a room
   */
  socket.on('leaveRoom', function (callback) {
    if (typeof players[socket.id] !== 'undefined' && players[socket.id].room !== null && players[socket.id].sittingOnTable === false) {
      // Remove the player from the socket room
      socket.leave('table-' + players[socket.id].room)
      // Remove the room to the player's data
      players[socket.id].room = null
      
      const id = players[socket.id].public.id
      const balance = players[socket.id].chips
      const balancePlay = players[socket.id].public.chipsInPlay
      const balanceAmount = balance + balancePlay
      request({ url: `${apiUrl}/memberpoker/${id}`, method: 'PUT', json: balanceAmount}, callback)
    }
  })

  /**
   * When a player disconnects
   */
  socket.on('disconnect', function (callback) {
    const id = players[socket.id].public.id
    const balance = players[socket.id].chips
    const balancePlay = players[socket.id].public.chipsInPlay
    const balanceAmount = balance + balancePlay
    request({ url: `${apiUrl}/memberpoker/${id}`, method: 'PUT', json: balanceAmount}, callback)

    // If the socket points to a player object
    if (typeof players[socket.id] !== 'undefined') {
      // If the player was sitting on a table
      if (players[socket.id].sittingOnTable !== false && typeof tables[players[socket.id].sittingOnTable] !== 'undefined') {
        // The seat on which the player was sitting
        const seat = players[socket.id].seat
        // The table on which the player was sitting
        const tableId = players[socket.id].sittingOnTable
        // Remove the player from the seat
        tables[tableId].playerLeft(seat)
      }
      // Remove the player object from the players array
      delete players[socket.id]
      console.log('Client Disconnected');
      console.log('SOCKET ID DISCONNECT: ', socket.id);
      console.log('Socket Connection: ', socket.connected);
      console.log('DISSCONNECT REASON: ', callback);
    }
  })

  /**
   * When a player leaves the table
   * @param function callback
   */
  socket.on('leaveTable', function (callback) {
    // If the player was sitting on a table
    if (players[socket.id].sittingOnTable !== false && tables[players[socket.id].sittingOnTable] !== false) {
      // The seat on which the player was sitting
      const seat = players[socket.id].seat
      // The table on which the player was sitting
      const tableId = players[socket.id].sittingOnTable
      // Remove the player from the seat
      tables[tableId].playerLeft(seat)
      // Send the number of total chips back to the user
      callback({ success: true, totalChips: players[socket.id].chips })

      const id = players[socket.id].public.id
      const balance = players[socket.id].chips
      const balancePlay = players[socket.id].public.chipsInPlay
      const balanceAmount = balance + balancePlay
      request({ url: `${apiUrl}/memberpoker/${id}`, method: 'PUT', json: balanceAmount}, callback)
    }
  })

  /**
   * When a new player enters the application
   * @param string newScreenName
   * @param function callback
   */
  socket.on('register', function (uid, pswd, callback) {
    // If a new screen name is posted
    if (uid !== 'undefined' && pswd !== 'undefined') {
      var memberUrl = apiUrl+'/memberpoker/'+uid+'/'+ pswd

      request(memberUrl, function (err, res, req) {
        if (err) {
          console.log('REQUEST PLAYER ERROR', err);
        } else {
          var member = JSON.parse(req);
        }


        for (let i in member) {

          var memberId = member[i].Member_UserID
          var screenName = member[i].MemberUserName
          var balanceAmount = member[i].BalanceAmount

          // If the new screen name is not an empty string
          if (screenName && typeof players[socket.id] === 'undefined') {
            let nameExists = false
            for (const i in players) {
              if (players[i].public.name && players[i].public.name == screenName) {
                nameExists = true
                break
              }
            }

            if (!nameExists) {
              // Creating the player object
              players[socket.id] = new Player(socket, memberId, screenName, balanceAmount)
              callback({ success: true, screenName: screenName, totalChips: players[socket.id].chips, lobbyUrl: `?uid=${uid}` })

              var player = {}
              player.id = players[socket.id].socket.id
              player.data = players[socket.id].public 
              player.balance = players[socket.id].chips

            } else {
              callback({ success: false, message: 'This account is taken' })
            }

          } else {
            callback({ success: false, message: 'Wrong ID / Password' })
          }

        }

      })

    } else {
      callback({ success: false, message: 'Username and Password Undefined' })
      delete players[socket.id]
    }
  })

  /**
   * When a player requests to sit on a table
   * @param function callback
   */
  socket.on('sitOnTheTable', function (data, callback) {
    if (
      // A seat has been specified
      typeof data.seat !== 'undefined' &&
      // A table id is specified
      typeof data.tableId !== 'undefined' &&
      // The table exists
      typeof tables[data.tableId] !== 'undefined' &&
      // The seat number is an integer and less than the total number of seats
      typeof data.seat === 'number' &&
      data.seat >= 0 &&
      data.seat < tables[data.tableId].public.seatsCount &&
      typeof players[socket.id] !== 'undefined' &&
      // The seat is empty
      tables[data.tableId].seats[data.seat] == null &&
      // The player isn't sitting on any other tables
      players[socket.id].sittingOnTable === false &&
      // The player had joined the room of the table
      players[socket.id].room === data.tableId &&
      // The chips number chosen is a number
      typeof data.chips !== 'undefined' &&
      !isNaN(parseInt(data.chips)) &&
      isFinite(data.chips) &&
      // The chips number is an integer
      data.chips % 1 === 0
    ) {
      // The chips the player chose are less than the total chips the player has
      if (data.chips > players[socket.id].chips) { callback({ success: false, error: 'You don\'t have that many chips' }) } else if (data.chips > tables[data.tableId].public.maxBuyIn || data.chips < tables[data.tableId].public.minBuyIn) { callback({ success: false, error: 'The amount of chips should be between the maximum and the minimum amount of allowed buy in' }) } else {
        // Give the response to the user
        callback({ success: true })
        // Add the player to the table
        tables[data.tableId].playerSatOnTheTable(players[socket.id], data.seat, data.chips)
      }
    } else {
      // If the user is not allowed to sit in, notify the user
      callback({ success: false })
    }
  })

  /**
   * When a player who sits on the table but is not sitting in, requests to sit in
   * @param function callback
   */
  socket.on('sitIn', function (callback) {
    if (players[socket.id].sittingOnTable !== false && players[socket.id].seat !== null && !players[socket.id].public.sittingIn) {
      // Getting the table id from the player object
      const tableId = players[socket.id].sittingOnTable
      tables[tableId].playerSatIn(players[socket.id].seat)
      callback({ success: true })
    }
  })

  /**
   * When a player posts a blind
   * @param bool postedBlind (Shows if the user posted the blind or not)
   * @param function callback
   */
  socket.on('postBlind', function (postedBlind, callback) {
    if (players[socket.id].sittingOnTable !== false) {
      const tableId = players[socket.id].sittingOnTable
      const activeSeat = tables[tableId].public.activeSeat

      if (tables[tableId] &&
        typeof tables[tableId].seats[activeSeat].public !== 'undefined' &&
        tables[tableId].seats[activeSeat].socket.id === socket.id &&
        (tables[tableId].public.phase === 'smallBlind' || tables[tableId].public.phase === 'bigBlind')
      ) {
        if (postedBlind) {
          callback({ success: true })
          if (tables[tableId].public.phase === 'smallBlind') {
            tables[tableId].playerPostedSmallBlind()
          } else {
            tables[tableId].playerPostedBigBlind()
          }
        } else {
          tables[tableId].playerSatOut(players[socket.id].seat)
          callback({ success: true })
        }
      }
    }
  })

  /**
   * When a player checks
   * @param function callback
   */
  socket.on('check', function (callback) {
    if (players[socket.id].sittingOnTable !== 'undefined') {
      const tableId = players[socket.id].sittingOnTable
      const activeSeat = tables[tableId].public.activeSeat

      if (tables[tableId] &&
        tables[tableId].seats[activeSeat].socket.id === socket.id &&
        !tables[tableId].public.biggestBet || (tables[tableId].public.phase === 'preflop' && tables[tableId].public.biggestBet === players[socket.id].public.bet) &&
        ['preflop', 'flop', 'turn', 'river'].indexOf(tables[tableId].public.phase) > -1
      ) {
        // Sending the callback first, because the next functions may need to send data to the same player, that shouldn't be overwritten
        callback({ success: true })
        tables[tableId].playerChecked()
      }
    }
  })

  /**
   * When a player folds
   * @param function callback
   */
  socket.on('fold', function (callback) {
    if (players[socket.id].sittingOnTable !== false) {
      const tableId = players[socket.id].sittingOnTable
      const activeSeat = tables[tableId].public.activeSeat

      if (tables[tableId] && tables[tableId].seats[activeSeat].socket.id === socket.id && ['preflop', 'flop', 'turn', 'river'].indexOf(tables[tableId].public.phase) > -1) {
        // Sending the callback first, because the next functions may need to send data to the same player, that shouldn't be overwritten
        callback({ success: true })
        tables[tableId].playerFolded()
      }
    }
  })

  /**
   * When a player calls
   * @param function callback
   */
  socket.on('call', function (callback) {
    if (players[socket.id].sittingOnTable !== 'undefined') {
      const tableId = players[socket.id].sittingOnTable
      const activeSeat = tables[tableId].public.activeSeat

      if (tables[tableId] && tables[tableId].seats[activeSeat].socket.id === socket.id && tables[tableId].public.biggestBet && ['preflop', 'flop', 'turn', 'river'].indexOf(tables[tableId].public.phase) > -1) {
        // Sending the callback first, because the next functions may need to send data to the same player, that shouldn't be overwritten
        callback({ success: true })
        tables[tableId].playerCalled()
      }
    }
  })

  /**
   * When a player bets
   * @param number amount
   * @param function callback
   */
  socket.on('bet', function (amount, callback) {
    if (players[socket.id].sittingOnTable !== 'undefined') {
      const tableId = players[socket.id].sittingOnTable
      const activeSeat = tables[tableId].public.activeSeat

      if (tables[tableId] && tables[tableId].seats[activeSeat].socket.id === socket.id && !tables[tableId].public.biggestBet && ['preflop', 'flop', 'turn', 'river'].indexOf(tables[tableId].public.phase) > -1) {
        // Validating the bet amount
        amount = parseInt(amount)
        if (amount && isFinite(amount) && amount <= tables[tableId].seats[activeSeat].public.chipsInPlay) {
          // Sending the callback first, because the next functions may need to send data to the same player, that shouldn't be overwritten
          callback({ success: true })
          tables[tableId].playerBetted(amount)
        }
      }
    }
  })

  /**
   * When a player raises
   * @param function callback
   */
  socket.on('raise', function (amount, callback) {
    if (players[socket.id].sittingOnTable !== 'undefined') {
      const tableId = players[socket.id].sittingOnTable
      const activeSeat = tables[tableId].public.activeSeat

      if (
        // The table exists
        typeof tables[tableId] !== 'undefined' &&
        // The player who should act is the player who raised
        tables[tableId].seats[activeSeat].socket.id === socket.id &&
        // The pot was betted
        tables[tableId].public.biggestBet &&
        // It's not a round of blinds
        ['preflop', 'flop', 'turn', 'river'].indexOf(tables[tableId].public.phase) > -1 &&
        // Not every other player is all in (in which case the only move is "call")
        !tables[tableId].otherPlayersAreAllIn()
      ) {
        amount = parseInt(amount)
        if (amount && isFinite(amount)) {
          amount -= tables[tableId].seats[activeSeat].public.bet
          if (amount <= tables[tableId].seats[activeSeat].public.chipsInPlay) {
            // Sending the callback first, because the next functions may need to send data to the same player, that shouldn't be overwritten
            callback({ success: true })
            // The amount should not include amounts previously betted
            tables[tableId].playerRaised(amount)
          }
        }
      }
    }
  })

  /**
   * When a message from a player is sent
   * @param string message
   */
  socket.on('sendMessage', function (message) {
    message = message.trim()
    if (message && players[socket.id].room) {
      socket.broadcast.to('table-' + players[socket.id].room).emit('receiveMessage', { message: htmlEntities(message), sender: players[socket.id].public.name })
    }
  })
})

/**
 *  * Event emitter function that will be sent to the table objects
 * Tables use the eventEmitter in order to send events to the client
 * and update the table data in the ui
 * @param string tableId
 */
eventEmitter = function (tableId) {
  return function (eventName, eventData) {
    io.sockets.in('table-' + tableId).emit(eventName, eventData)
  }
}

/**
 * Changes certain characters in a string to html entities
 * @param string str
 */
function htmlEntities(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Get Data Table from API
request(`${apiUrl}/tablepoker`, function (err, res, req) {
  if (err) {
    console.log(err);
  } else {
    var data = JSON.parse(req);
  }
  for (const id in data) {
    const dt = data[id]
    tables[id] = new Table(dt.TableID, dt.TableName, eventEmitter(id), dt.SeatsCount, dt.BigBlind, dt.SmallBlind, dt.Maxbuy, dt.MinBuy)
  }
})