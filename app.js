const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io').listen(server)
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

//
// const cookieSession = require('cookie-session') 
// app.use(cookieSession({
//   name: 'player-session',

//   // Cookie Options
//   maxAge: 6 * 60 * 60 * 1000 // 24 hours
// }))

const cookieParser = require('cookie-parser');
const { unescape } = require('querystring')
app.use(cookieParser());

// function pushCookie() {
  // app.use(function (req, res, next) {
  //   // check if client sent cookie
  //   var cookie = req.cookies.cookieName;
  //   const dt = []
  //   for (const i in players) {
  //     var name = players[i].public.name
  //   }
  //   for (const i in tables){
  //     dt[i] = {}
  //     dt[i].id = tables[i].public.id
  //     var tname = tables[i].public.name
  //     dt[i].seatsCount = tables[i].public.seatsCount
  //     dt[i].playersSeatedCount = tables[i].public.playersSeatedCount
  //     dt[i].bigBlind = tables[i].public.bigBlind
  //     dt[i].smallBlind = tables[i].public.smallBlind
  //   }
  //   if (cookie === undefined) {
  //     // no: set a new cookie
  //     var randomNumber=Math.random().toString();
  //     randomNumber=randomNumber.substring(2,randomNumber.length);
  //     res.cookie('DATA TABLE',tname, { maxAge: 900000, httpOnly: true });
  //     res.cookie('DATA PLAYER',name, { maxAge: 900000, httpOnly: true });
  //     // res.cookie('PLAYER',player, { maxAge: 900000, httpOnly: true });
  //     console.log('cookie created successfully');
  //   } else {
  //     // yes, cookie was already present 
  //     console.log('cookie exists', cookie);
  //   } 
  //   next(); // <-- important!
  // });
// }
// 

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" // to false certified api

// API DB URL
// var apiUrl = 'http://localhost/PokerAPI/api'
var apiUrl = 'http://mypoker.com/data/api/'

// Development Only
if (app.get('env') == 'development') {
  app.use(express.errorHandler())
}

const players = []
const tables = []
var eventEmitter = {}
var uid = ''
var pswd = ''

const port = process.env.PORT || 8000
// const port = 8000
// const hostname = '127.0.0.1'

server.listen(port)
console.log('Listening on port ' + port)

// server.listen(port, hostname, () => {
//   console.log(`Server running at http://${hostname}:${port}/`);
//   });

// 
// io.sockets.on('connection', function (socket) {
//

// The lobby
app.get('/', function (req, res) {
  uid = req.query['uid']
  pswd = req.query['pswd']
  console.log('INI PARAM USER ID', uid);
  console.log('INI PARAM PASSWORD', pswd);
  res.render('index')
})

//
// app.get('/lobby', function (req, res) {
//   console.log('INI PARAM USER ID', req.query['uid']);
//   console.log('INI PARAM PASSWORD', req.query['pswd']);
//   res.render('index')
// })

// app.get(`/uid=:userId&paswd=:password`, function (req, res, err) {
//     var player = {
//         userId: req.params.userId,
//         password: req.params.password
//     };
//     console.log('get param login', player);
//     res.render('PARAM USER ID', req.params.userId);
// })

// app.get('/uid/:userId/pswd/:password', function (req, res) {
//   // res.render('index')
//   var player = {
//     userId: req.params.userId,
//     password: req.params.password
//   };
//   console.log('get param login', player);
//   res.render('index');
// })
// 

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

  // 
  const player = []
  for (const i in players) {
    player[i] = {}
    player[i].id = players[i].public.id
    player[i].name = players[i].public.name
    player[i].chips = players[i].chips

    var pemain = {}
    pemain.id = players[i].public.id
    pemain.name = players[i].public.name
    pemain.chips = players[i].chips
    // pl.room = player[i].room
  }
  res.cookie("table", lobbyTables);
  res.cookie("player", player);
  console.log('COOKIE PLAYER', player);
  // var table = JSON.parse(cookie("table"));
  // console.log('COOKIE TABLE', table);

  res.send(lobbyTables)
})

