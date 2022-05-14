app.controller('LobbyController', ['$scope', '$rootScope', '$http', '$location', '$cookies', '$cookieStore',  function ($scope, $rootScope, $http, $location, $cookies, $cookieStore,) {
    $scope.lobbyTables = []
    
    $http({
        url: '/lobby-data',
        method: 'GET'
    }).success(function (data, status, headers, config) {
        for (tableId in data) {
            $scope.lobbyTables[tableId] = data[tableId]
        }
    })

    // $scope.register = function () {
    //     // If there is some trimmed value for a new screen name and password
    //     if ($scope.newScreenName && $scope.password) {
    //         socket.emit('register', $scope.newScreenName, $scope.password, function (response) {
    //             if (response.success) {
    //                 $rootScope.screenName = response.screenName
    //                 $rootScope.password = response.password
    //                 $rootScope.totalChips = response.totalChips
    //                 $scope.registerError = ''
    //                 $rootScope.$digest()
    //             } else if ('INI RESPONSE ERROR REGISTER', response.message) {
    //                 $scope.registerError = response.message
    //             }
    //             $scope.$digest()
    //             const player = {}
    //             player.name = $rootScope.screenName
    //             player.password = $rootScope.password
    //             player.balance = $rootScope.totalChips
    //             console.log('DATA NAME', $rootScope.screenName);
    //             console.log('DATA PASSWORD', response.password);
    //             console.log('DATA PLAYER', player);
    //             console.log('NEW SCREENNAME', $scope.newScreenName);
    //             console.log('PASWORD', $scope.password);
    //             console.log('RESPONSE PLAYER', response);
    //         })
    //     }
    // }

    var parValues = $location.search();
    var uid = parValues.uid
    var pswd = parValues.pswd
    var mainUrl = $location.url()
    $scope.mainUrl = mainUrl
    uid = decodeURIComponent(atob(uid))
    pswd = decodeURIComponent(atob(pswd))
    var reqMember = `/data/api/memberpoker/${uid}/${pswd}`

    console.log('PARAMETER VALUES', parValues);
    console.log('PARAMETER VALUES UID = ', uid);
    console.log('PARAMETER VALUES PSWD = ', pswd);
    console.log('URL PARAMETER = ', mainUrl);

    var table = $scope.lobbyTables
    console.log('LOBBY TABLES = ', table);

    if (uid && pswd) {
        console.log('UID DAN PSWD MASUK!!');

        // $http({
        //     url: reqMember,
        //     method: 'GET'
        // }).success(function (data, status, headers, config) {
        //     for (i in data) {
        //         data[i].MemberPassword = 'asdfgh'
        //         var data_player = data[i]
        //         // $rootScope.screenName = data[i].MemberUserName
        //         // $rootScope.totalChips = data[i].BalanceAmount
        //         var player = {}
        //         player.name = data[i].MemberUserName
        //         player.password = data[i].MemberPassword
        //         player.balance = data[i].BalanceAmount
        //         player = JSON.stringify(player)
        //         console.log('DATA PLAYER', data_player);
        //         console.log('PLAYER = ', player);
        //     }
        // })

        try {
        socket.emit('register', uid, pswd, function (response) {
            if (response.success) {
                $rootScope.screenName = response.screenName
                $rootScope.totalChips = response.totalChips
                $scope.registerError = ''
                $rootScope.$digest()
            } else if ('INI RESPONSE ERROR REGISTER', response.message) {
                $scope.registerError = response.message
            }
            $scope.$digest()
            console.log('RESPONSE PLAYER', response);
            console.log('DATA ROOTSCOPE VALUE = ', $rootScope);
            console.log('DATA SCOPE VALUE = ', $scope);
        })   
        } catch (error) {
         console.log('SOCKET EMIT REGISTER ERROR', error);   
        }
    }

    // disconnect socket    
    $scope.disconnect = function () {
        socket.emit('disconnect')
        window.top.close()
    }
}])
