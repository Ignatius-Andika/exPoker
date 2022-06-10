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

    var parValues = $location.search();
    var uid = parValues.uid
    var pswd = parValues.pswd
    var mainUrl = $location.url()
    $scope.mainUrl = mainUrl
    uid = decodeURIComponent(atob(uid))
    pswd = decodeURIComponent(atob(pswd))

    if (uid && pswd) {
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
