
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

        //
        $scope.raised = 0
        var parValues = $location.search();
        var uid = parValues.uid
        var pswd = parValues.pswd
        var mainUrl = $location.url()
        var mainUrl = `?uid=${uid}&pswd=${pswd}`
        mainUrl = mainUrl.toString()
        // 

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

        // 
        $scope.minBet=function(){
            const proposedBet = +$scope.table.biggestBet + $scope.table.bigBlind
            var input = $scope.betAmount
            var minCount = input - 5
            minCount = minCount < proposedBet ? proposedBet : minCount
            $scope.betAmount = minCount
            console.log('INI BET AMOUNT = ', $scope.betAmount);
            console.log('INI BIGGEST BET = ', $scope.table.biggestBet);
            console.log('INI BIG BLIND = ', $scope.table.bigBlind);
            console.log('INI PROPOSED BET = ', proposedBet);
            console.log('INI MIN COUNT = ', minCount);
            console.log('VALUE SCOPE IN TABLE = ', $scope);
        }

        $scope.plusBet=function(){
            const proposedBet = +$scope.table.biggestBet + $scope.table.bigBlind
            var input = $scope.betAmount
            var plusCount = input + 5
            var maxBet = $scope.table.seats[$scope.mySeat].chipsInPlay
            plusCount = plusCount > maxBet ? maxBet : plusCount
            $scope.betAmount = plusCount
            console.log('INI BET AMOUNT = ', $scope.betAmount);
            console.log('INI BIGGEST BET = ', $scope.table.biggestBet);
            console.log('INI BIG BLIND = ', $scope.table.bigBlind);
            console.log('INI PROPOSED BET = ', proposedBet);
            console.log('INI PLUS COUNT = ', plusCount);
            console.log('INI MAX BET = ', maxBet);
            console.log('VALUE SCOPE IN TABLE = ', $scope);
        }

        
        $scope.allInAmount = function () {
            if ($scope.mySeat === null || typeof $scope.table.seats[$scope.mySeat] === 'undefined' || $scope.table.seats[$scope.mySeat] == null) return 0
            const allInAmount = $scope.table.seats[$scope.mySeat].chipsInPlay
            return allInAmount
        }

        $scope.allIn = function (){
            if ($scope.actionState === 'actNotBettedPot') { //BET
                const allInAmount = $scope.table.seats[$scope.mySeat].chipsInPlay + $scope.table.seats[$scope.mySeat].bet
                $scope.betAmount = allInAmount
                console.log('BET POT ALL IN = ', $scope.betAmount);
                console.log('VALUE ALL IN = ', allInAmount);
                console.log('INI BET STANDARD CALL = ', $scope.table.seats[$scope.mySeat].bet);
                $scope.bet()
                $scope.betAmount = 0
            }
            if ($scope.actionState === 'actBettedPot') { //RAISE
                const allInAmount = $scope.table.seats[$scope.mySeat].chipsInPlay + $scope.table.seats[$scope.mySeat].bet
                $scope.betAmount = allInAmount
                console.log('RAISE POT ALL IN = ', $scope.betAmount);
                console.log('VALUE ALL IN = ', allInAmount);
                console.log('INI BET STANDARD CALL = ', $scope.table.seats[$scope.mySeat].bet);
                $scope.raise()
                $scope.betAmount = 0
            }
        }
        // 

        $scope.minBetAmount = function () {
            if ($scope.mySeat === null || typeof $scope.table.seats[$scope.mySeat] === 'undefined' || $scope.table.seats[$scope.mySeat] === null) return 0
            // If the pot was raised
            if ($scope.actionState === 'actBettedPot') {
                const proposedBet = +$scope.table.biggestBet + $scope.table.bigBlind
                console.log('MIN BET AMOUNT PROPOSED = ', proposedBet);
                console.log('BIGGEST BET = '+$scope.table.biggestBet );
                return $scope.table.seats[$scope.mySeat].chipsInPlay < proposedBet ? $scope.table.seats[$scope.mySeat].chipsInPlay : proposedBet
            } else {
                return $scope.table.seats[$scope.mySeat].chipsInPlay < $scope.table.bigBlind ? $scope.table.seats[$scope.mySeat].chipsInPlay : $scope.table.bigBlind
            }
        }

        $scope.maxBetAmount = function () {
            if ($scope.mySeat === null || typeof $scope.table.seats[$scope.mySeat] === 'undefined' || $scope.table.seats[$scope.mySeat] === null) return 0
            var maxbet = $scope.table.seats[$scope.mySeat].chipsInPlay + $scope.table.seats[$scope.mySeat].bet 
            console.log('MAX BET AMOUNT = ', maxbet);
            console.log('MY SEAT BEAT = ', $scope.table.seats[$scope.mySeat].bet  );
            return $scope.actionState === 'actBettedPot' ? $scope.table.seats[$scope.mySeat].chipsInPlay + $scope.table.seats[$scope.mySeat].bet  :  $scope.table.seats[$scope.mySeat].chipsInPlay
        }

        $scope.callAmount = function () {
            if ($scope.mySeat === null || typeof $scope.table.seats[$scope.mySeat] === 'undefined' || $scope.table.seats[$scope.mySeat] == null) return 0
            // const callAmount = +$scope.table.biggestBet - $scope.table.seats[$scope.mySeat].bet
            const callAmount = +$scope.table.biggestBet
            // const callAmount = $scope.table.seats[$scope.mySeat].bet
            // console.log('CALL AMOUNT = ', callAmount);
            console.log('ACTION STATE = ', $scope.actionState);
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
            // return $scope.actionState === 'actOthersAllIn' || $scope.actionState === 'actBettedPot' && !($scope.actionState === 'actBettedPot' && $scope.table.biggestBet == $scope.table.seats[$scope.mySeat].bet)
            return $scope.actionState === 'actBettedPot' && !($scope.actionState === 'actBettedPot' && $scope.table.biggestBet == $scope.table.seats[$scope.mySeat].bet)
        }

        // 
        $scope.showAllinButton = function () {
            return $scope.actionState === 'actOthersAllIn'
        }
        // 

        $scope.showBetButton = function () {
            return $scope.actionState === 'actNotBettedPot' && $scope.table.seats[$scope.mySeat].chipsInPlay && $scope.table.biggestBet < $scope.table.seats[$scope.mySeat].chipsInPlay
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

        // 
        $scope.showAllIn = function () {
            return (
                $scope.actionState === 'actNotBettedPot' || 
                $scope.actionState === 'actBettedPot'
            ) && 
                $scope.table.seats[$scope.mySeat].chipsInPlay && 
                $scope.table.biggestBet < $scope.table.seats[$scope.mySeat].chipsInPlay 
        }
        // 

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
            // $scope.postBlind(false)
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
                    console.log('RAISED AFTER CALL: ', $scope.raised);
                }
            })
        }

        $scope.bet = function () {
            socket.emit('bet', $scope.betAmount, function (response) {
                if (response.success) {
                    sounds.playBetSound()
                    $scope.actionState = ''
                    $scope.$digest()
                    $scope.raised = 0
                }
            })
        }

        $scope.raise = function () {
            console.log('SCOPE RAISE: ', $scope.raised);
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
            // 
            console.log('TABLE LOG ACTION', $scope.table.log.action);
            // 
            switch (data.log.action) {
                case 'fold':
                    sounds.playFoldSound()
                    $scope.actionState = ''
                    $scope.raised = 0
                    break
                case 'check':
                    sounds.playCheckSound()
                    $scope.actionState = ''
                    $scope.raised = 0
                    break
                case 'call':
                    sounds.playCallSound()
                    $scope.actionState = ''
                    $scope.raised = 0
                    break
                case 'bet':
                    sounds.playBetSound()
                    $scope.actionState = ''
                    $scope.raised = 0
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
        })

        // When the player is asked to place the small blind
        socket.on('postSmallBlind', function (data) {
            console.log('SMALL BLIND');
            $scope.actionState = 'postSmallBlind'
            $scope.$digest()
            // $scope.timeOutBlind()
            // if ($scope.mySeat === null || 
            //     typeof $scope.table.seats[$scope.mySeat] === 'undefined' || 
            //     $scope.table.seats[$scope.mySeat] === null || 
            //     // $scope.actionState !== 'postBigBlind' || 
            //     $scope.actionState !== 'postSmallBlind' || 
            //     $rootScope.sittingIn === false) {
            //     clearTimeout(this.timeOutSB) 
            //     console.log('CLEAR TIMEOUT SMILE BLIND');
            // } else {
            //     this.timeOutSB = setTimeout(() => {
            //         // $scope.postBlind(true)
            //         console.log('POST SMALL BLIND TIMEOUT');
            //     }, 20000)
            // }

            // if ($scope.mySeat|| 
            //     typeof $scope.table.seats[$scope.mySeat] !== 'undefined' || 
            //     $scope.table.seats[$scope.mySeat]||
            //     $scope.actionState === 'postSmallBlind' || 
            //     $rootScope.sittingIn === true) {
            //         this.timeOutSB = setTimeout(() => {
            //             // $scope.postBlind(true)
            //             console.log('POST SMALL BLIND TIMEOUT');
            //         }, 20000)
            // } else {
            //     clearTimeout(this.timeOutSB) 
            //     console.log('CLEAR TIMEOUT SMALL BLIND');
            // }
        })

        // When the player is asked to place the big blind
        socket.on('postBigBlind', function (data) {
            console.log('BIG BLIND');
            $scope.actionState = 'postBigBlind'
            $scope.$digest()
            // $scope.timeOutBlind()
            // console.log('TIMEOUT BIG BLIND : ', $scope.timeOutBlind);
            // console.log('ROOTSCOPE SITTING ON TABLE BIGBLIND : ', $rootScope.sittingOnTable);
            // console.log('ROOTSCOPE SITTING IN BIGBLIND : ', $rootScope.sittingIn);
            // if ($scope.actionState !== 'postBigBlind' || $rootScope.sittingIn === false) {
            //     clearTimeout(this.timeOutSB) 
            //     console.log('CLEAR TIMEOUT BIG BLIND');
            // } else {
            //     this.timeOutSB = setTimeout(() => {
            //         $scope.postBlind(true)
            //         console.log('POST BIG BLIND TIMEOUT');
            //     }, 20000)
            // }

            // if ($scope.mySeat|| 
            //     typeof $scope.table.seats[$scope.mySeat] !== 'undefined' || 
            //     $scope.table.seats[$scope.mySeat]|| 
            //     $scope.actionState === 'postBigBlind' ||
            //     $rootScope.sittingIn === true) {
            //         this.timeOutSB = setTimeout(() => {
            //             // $scope.postBlind(true)
            //             console.log('POST BIG BLIND TIMEOUT');
            //         }, 20000)
            // } else {
            //     clearTimeout(this.timeOutSB) 
            //     console.log('CLEAR TIMEOUT BIG BLIND');
            // }
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
        })
    }])
