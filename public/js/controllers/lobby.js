app.controller('LobbyController', ['$scope', '$rootScope', '$http', function ($scope, $rootScope, $http, $route) {
    $scope.lobbyTables = []
    // $scope.newScreenName = ''
    
    $http({
        url: '/lobby-data',
        method: 'GET'
    }).success(function (data, status, headers, config) {
        for (tableId in data) {
            $scope.lobbyTables[tableId] = data[tableId]
        }
        console.log('INI DATA', data);
    })

    $scope.register = function () {
        // If there is some trimmed value for a new screen name and password
        if ($scope.newScreenName && $scope.password) {
            socket.emit('register', $scope.newScreenName, $scope.password, function (response) {
                if (response.success) {
                    $rootScope.screenName = response.screenName
                    $rootScope.password = response.password
                    $rootScope.totalChips = response.totalChips
                    $scope.registerError = ''
                    $rootScope.$digest()
                } else if (response.message) {
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
                
            })
        }
    }

    $scope.reloadRoute = function() {
 
        // Reload only the route which will re-instantiate
        $route.reload();
    };

    // disconnect socket
    $scope.disconnect = function () {
        socket.emit('disconnect')
    }
}])
