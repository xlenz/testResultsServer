module.exports = {
    "parser": "esprima",
    "env": {
        "browser": true,
        "node": true,
        "mongo": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "off",
            "unix"
        ],
        "quotes": [
            "warn",
            "single"
        ],
        "semi": [
            "warn",
            "always"
        ]
    },
    "globals": {
        "log": true,
        "CONFIG": true
    }
};