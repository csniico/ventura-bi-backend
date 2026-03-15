module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
    '^nanoid$': '<rootDir>/__mocks__/nanoid.js',
  },
  transformIgnorePatterns: ['node_modules/'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