// If the table is requested manually, redirect to lobby
app.get('/table-9/:tableId', function (req, res) {
  // for (const i in players) {
  //     if (!players[i].public.name && players[i].public.name !== newScreenName) {
  //       try {
  //         res.redirect('/')
  //       } catch (error) {
  //         console.log('REFRESH ERROR', error);
  //       } 
  //     }
  //   // var name = players[i].public.name
  //   // res.cookie('DATA PLAYER',players[i].public.name, { maxAge: 900000, httpOnly: true });
  //   // res.redirect('..')
  //   console.log('ROUTE TABLE 9');
  // }
  // // res.redirect('/')
  for (const i in players) {
    player = players[i]
    console.log('DATA Player Meja 9', player);
  }
  try {
    if (typeof req.params.tableId !== 'undefined' && typeof tables[req.params.tableId] !== 'undefined') {
      // res.send({ table: tables[req.params.tableId].public })

      // res.cookie('Player Data', 'randomNumber', { maxAge: 900000, httpOnly: true });
      console.log('REQ PARAM TABLE', req.params.tableId);
      // console.log('TABLES REQ PARAM TABLE', tables[req.params.tableId]);
      // if (typeof players[id] !== 'undefined'){
      //   console.log('PLAYER REQ PARAM',players[id] );
      // }
      // res.redirect('/')
      const tableId = req.params.tableId
      res.redirect(`/table-9/${tableId}`)
    }
  } catch (error) {
    console.log('ERROR TABLE 9', error);
  }
})

// If the table is requested manually, redirect to lobby
app.get('/table-7/:tableId', function (req, res) {
  // const id = req.params.tableId
  // res.redirect(`/table-7/${id}`)
  res.redirect('back')
  // for (const i in players) {
  //   var player = players[i]  
  //   if (player === "undefined"){
  //     try {
  //       res.redirect('/')
  //       console.log('SOCKET TABLE 7 UNDEFINED', player);         
  //     } catch (error) {
  //       console.log('ERROR TABLE 7 UNDEFINED');
  //     }
  //   }
  //   if (player !== 'undefined') {
  //     try {

  //       // 
  //       const dplayer = []
  //       for (const i in players) {
  //         dplayer[i] = {}
  //         dplayer[i].id = players[i].public.id
  //         dplayer[i].name = players[i].public.name
  //         dplayer[i].chips = players[i].chips

  //         var pemain = {}
  //         pemain.id = players[i].public.id
  //         pemain.name = players[i].public.name
  //         pemain.chips = players[i].chips
  //         // pl.room = player[i].room
  //       }
  //       // const dp = JSON.stringify(player)
  //       res.cookie("DataPlayer", dplayer, {maxAge: 900000, httpOnly: true} )
  //       console.log("PEMAIN", pemain);
  //       //

  //       console.log('SOCKET TABLE 7', dplayer); 
  //     } catch (error) {
  //       console.log('ERROR Table 7', error);
  //     }
  //   } 
  //   // else {
  //   //   try {
  //   //     res.redirect('/')
  //   //     console.log('SOCKET TABLE 7 UNDEFINED', player);         
  //   //   } catch (error) {
  //   //     console.log('ERROR TABLE 7 UNDEFINED');
  //   //   }
  //   // } 
  // }
  // console.log('DATA Player Meja 7', player);
})

// If the table is requested manually, redirect to lobby
app.get('/table-5/:tableId', function (req, res) {
//   for (const i in players) {
//     if (!players[i].public.name && players[i].public.name !== newScreenName) {
//       try {
//         res.redirect('/')
//       } catch (error) {
//         console.log('REFRESH ERROR', error);
//       } 
//     }
//     console.log('PLAYER SCREEN NAME', players[i].public.name);
// }
  // res.redirect('/')
  // res.render('index')
  // res.end
  // res.redirect(req.originalUrl)
  // res.redirect(req.get('referer'));

  for (const i in players) {
    var player = players[i]
    var play = {}
    play.socket = player.socket.id
    play.playerId = player.public.id 
    play.name = player.public.name
    play.balance = player.chips

    console.log('DATA Player Meja 5', play);
  }
  try {
    if (typeof req.params.tableId !== 'undefined' && typeof tables[req.params.tableId] !== 'undefined') {
      // res.send({ table: tables[req.params.tableId].public })
      var tableId = req.params.tableId

      // res.cookie('Player Data', 'randomNumber', { maxAge: 900000, httpOnly: true });
      console.log('REQ PARAM TABLE', req.params.tableId);
      // console.log('TABLES REQ PARAM TABLE', tables[req.params.tableId]);
      // if (typeof players[id] !== 'undefined'){
      //   console.log('PLAYER REQ PARAM',players[id] );
      // }
      res.redirect('/')
      // res.redirect(`/table-5/:${tableId}`)
    }
  } catch (error) {
    console.log('ERROR TABLE 5', error);
  }
})

