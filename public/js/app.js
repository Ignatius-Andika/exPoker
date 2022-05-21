const socket = io.connect(
    'http://127.0.0.1:8000/',
    {
        // transports: ["websocket"], 
        // allowUpgrades: false,
        // pingTimeout: 1800000, 
        // pingInterval: 1800000,
        // "sid": "FSDjX-WRwSA4zTZMALqx",
        "transports": ["websocket"], 
        "allowUpgrades": "false",
        "upgrades": ["false"],
        // "upgrades": ["websocket"],
        "pingInterval": "1800000",
        "pingTimeout": "1800000"
    }
    );

const app = angular.module('app', ['ngRoute', 'ngCookies']).config(function ($routeProvider, $locationProvider,) {

    $routeProvider.when('/table-9/:tableId', {
        templateUrl: '/partials/table-9-handed.html',
        controller: 'TableController'
    })

    $routeProvider.when('/table-7/:tableId', {
        templateUrl: '/partials/table-7-handed.html',
        controller: 'TableController'
    })

    $routeProvider.when('/table-5/:tableId', {
        templateUrl: '/partials/table-5-handed.html',
        controller: 'TableController'
    })

    $routeProvider.when('/', {
        templateUrl: '/partials/lobby.html',
        controller: 'LobbyController'
    })

    // $routeProvider.otherwise({ redirectTo: '/' })

    $locationProvider.html5Mode(true).hashPrefix('!')
})

app.run(function ($rootScope, $location) {
    $rootScope.screenName = ''
    $rootScope.totalChips = 0
    $rootScope.sittingOnTable = ''
})

function url($location) {
    var loginUrl = $location.url()
    return loginUrl
}
