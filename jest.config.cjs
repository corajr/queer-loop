module.exports = {
  transform: {
    '^.+\\.bs\\.js$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: {
            node: 'current'
          },
          modules: 'commonjs'
        }]
      ]
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@glennsl/bs-jest)/)',
  ],
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'bs.js'],
  testMatch: ['**/__tests__/**/*.bs.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
}; 