// The table data
app.get('/table-data/:tableId', function (req, res) {
  try {
    if (typeof req.params.tableId !== 'undefined' && typeof tables[req.params.tableId] !== 'undefined') {
      // 
      const player = []
      for (const i in players) {
        player[i] = {}
        player[i].id = players[i].public.id
        player[i].name = players[i].public.name
        player[i].chips = players[i].chips

        var pemain = {}
        pemain.id = players[i].public.id
        pemain.name = players[i].public.name
        pemain.chips = players[i].chips
        // pl.room = player[i].room
      }
      // const dp = JSON.stringify(player)
      //
      
      res.cookie("DataPlayer", player, {maxAge: 900000, httpOnly: true} )
      // res.cookie("supportedProjects", JSON.stringify([2500,4,6]) );
      // res.cookie("hi", [1,2,3])
      // const json_str = getCookie('supportedProjects');
      // const arr = JSON.parse(json_str);
      // res.cookie("Players In Room" , player);
      // res.write(JSON.stringify(player))
      // res.write({ table: tables[req.params.tableId].public })
      res.send({ table: tables[req.params.tableId].public })
      console.log('FUNGSI TABLE DATA', { table: tables[req.params.tableId].public }, {player: player}, pemain,  req.params.tableId);
      // console.log('DATA COOKIE', cookie);


    }
  } catch (error) {
    console.log('ERROR FUNGSI TABLE', error);
  }
})

