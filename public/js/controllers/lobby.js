app.controller('LobbyController', ['$scope', '$rootScope', '$http', '$location', function ($scope, $rootScope, $http, $location) {
    $scope.lobbyTables = []
    // $scope.newScreenName = ''
    
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

    function decode(input){            //Decode URL Params String
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

    var parValues = $location.search();
    var uid = parValues.uid
    var pswd = parValues.pswd
    uid = decode(uid)
    pswd = decode(pswd)
    var reqMember = `/data/api/memberpoker/${uid}/${pswd}`

    console.log('ROOTSCOPE NAME = ', $rootScope.screenName);
    console.log('ROOTSCOPE PASSWORD = ', $rootScope.password);
    console.log('ROOTSCOPE BALANCE = ', $rootScope.totalChips);
    console.log('PARAMETER VALUES', parValues);
    console.log('PARAMETER VALUES UID = ', uid);
    console.log('PARAMETER VALUES PSWD = ', pswd);

    if (uid && pswd) {
        console.log('UID DAN PSWD MASUK!!');
        try {
        socket.emit('register', uid, pswd, function (response) {
            console.log('SOCKET EMIT REGISTER');
            if (response.success) {
                $rootScope.screenName = response.screenName
                $rootScope.password = response.password
                $rootScope.totalChips = response.totalChips
                $scope.registerError = ''
                $rootScope.$digest()
            } else if ('INI RESPONSE ERROR REGISTER', response.message) {
                $scope.registerError = response.message
            }
            $scope.$digest()
            const player = {}
            player.name = $rootScope.screenName
            player.password = $rootScope.password
            player.balance = $rootScope.totalChips
            console.log('DATA NAME', $rootScope.screenName);
            console.log('DATA PASSWORD', response.password);
            console.log('DATA PLAYER', player);
            console.log('NEW SCREENNAME', $scope.newScreenName);
            console.log('PASWORD', $scope.password);
            console.log('RESPONSE PLAYER', response);
        })   
        } catch (error) {
         console.log('SOCKET EMIT REGISTER ERROR', error);   
        }
    }

    $http({
        url: reqMember,
        method: 'GET'
    }).success(function (data, status, headers, config) {
        // for (i in data) {
        //     data_player = data[i]
        // }
        // console.log('INI DATA PLAYER', data_player);
        console.log('INI DATA PLAYER', data);
    })
    // 

    // $scope.reloadRoute = function() {
 
    //     // Reload only the route which will re-instantiate
    //     $route.reload();
    // };

    // disconnect socket
    $scope.disconnect = function () {
        window.top.close()
        // $location.url('/404');
        // socket.emit('disconnect')
    }
}])
