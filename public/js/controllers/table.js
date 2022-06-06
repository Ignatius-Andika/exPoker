
/**
 * The table controller. It keeps track of the data on the interface,
 * depending on the replies from the server.
 */
app.controller('TableController', ['$scope', '$rootScope', '$http', '$routeParams', '$timeout', 'sounds', '$location',
    function ($scope, $rootScope, $http, $routeParams, $timeout, sounds, $location) {
        const seat = null
        $scope.table = {}
        $scope.notifications = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
        $scope.showingChipsModal = false
        $scope.actionState = ''
        $scope.table.dealerSeat = null
        $scope.myCards = ['', '']
        $scope.mySeat = null
        $scope.betAmount = 0
        $rootScope.sittingOnTable = null
        const showingNotification = false

        $scope.raised = 0
        $scope.table.biggestBet = 0
        var parValues = $location.search();
        var uid = parValues.uid
        var pswd = parValues.pswd
        var mainUrl = $location.url()
        var mainUrl = `?uid=${uid}&pswd=${pswd}`
        mainUrl = mainUrl.toString()

        // Existing listeners should be removed
        
        socket.removeAllListeners()

        // Getting the table data
        $http({
            url: '/table-data/' + $routeParams.tableId,
            method: 'GET'
        }).success(function (data, status, headers, config) {
            try {
                $scope.table = data.table
                $scope.buyInAmount = data.table.maxBuyIn
                $scope.betAmount = data.table.bigBlind
            } catch (error) {
                console.log('.success error', error);
            }
        })

        // Joining the socket room
        socket.emit('enterRoom', $routeParams.tableId)

        // Minus value Bet
        $scope.minBet=function(){
            const proposedBet = +$scope.table.biggestBet + $scope.table.bigBlind
            var input = $scope.betAmount
            var minCount = input - 5
            minCount = minCount < proposedBet ? proposedBet : minCount
            $scope.betAmount = minCount
        }

        // Plus value Bet
        $scope.plusBet=function(){
            var input = $scope.betAmount
            var plusCount = input + 5
            var maxBet = $scope.table.seats[$scope.mySeat].chipsInPlay
            plusCount = plusCount > maxBet ? maxBet : plusCount
            $scope.betAmount = plusCount
        }

        // All in amount
        $scope.allInAmount = function () {
            if ($scope.mySeat === null || typeof $scope.table.seats[$scope.mySeat] === 'undefined' || $scope.table.seats[$scope.mySeat] == null) return 0
            const allInAmount = $scope.table.seats[$scope.mySeat].chipsInPlay
            return allInAmount
        }

        // All in function button
        $scope.allIn = function (){
            if ($scope.actionState === 'actNotBettedPot') { //BET
                const allInAmount = $scope.table.seats[$scope.mySeat].chipsInPlay + $scope.table.seats[$scope.mySeat].bet
                $scope.betAmount = allInAmount
                $scope.bet()
                $scope.betAmount = 0
            }
            if ($scope.actionState === 'actBettedPot') { //RAISE
                const allInAmount = $scope.table.seats[$scope.mySeat].chipsInPlay + $scope.table.seats[$scope.mySeat].bet
                $scope.betAmount = allInAmount
                $scope.raise()
                $scope.betAmount = 0
            }
        }

        $scope.minBetAmount = function () {
            if ($scope.mySeat === null || typeof $scope.table.seats[$scope.mySeat] === 'undefined' || $scope.table.seats[$scope.mySeat] === null) return 0
            // If the pot was raised
            if ($scope.actionState === 'actBettedPot') {
                const proposedBet = +$scope.table.biggestBet + $scope.table.bigBlind
                return $scope.table.seats[$scope.mySeat].chipsInPlay < proposedBet ? $scope.table.seats[$scope.mySeat].chipsInPlay : proposedBet
            } else {
                return $scope.table.seats[$scope.mySeat].chipsInPlay < $scope.table.bigBlind ? $scope.table.seats[$scope.mySeat].chipsInPlay : $scope.table.bigBlind
            }
        }

        $scope.maxBetAmount = function () {
            if ($scope.mySeat === null || typeof $scope.table.seats[$scope.mySeat] === 'undefined' || $scope.table.seats[$scope.mySeat] === null) return 0
            return $scope.actionState === 'actBettedPot' ? $scope.table.seats[$scope.mySeat].chipsInPlay + $scope.table.seats[$scope.mySeat].bet  :  $scope.table.seats[$scope.mySeat].chipsInPlay
        }

        $scope.callAmount = function () {
            if ($scope.mySeat === null || typeof $scope.table.seats[$scope.mySeat] === 'undefined' || $scope.table.seats[$scope.mySeat] == null) return 0
            const callAmount = $scope.table.biggestBet
            return callAmount > $scope.table.seats[$scope.mySeat].chipsInPlay ? $scope.table.seats[$scope.mySeat].chipsInPlay : callAmount
        }

        $scope.showLeaveTableButton = function () {
            return $rootScope.sittingOnTable !== null && (!$rootScope.sittingIn || $scope.actionState === 'waiting')
        }

        $scope.showPostSmallBlindButton = function () {
            return $scope.actionState === 'actNotBettedPot' || $scope.actionState === 'actBettedPot'
        }

        $scope.showPostBigBlindButton = function () {
            return $scope.actionState === 'actNotBettedPot' || $scope.actionState === 'actBettedPot'
        }

        $scope.showFoldButton = function () {
            return $scope.actionState === 'actNotBettedPot' || $scope.actionState === 'actBettedPot' || $scope.actionState === 'actOthersAllIn'
        }

        $scope.showCheckButton = function () {
            return $scope.actionState === 'actNotBettedPot' || ($scope.actionState === 'actBettedPot' && $scope.table.biggestBet == $scope.table.seats[$scope.mySeat].bet)
        }

        $scope.showCallButton = function () {
            console.log('ACTION STATE: ', $scope.actionState);
            console.log('BET AMOUNT: ', $scope.betAmount);
            console.log('BIGGEST BET: ', $scope.table.biggestBet);
            console.log('BIG BLIND BET: ', $scope.table.bigBlind);
            return $scope.actionState === 'actBettedPot' 
            && !($scope.actionState === 'actBettedPot' && $scope.table.biggestBet == $scope.table.seats[$scope.mySeat].bet) 
            && !($scope.table.biggestBet >= $scope.table.seats[$scope.mySeat].chipsInPlay)
        }

        $scope.showAllinButton = function () {
            return $scope.actionState === 'actBettedPot'
            && $scope.table.biggestBet >= $scope.table.seats[$scope.mySeat].chipsInPlay
        }

        $scope.showBetButton = function () {
            return $scope.raised < 3 && $scope.actionState === 'actNotBettedPot' && $scope.table.seats[$scope.mySeat].chipsInPlay && $scope.table.biggestBet < $scope.table.seats[$scope.mySeat].chipsInPlay
        }

        $scope.showRaiseButton = function () {
            return $scope.raised < 3 && $scope.actionState === 'actBettedPot' && $scope.table.seats[$scope.mySeat].chipsInPlay && $scope.table.biggestBet < $scope.table.seats[$scope.mySeat].chipsInPlay
        }

        $scope.showBetRange = function () {
            return (
                $scope.actionState === 'actNotBettedPot' || 
                $scope.actionState === 'actBettedPot'
            ) && 
                $scope.table.seats[$scope.mySeat].chipsInPlay && 
                $scope.table.biggestBet < $scope.table.seats[$scope.mySeat].chipsInPlay
        }

        $scope.showBetInput = function () {
            return (
                $scope.actionState === 'actNotBettedPot' || 
                $scope.actionState === 'actBettedPot'
            ) && 
                $scope.table.seats[$scope.mySeat].chipsInPlay && 
                $scope.table.biggestBet < $scope.table.seats[$scope.mySeat].chipsInPlay &&
                $scope.raised < 3
        }

        $scope.showAllIn = function () {
            return (
                $scope.actionState === 'actNotBettedPot' || 
                $scope.actionState === 'actBettedPot'
            ) && 
                $scope.table.seats[$scope.mySeat].chipsInPlay && 
                $scope.table.biggestBet < $scope.table.seats[$scope.mySeat].chipsInPlay 
        }

        $scope.showBuyInModal = function (seat) {
            $scope.buyInModalVisible = true
            selectedSeat = seat
        }

        $scope.potText = function () {
            if (typeof $scope.table.pot !== 'undefined' && $scope.table.pot[0].amount) {
                let potText = 'Pot: ' + $scope.table.pot[0].amount

                const potCount = $scope.table.pot.length
                if (potCount > 1) {
                    for (let i = 1; i < potCount; i++) {
                        potText += ' - Sidepot: ' + $scope.table.pot[i].amount
                    }
                }
                return potText
            }
        }

        $scope.getCardClass = function (seat, card) {
            if ($scope.mySeat === seat) {
                return $scope.myCards[card]
            } else if (typeof $scope.table.seats !== 'undefined' && typeof $scope.table.seats[seat] !== 'undefined' && $scope.table.seats[seat] && typeof $scope.table.seats[seat].cards !== 'undefined' && typeof $scope.table.seats[seat].cards[card] !== 'undefined') {
                return 'card-' + $scope.table.seats[seat].cards[card]
            } else {
                return 'card-back'
            }
        }

        $scope.seatOccupied = function (seat) {
            return !$rootScope.sittingOnTable || ($scope.table.seats !== 'undefined' && typeof $scope.table.seats[seat] !== 'undefined' && $scope.table.seats[seat] && $scope.table.seats[seat].name)
        }

        // Leaving the socket room
        $scope.leaveRoom = function () {
            socket.emit('leaveRoom')
        }

        // A request to sit on a specific seat on the table
        $scope.sitOnTheTable = function () {
            socket.emit('sitOnTheTable', { seat: selectedSeat, tableId: $routeParams.tableId, chips: $scope.buyInAmount }, function (response) {
                if (response.success) {
                    $scope.buyInModalVisible = false
                    $rootScope.sittingOnTable = $routeParams.tableId
                    $rootScope.sittingIn = true
                    $scope.buyInError = null
                    $scope.mySeat = selectedSeat
                    $scope.actionState = 'waiting'
                    $scope.$digest()
                } else {
                    if (response.error) {
                        $scope.buyInError = response.error
                        $scope.$digest()
                    }
                }
            })
        }

        // Sit in the game
        $scope.sitIn = function () {
            socket.emit('sitIn', function (response) {
                if (response.success) {
                    $rootScope.sittingIn = true
                    $rootScope.$digest()
                }
            })
        }

        // Leave the table (not the room)
        $scope.leaveTable = function () {
            socket.emit('leaveTable', function (response) {
                if (response.success) {
                    $rootScope.sittingOnTable = null
                    $rootScope.totalChips = response.totalChips
                    $rootScope.sittingIn = false
                    $scope.actionState = ''
                    $rootScope.$digest()
                    $scope.$digest()
                }
            })
        }

        // Post a blind (or not)
        $scope.postBlind = function (posted) {
            socket.emit('postBlind', posted, function (response) {
                if (response.success && !posted) {
                    $rootScope.sittingIn = false
                } else {
                    sounds.playBetSound()
                }
                $scope.actionState = ''
                $scope.$digest()
            })
        }

        $scope.check = function () {
            socket.emit('check', function (response) {
                if (response.success) {
                    sounds.playCheckSound()
                    $scope.actionState = ''
                    $scope.$digest()
                    $scope.raised = 0
                }
            })
        }

        $scope.fold = function () {
            socket.emit('fold', function (response) {
                if (response.success) {
                    sounds.playFoldSound()
                    $scope.actionState = ''
                    $scope.$digest()
                    $scope.raised = 0
                    $scope.table.biggestBet = 0
                    $scope.table.biggestBet = $scope.table.bigBlind
                }
            })
        }

        $scope.call = function () {
            socket.emit('call', function (response) {
                if (response.success) {
                    sounds.playCallSound()
                    $scope.actionState = ''
                    $scope.$digest()
                    $scope.raised = 0
                    $scope.table.biggestBet = $scope.table.bigBlind
                }
            })
        }

        $scope.bet = function () {
            socket.emit('bet', $scope.betAmount, function (response) {
                if (response.success) {
                    sounds.playBetSound()
                    $scope.actionState = ''
                    $scope.$digest()
                    $scope.table.biggestBet = $scope.table.bigBlind
                }
            })
        }

        $scope.raise = function () {
            socket.emit('raise', $scope.betAmount, function (response) {
                if (response.success) {
                    sounds.playRaiseSound()
                    $scope.actionState = ''
                    $scope.$digest()
                    $scope.raised += 1
                }
            })
        }

        // When the table data have changed
        socket.on('table-data', function (data) {
            $scope.table = data
            switch (data.log.action) {
                case 'fold':
                    sounds.playFoldSound()
                    $scope.actionState = ''
                    $scope.betAmount = $scope.table.bigBlind
                    $scope.table.biggestBet = $scope.table.bigBlind
                    break
                case 'check':
                    sounds.playCheckSound()
                    $scope.actionState = ''
                    break
                case 'call':
                    sounds.playCallSound()
                    $scope.actionState = ''
                    break
                case 'bet':
                    sounds.playBetSound()
                    $scope.actionState = ''
                    break
                case 'raise':
                    sounds.playRaiseSound()
                    $scope.actionState = ''
                    break
            }
            if (data.log.message) {
                const messageBox = document.querySelector('#messages')
                const messageElement = angular.element('<p class="log-message">' + data.log.message + '</p>')
                angular.element(messageBox).append(messageElement)
                messageBox.scrollTop = messageBox.scrollHeight
                if (data.log.notification && data.log.seat !== '') {
                    if (!$scope.notifications[data.log.seat].message) {
                        $scope.notifications[data.log.seat].message = data.log.notification
                        $scope.notifications[data.log.seat].timeout = $timeout(function () {
                            $scope.notifications[data.log.seat].message = ''
                        }, 1000)
                    } else {
                        $timeout.cancel($scope.notifications[data.log.seat].timeout)
                        $scope.notifications[data.log.seat].message = data.log.notification
                        $scope.notifications[data.log.seat].timeout = $timeout(function () {
                            $scope.notifications[data.log.seat].message = ''
                        }, 1000)
                    }
                }
            }
            $scope.$digest()
        })

        // When the game has stopped
        socket.on('gameStopped', function (data) {
            $scope.table = data
            $scope.actionState = 'waiting'
            $scope.$digest()
            $scope.betAmount = $scope.table.bigBlind
            $scope.table.biggestBet = 0
            $scope.table.biggestBet = $scope.table.bigBlind
            if ($scope.table.seats[$scope.mySeat].chipsInPlay <= 0) {
                $scope.leaveTable()
                $scope.table.biggestBet = 0
                $scope.table.biggestBet = $scope.table.bigBlind
            }
        })

        // When the player is asked to place the small blind
        socket.on('postSmallBlind', function (data) {
            $scope.actionState = 'postSmallBlind'
            $scope.$digest()
        })

        // When the player is asked to place the big blind
        socket.on('postBigBlind', function (data) {
            $scope.actionState = 'postBigBlind'
            $scope.$digest()
        })

        // When the player is dealt cards
        socket.on('dealingCards', function (cards) {
            $scope.myCards[0] = 'card-' + cards[0]
            $scope.myCards[1] = 'card-' + cards[1]
            $scope.$digest()
        })

        // When the user is asked to act and the pot was betted
        socket.on('actBettedPot', function () {
            $scope.actionState = 'actBettedPot'

            const proposedBet = +$scope.table.biggestBet + $scope.table.bigBlind
            $scope.betAmount = $scope.table.seats[$scope.mySeat].chipsInPlay < proposedBet ? $scope.table.seats[$scope.mySeat].chipsInPlay : proposedBet
            $scope.$digest()
        })

        // When the user is asked to act and the pot was not betted
        socket.on('actNotBettedPot', function () {
            $scope.actionState = 'actNotBettedPot'

            $scope.betAmount = $scope.table.seats[$scope.mySeat].chipsInPlay < $scope.table.bigBlind ? $scope.table.seats[$scope.mySeat].chipsInPlay : $scope.table.bigBlind
            $scope.$digest()
        })

        // When the user is asked to call an all in
        socket.on('actOthersAllIn', function () {
            $scope.actionState = 'actOthersAllIn'

            $scope.$digest()
            $scope.betAmount = $scope.table.bigBlind
            $scope.table.biggestBet = $scope.table.bigBlind
        })

        // 
        socket.on('chipsOut', function (data) {
            if ($scope.table.seats[$scope.mySeat].chipsInPlay <= 0) {
                $scope.leaveTable()
                $scope.table.biggestBet = 0
                $scope.table.biggestBet = $scope.table.bigBlind
            }
        })
    }])
