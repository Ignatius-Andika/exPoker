const socket = io.connect('http://localhost:8000/', {
    // path: '/socket',
    transports: ['websocket'],
    auth: { slug: 'slug', token: 'token' },
});
// io.connect("http://localhost:8000/", {transports: ["websocket"],});

const app = angular.module('app', ['ngRoute']).config(function ($routeProvider, $locationProvider) {
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

    $routeProvider.otherwise({ redirectTo: '/' })

    $locationProvider.html5Mode(true).hashPrefix('!')
})

app.run(function ($rootScope) {
    $rootScope.screenName = ''
    $rootScope.password = ''
    $rootScope.totalChips = 0
    $rootScope.sittingOnTable = ''
    console.log('DATA NAME APP', $rootScope.screenName);
    console.log('DATA PASSWORD APP', $rootScope.password);
})