io.sockets.on('connection', function (socket) {
  //
  // socket.handshake.headers
  socket.id = uid
  socket.connected = true
  console.log(`socket.io connected: ${socket.id}`);
  // save socket.io socket in the session
  // console.log("session at socket.io connection:\n", socket.request.session);
  console.log("Socket Connection: ", socket.connected);
  // socket.request.session.socketio = socket.id;
  // socket.request.session.save(); 

  uid = decode(uid)
  pswd = decode(pswd)

  console.log('USER ID = ', uid);
  console.log('PASSWORD = ', pswd);

  loginParams()

  // if (uid !== 'undefined' && pswd !== 'undefined') {
  //   var newScreenName = newScreenName.trim()
  //   var password = password.trim()

  //   request(`${apiUrl}/memberpoker/${newScreenName}/${password}`, function (err, res, req) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       var member = JSON.parse(req);
  //     }


  //     for (let i in member) {

  //       var memberId = member[i].Member_UserID
  //       var newScreenName = member[i].MemberUserName
  //       var balanceAmount = member[i].BalanceAmount

  //       // If the new screen name is not an empty string
  //       if (newScreenName && typeof players[socket.id] === 'undefined') {
  //         let nameExists = false
  //         for (const i in players) {
  //           if (players[i].public.name && players[i].public.name == newScreenName) {
  //             nameExists = true
  //             break
  //           }
  //         }

  //         if (!nameExists) {
  //           // Creating the player object
  //           players[socket.id] = new Player(socket, memberId, newScreenName, balanceAmount)
  //           callback({ success: true, screenName: newScreenName, totalChips: players[socket.id].chips })

  //           var player = {}
  //           player.id = players[socket.id].socket.id
  //           player.data = players[socket.id].public 
  //           player.balance = players[socket.id].chips
  //           console.log('DATA PLAYERS MASUK', player);
            
  //           try {
  //               const player = []
  //               const dt = []
  //               for (const i in players) {
  //                 player[i] = {}
  //                 player[i].id = players[i].public.id
  //                 player[i].name = players[i].public.name
  //                 // player[i].chips = players[i].chips
  //               }
  //               for (const i in tables){
  //                 dt[i] = {}
  //                 dt[i].id = tables[i].public.id
  //                 var tname = tables[i].public.name
  //                 dt[i].name = tables[i].public.name
  //                 dt[i].seatsCount = tables[i].public.seatsCount
  //                 dt[i].playersSeatedCount = tables[i].public.playersSeatedCount
  //                 dt[i].bigBlind = tables[i].public.bigBlind
  //                 dt[i].smallBlind = tables[i].public.smallBlind
  //               }
  //                 res.cookie('DATA TABLE',dt, { maxAge: 900000, httpOnly: true });
  //                 res.cookie('DATA PLAYER',player, { maxAge: 900000, httpOnly: true });
  //                 console.log('cookie created successfully');
  //                 console.log('cookie exists', cookie);
  //               next(); // <-- important!                
  //           } catch (error) {
  //             console.log('INI ERROR COOKIE', error);
  //           } 

  //         } else {
  //           callback({ success: false, message: 'This account is taken' })
  //         }

  //       } else {
  //         callback({ success: false, message: 'Wrong ID / Password' })
  //       }

  //     }

  //   })

  // } else {
  //   callback({ success: false, message: 'Enter Username and Password' })
  // }
  

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
  socket.on('leaveRoom', function () {
    if (typeof players[socket.id] !== 'undefined' && players[socket.id].room !== null && players[socket.id].sittingOnTable === false) {
      // Remove the player from the socket room
      socket.leave('table-' + players[socket.id].room)
      // Remove the room to the player's data
      players[socket.id].room = null
    }
  })

  /**
   * When a player disconnects
   */
  socket.on('disconnect', function () {
    // If the socket points to a player object
    // if (typeof players[socket.id] !== 'undefined') {
    //   // If the player was sitting on a table
    //   if (players[socket.id].sittingOnTable !== false && typeof tables[players[socket.id].sittingOnTable] !== 'undefined') {
    //     // The seat on which the player was sitting
    //     const seat = players[socket.id].seat
    //     // The table on which the player was sitting
    //     const tableId = players[socket.id].sittingOnTable
    //     // Remove the player from the seat
    //     tables[tableId].playerLeft(seat)
    //   }
    //   // Remove the player object from the players array
    //   delete players[socket.id]
    // }

    console.log('Client Disconnected');
    console.log('SOCKET ID DISCONNECT', socket.id);
    console.log('Socket Connection: ', socket.connected);
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
      request({ url: `${apiUrl}/memberpoker/${id}`, method: 'PUT', json: balance}, callback)
      console.log('PLAYER ID', id);
      console.log('PLAYER BALANCE', balance);
    }
  })

  /**
   * When a new player enters the application
   * @param string newScreenName
   * @param function callback
   */
  // 
  socket.on('register', function (newScreenName, password, callback) {

    // If a new screen name is posted
    if (typeof newScreenName !== 'undefined' && typeof password !== 'undefined') {
      var newScreenName = newScreenName.trim()
      var password = password.trim()

      request(`${apiUrl}/memberpoker/${newScreenName}/${password}`, function (err, res, req) {
        if (err) {
          console.log(err);
        } else {
          var member = JSON.parse(req);
        }


        for (let i in member) {

          var memberId = member[i].Member_UserID
          var newScreenName = member[i].MemberUserName
          var balanceAmount = member[i].BalanceAmount

          // If the new screen name is not an empty string
          if (newScreenName && typeof players[socket.id] === 'undefined') {
            let nameExists = false
            for (const i in players) {
              if (players[i].public.name && players[i].public.name == newScreenName) {
                nameExists = true
                break
              }
            }

            if (!nameExists) {
              // Creating the player object
              players[socket.id] = new Player(socket, memberId, newScreenName, balanceAmount)
              callback({ success: true, screenName: newScreenName, totalChips: players[socket.id].chips })

              var player = {}
              player.id = players[socket.id].socket.id
              player.data = players[socket.id].public 
              player.balance = players[socket.id].chips
              console.log('DATA PLAYERS MASUK', player);

              // 
              // let cookieString = socket.request.headers.cookie;
              // console.log('INI COOKIE STRING', cookieString);

              // const player = []
              // for (const i in players) {
              //   // Sending the public data of the public tables to the lobby screen
              //   player[i] = {}
              //   player[i].id = players[i].public.id
              //   player[i].name = players[i].public.name
              //   player[i].chips = players[i].chips
              //   // player[i].room = player[i].room
              // }
              // console.log('TEST DATA PLAYER', player);

              //
              try {
                // app.use(function (req, res, next) {
                  // check if client sent cookie
                  // var cookie = req.cookies.cookieName;
                  const player = []
                  const dt = []
                  for (const i in players) {
                    player[i] = {}
                    player[i].id = players[i].public.id
                    player[i].name = players[i].public.name
                    // player[i].chips = players[i].chips
                  }
                  for (const i in tables){
                    dt[i] = {}
                    dt[i].id = tables[i].public.id
                    var tname = tables[i].public.name
                    dt[i].name = tables[i].public.name
                    dt[i].seatsCount = tables[i].public.seatsCount
                    dt[i].playersSeatedCount = tables[i].public.playersSeatedCount
                    dt[i].bigBlind = tables[i].public.bigBlind
                    dt[i].smallBlind = tables[i].public.smallBlind
                  }
                  // if (cookie === undefined) {
                    // no: set a new cookie
                    // var randomNumber=Math.random().toString();
                    // randomNumber=randomNumber.substring(2,randomNumber.length);
                    res.cookie('DATA TABLE',dt, { maxAge: 900000, httpOnly: true });
                    res.cookie('DATA PLAYER',player, { maxAge: 900000, httpOnly: true });
                    // res.cookie('PLAYER',player, { maxAge: 900000, httpOnly: true });
                    console.log('cookie created successfully');
                  // } else {
                    // yes, cookie was already present 
                    console.log('cookie exists', cookie);
                  // } 
                  next(); // <-- important!
                // });                
              } catch (error) {
                console.log('INI ERROR COOKIE', error);
              } 
              // 

            } else {
              callback({ success: false, message: 'This account is taken' })
            }

          } else {
            callback({ success: false, message: 'Wrong ID / Password' })
          }

        }

      })

    } else {
      callback({ success: false, message: 'Enter Username and Password' })
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
 * Event emitter function that will be sent to the table objects
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

//decode64 URL Params String
function decode(input){
  var keyStr = "ABCDEFGHIJKLMNOP" +
  "QRSTUVWXYZabcdef" +
  "ghijklmnopqrstuv" +
  "wxyz0123456789+/" ;

  var output = "";
  var chr1, chr2, chr3 = "";
  var enc1, enc2, enc3, enc4 = "";
  var i = 0;

  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

  do {
     enc1 = keyStr.indexOf(input.charAt(i++));
     enc2 = keyStr.indexOf(input.charAt(i++));
     enc3 = keyStr.indexOf(input.charAt(i++));
     enc4 = keyStr.indexOf(input.charAt(i++));

     chr1 = (enc1 << 2) | (enc2 >> 4);
     chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
     chr3 = ((enc3 & 3) << 6) | enc4;

     output = output + String.fromCharCode(chr1);

     if (enc3 != 64) {
        output = output + String.fromCharCode(chr2);
     }
     if (enc4 != 64) {
        output = output + String.fromCharCode(chr3);
     }

     chr1 = chr2 = chr3 = "";
     enc1 = enc2 = enc3 = enc4 = "";

  } while (i < input.length);

  return unescape(output);
}

function loginParams() { 
if (uid !== 'undefined' && pswd !== 'undefined') {
  console.log('INI UID LOGIN PARAMS = ', uid);
  console.log('INI PSWD LOGIN PARAMS = ', pswd);

  request(`${apiUrl}/memberpoker/${uid}/${pswd}`, function (err, res, req) {
    if (err) {
      console.log(err);
    } else {
      var member = JSON.parse(req);
    }


    for (let i in member) {

      var memberId = member[i].Member_UserID
      var newScreenName = member[i].MemberUserName
      var balanceAmount = member[i].BalanceAmount

      // If the new screen name is not an empty string
      if (newScreenName && typeof players[socket.id] === 'undefined') {
        let nameExists = false
        for (const i in players) {
          if (players[i].public.name && players[i].public.name == newScreenName) {
            nameExists = true
            break
          }
        }

        if (!nameExists) {
          // Creating the player object
          players[socket.id] = new Player(socket, memberId, newScreenName, balanceAmount)
          callback({ success: true, screenName: newScreenName, totalChips: players[socket.id].chips })

          var player = {}
          player.id = players[socket.id].socket.id
          player.data = players[socket.id].public 
          player.balance = players[socket.id].chips
          console.log('DATA PLAYERS MASUK', player);
          
        } else {
          callback({ success: false, message: 'This account is taken' })
        }

      } else {
        callback({ success: false, message: 'Wrong ID / Password' })
      }

    }

  })

} else {
  // callback({ success: false, message: 'Enter Username and Password' })
  alert("Your User ID and Password doesn't match!!\n" +
        "Please Relogin!\n");
} 
}